"""
routes/recommendation.py
-------------------------
FastAPI router for all beer recommendation endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
import logging

from ..services.beer_service import BeerService
from ..services.recommendation_pipeline import RecommendationPipeline
from ..utils.schemas import (
    StartRecommendationRequest,
    StartRecommendationResponse,
    BeerListResponse,
)
from ..dependencies import get_pipeline, get_beer_service

router = APIRouter(prefix="/api/v1", tags=["recommendations"])

logger = logging.getLogger(__name__)

@router.options("/recommend")
async def options_recommend():
    """Handle CORS preflight requests for /recommend endpoint."""
    return {"message": "OK"}


@router.post(
    "/recommend",
    response_model=StartRecommendationResponse,
    summary="Generate beer recommendations",
    description=(
        "Accepts a flavour profile, runs it through the classifier and "
        "fetches the top beer recommendations directly from the database."
    ),
)
async def start_recommendation(
    body: StartRecommendationRequest,
    pipeline: RecommendationPipeline = Depends(get_pipeline),
):
    try:
        result = pipeline.start_recommendation(
            flavor_profile=body.flavor_profile.model_dump(),
            selected_beer_name=body.selected_beer_name,
        )
    except FileNotFoundError as e:
        logger.error(f"File not found error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)  # This logs the full traceback
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return StartRecommendationResponse(**result)


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
            # "name": str(beer.get("Name", "Unknown")),
            "name": str(beer.get("name_fixed", beer.get("Name", "Unknown"))),
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
