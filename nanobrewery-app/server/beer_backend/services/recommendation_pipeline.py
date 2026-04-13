"""
services/recommendation_pipeline.py
-------------------------------------
Orchestrates the full recommendation flow:
  1. ModelService  – classify flavor profile → beer categories
  2. BeerService   – look up matching beers in the CSV database
  3. LLMService    – start a chat session with the beer list as context

Also manages in-memory session storage (swap for Redis/DB in production).
"""

import logging
import uuid
from typing import Optional

from ..services.model_service import ModelService
from ..services.beer_service import BeerService, _fix_encoding
from ..services.llm_service import LLMService, ChatSession, BudgetExceededError

logger = logging.getLogger(__name__)


class RecommendationPipeline:
    """End-to-end beer recommendation orchestrator."""

    def __init__(
        self,
        model_service: ModelService,
        beer_service: BeerService,
        llm_service: LLMService,
    ):
        self._model = model_service
        self._beers = beer_service
        self._llm = llm_service

        # In-memory session store: {session_id: ChatSession}
        # TODO: Replace with Redis or a DB-backed store for multi-worker deployments
        self._sessions: dict[str, ChatSession] = {}

    # ------------------------------------------------------------------
    # Step 1+2+3  — called once per user to kick off a new recommendation
    # ------------------------------------------------------------------

    def start_recommendation(self, flavor_profile: dict, selected_beer_name: str | None = None) -> dict:
        classification = self._model.classify(flavor_profile, top_n=3)
        clus_name    = classification["clus_name"]  
        style_simple  = classification["Style_simple"]

        # Call get_beers_by_categories with exclude_beer_name parameter
        beers = self._beer_svc.get_beers_by_categories(
            clus_name=clus_name,
            style_simple=style_simple,
            exclude_beer_name=selected_beer_name
        )
        
        beer_context = self._beers.format_for_prompt(beers)

        session_id = str(uuid.uuid4())
        session = self._llm.start_session(session_id, beer_context)
        self._sessions[session_id] = session
        intro_message = session.history[-1]["parts"][0]["text"]

        # Append beer list to intro message
        beer_names = "\n".join([f"{i+1}. {_fix_encoding(beer.get('Name', 'Unknown'))}" for i, beer in enumerate(beers[:10])])
        intro_with_beers = f"{intro_message}\n\nYour recommended beers:\n{beer_names}"

        # Generate suggested questions as separate array
        if len(beers) >= 2:
            beer1 = _fix_encoding(beers[0].get('Name', 'the first beer'))
            beer2 = _fix_encoding(beers[1].get('Name', 'the second beer'))
            suggested_questions = [
                f"Tell me more about {beer1} - what's its flavor profile?",
                f"What's the difference between {beer1} and {beer2}?",
                "Which of these beers would you recommend for a beginner?",
                f"What food would pair well with {beer1}?",
                f"Can you explain the brewing style of {beer2}?"
            ]
        else:
            suggested_questions = [
                "Tell me more about this beer - what's its flavor profile?",
                "What food would pair well with this beer?",
                "Can you explain the brewing style?"
            ]

        return {
            "session_id":      session_id,
            "clus_name":      clus_name,
            "Style_simple":    style_simple,
            "category_scores": classification["scores"],
            "beers_found":     beers,
            "intro_message":   intro_with_beers,
            "suggested_questions": suggested_questions,
            "tokens_used":     session.tokens_used,
        }

    # ------------------------------------------------------------------
    # Step 4+  — follow-up chat turns
    # ------------------------------------------------------------------

    def chat(self, session_id: str, user_message: str) -> dict:
        """
        Send a follow-up message within an existing recommendation session.

        Returns
        -------
        dict with keys:
            reply        : str   – the assistant's response
            tokens_used  : int   – cumulative tokens for this session
            over_budget  : bool  – True if the session is near/at its limit
        """
        session = self._get_session(session_id)

        try:
            reply = self._llm.chat(session, user_message)
        except BudgetExceededError:
            reply = (
                "I've reached the limit for this conversation. "
                "Please start a new recommendation to continue!"
            )
            return {
                "reply": reply,
                "tokens_used": session.tokens_used,
                "over_budget": True,
            }

        return {
            "reply": reply,
            "tokens_used": session.tokens_used,
            "over_budget": session.is_over_budget(),
        }

    # ------------------------------------------------------------------
    # Session management
    # ------------------------------------------------------------------

    def get_session_info(self, session_id: str) -> dict:
        session = self._get_session(session_id)
        return {
            "session_id": session_id,
            "turns": len(session.history) // 2,
            "tokens_used": session.tokens_used,
            "over_budget": session.is_over_budget(),
        }

    def end_session(self, session_id: str) -> bool:
        """Remove a session from memory."""
        return self._sessions.pop(session_id, None) is not None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_session(self, session_id: str) -> ChatSession:
        session = self._sessions.get(session_id)
        if session is None:
            raise KeyError(f"Session '{session_id}' not found. It may have expired.")
        return session
