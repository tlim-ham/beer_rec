"""
dependencies.py
----------------
FastAPI dependency providers.
Services are instantiated once at startup and reused across requests.
"""

from functools import lru_cache

from services.model_service import ModelService
from services.beer_service import BeerService
from services.llm_service import LLMService
from services.recommendation_pipeline import RecommendationPipeline
from config import settings


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    return ModelService(model_path=settings.MODEL_PATH)


@lru_cache(maxsize=1)
def get_beer_service() -> BeerService:
    return BeerService(xlsx_path=settings.BEER_XLSX_PATH)


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService(api_key=settings.GEMINI_API_KEY)


@lru_cache(maxsize=1)
def get_pipeline() -> RecommendationPipeline:
    return RecommendationPipeline(
        model_service=get_model_service(),
        beer_service=get_beer_service(),
        llm_service=get_llm_service(),
    )
