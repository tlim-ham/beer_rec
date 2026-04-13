"""
routes/recommendation.py
-------------------------
FastAPI router for all beer recommendation endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from ..services.recommendation_pipeline import RecommendationPipeline
from ..services.beer_service import BeerService
from ..services.llm_service import RateLimitError, BudgetExceededError
from ..utils.schemas import (
    StartRecommendationRequest,
    StartRecommendationResponse,
    ChatRequest,
    ChatResponse,
    SessionInfoResponse,
    BeerListResponse,
)
from ..dependencies import get_pipeline, get_beer_service

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


@router.options("/recommend")
async def options_recommend():
    """Handle CORS preflight requests for /recommend endpoint."""
    return {"message": "OK"}


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
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BudgetExceededError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return StartRecommendationResponse(**result)


@router.options("/chat")
async def options_chat():
    """Handle CORS preflight requests for /chat endpoint."""
    return {"message": "OK"}


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
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BudgetExceededError as e:
        raise HTTPException(status_code=402, detail=str(e))
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


@router.options("/beers")
async def options_beers():
    """Handle CORS preflight requests for /beers endpoint."""
    return {"message": "OK"}


@router.get(
    "/beers",
    response_model=BeerListResponse,
    summary="Get all available beers for the dropdown",
    description="Returns a list of all beers with their names and flavor profiles for the frontend dropdown.",
)
async def get_beers(
    beer_service: BeerService = Depends(get_beer_service),
):
    beers = []
    for beer in beer_service._beers:
        # Extract the flavor profile values, defaulting to 0 if missing
        beer_option = {
            "name": str(beer.get("Name", "Unknown")),
            "body": float(beer.get("Body", 0)),
            "malty": float(beer.get("Malty", 0)),
            "sour": float(beer.get("Sour", 0)),
            "fruits": float(beer.get("Fruits", 0)),
            "hoppy": float(beer.get("Hoppy", 0)),
            "bitter": float(beer.get("Bitter", 0)),
            "spices": float(beer.get("Spices", 0)),
            "salty": float(beer.get("Salty", 0)),
            "sweet": float(beer.get("Sweet", 0)),
        }
        beers.append(beer_option)
    
    return BeerListResponse(beers=beers)
