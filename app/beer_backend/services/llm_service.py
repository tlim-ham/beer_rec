"""
services/llm_service.py
------------------------
Manages Gemini API calls for the beer recommendation chatbot.

Key design decisions to control inference cost:
  1. Conversation history is trimmed to a rolling window (MAX_HISTORY_TURNS).
  2. The beer context block is injected once at the start and NOT repeated
     in every follow-up turn — only user/assistant messages are kept.
  3. Token usage is tracked per session and hard-capped (BUDGET_TOKENS_PER_SESSION).
  4. The system prompt is concise and cacheable.
"""

import logging
import os
from dataclasses import dataclass, field

import google.generativeai as genai

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cost / quality knobs — tune these as needed
# ---------------------------------------------------------------------------
MODEL_NAME = "gemini-2.5-flash-lite"
MAX_OUTPUT_TOKENS = 512
MAX_HISTORY_TURNS = 6
BUDGET_TOKENS_PER_SESSION = 8_000


SYSTEM_PROMPT = """\
You are Hoppy, a friendly and knowledgeable craft-beer sommelier chatbot.
Your role is to recommend beers to users based on their flavour preferences.
Always be concise (2-4 sentences per response unless asked for more detail).
Do not recommend beers outside the provided list.
If asked something unrelated to beer, politely redirect the conversation.
"""


@dataclass
class ChatSession:
    """Holds the mutable state for one user conversation."""
    session_id: str
    beer_context: str
    history: list[dict] = field(default_factory=list)
    tokens_used: int = 0

    def is_over_budget(self) -> bool:
        return self.tokens_used >= BUDGET_TOKENS_PER_SESSION


class BudgetExceededError(Exception):
    """Raised when a session has consumed its token budget."""


class LLMService:
    """Thin wrapper around the Gemini generative AI SDK."""

    def __init__(self, api_key: str | None = None):
        key = api_key or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise EnvironmentError(
                "Gemini API key not found. Set the GEMINI_API_KEY environment "
                "variable or pass api_key= to LLMService()."
            )
        genai.configure(api_key=key)
        self._client = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=MAX_OUTPUT_TOKENS,
                temperature=0.7,
            ),
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_session(self, session_id: str, beer_context: str) -> ChatSession:
        session = ChatSession(session_id=session_id, beer_context=beer_context)

        intro_user_message = (
            "Here is a list of beers that match my flavour profile:\n\n"
            f"{beer_context}\n\n"
            "Please introduce yourself briefly and give me a 2-3 sentence "
            "summary of these beers based on my preference."
        )

        response_text, tokens = self._call_gemini(session, intro_user_message)

        # Store with correct SDK format
        session.history.append({"role": "user",  "parts": [{"text": intro_user_message}]})
        session.history.append({"role": "model", "parts": [{"text": response_text}]})
        session.tokens_used += tokens

        return session

    def chat(self, session: ChatSession, user_message: str) -> str:
        if session.is_over_budget():
            raise BudgetExceededError(
                f"Session {session.session_id} has exceeded the token budget "
                f"({BUDGET_TOKENS_PER_SESSION} tokens). Start a new session."
            )

        response_text, tokens = self._call_gemini(session, user_message)

        session.history.append({"role": "user",  "parts": [{"text": user_message}]})
        session.history.append({"role": "model", "parts": [{"text": response_text}]})
        session.tokens_used += tokens
        self._trim_history(session)

        return response_text

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call_gemini(self, session: ChatSession, new_message: str) -> tuple[str, int]:
        # History is already in correct format, just append the new message
        messages = list(session.history) + [
            {"role": "user", "parts": [{"text": new_message}]}
        ]

        response = self._client.generate_content(messages)

        text = response.text or ""
        tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens = response.usage_metadata.total_token_count or 0

        logger.debug(
            "Gemini call | session=%s tokens_this_call=%d total=%d",
            session.session_id,
            tokens,
            session.tokens_used + tokens,
        )
        return text, tokens

    @staticmethod
    def _trim_history(session: ChatSession) -> None:
        max_messages = MAX_HISTORY_TURNS * 2
        if len(session.history) > max_messages:
            session.history = session.history[:2] + session.history[-(max_messages - 2):]