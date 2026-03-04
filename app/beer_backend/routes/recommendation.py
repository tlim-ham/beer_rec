"""
routes/recommendation.py
-------------------------
FastAPI router for all beer recommendation endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from services.recommendation_pipeline import RecommendationPipeline
from utils.schemas import (
    StartRecommendationRequest,
    StartRecommendationResponse,
    ChatRequest,
    ChatResponse,
    SessionInfoResponse,
)
from dependencies import get_pipeline

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


@router.post(
    "/recommend",
    response_model=StartRecommendationResponse,
    summary="Start a new beer recommendation session",
    description=(
        "Accepts a flavour profile, runs it through the classifier, "
        "fetches matching beers from the database, and starts a Gemini chat "
        "session. Returns the LLM's opening message and a session_id for "
        "follow-up /chat calls."
    ),
)
async def start_recommendation(
    body: StartRecommendationRequest,
    pipeline: RecommendationPipeline = Depends(get_pipeline),
):
    try:
        result = pipeline.start_recommendation(
            flavor_profile=body.flavor_profile.model_dump(),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return StartRecommendationResponse(**result)


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Continue chatting within an existing recommendation session",
)
async def chat(
    body: ChatRequest,
    pipeline: RecommendationPipeline = Depends(get_pipeline),
):
    try:
        result = pipeline.chat(
            session_id=body.session_id,
            user_message=body.message,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")

    return ChatResponse(**result)


@router.get(
    "/session/{session_id}",
    response_model=SessionInfoResponse,
    summary="Get metadata about an active session",
)
async def session_info(
    session_id: str,
    pipeline: RecommendationPipeline = Depends(get_pipeline),
):
    try:
        info = pipeline.get_session_info(session_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return SessionInfoResponse(**info)


@router.delete(
    "/session/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="End and clean up a session",
)
async def end_session(
    session_id: str,
    pipeline: RecommendationPipeline = Depends(get_pipeline),
):
    found = pipeline.end_session(session_id)
    if not found:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
