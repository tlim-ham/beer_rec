"""
main.py
--------
FastAPI application entry point for the Beer Recommendation backend.

Run locally:
    uvicorn main:app --reload --port 8000

Or via the helper script:
    python main.py
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.recommendation import router as recommendation_router
from dependencies import get_model_service, get_beer_service
from utils.schemas import HealthResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.LOG_LEVEL == "debug" else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="🍺 Beer Recommendation API",
    description=(
        "Recommends craft beers based on a user's flavour profile.\n\n"
        "**Pipeline:**\n"
        "1. Classify flavour profile → beer categories (ML model)\n"
        "2. Fetch matching beers from the CSV database\n"
        "3. Start a Gemini-powered chatbot session with the beer list as context\n"
        "4. Support follow-up chat turns within a session"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(recommendation_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    try:
        model_svc = get_model_service()
        model_loaded = model_svc._model is not None
    except Exception:
        model_loaded = False

    try:
        beer_svc = get_beer_service()
        beers_in_db = len(beer_svc._beers)
    except Exception:
        from services.beer_service import _load_beers
        _load_beers.cache_clear()
        beers_in_db = 0

    return HealthResponse(
        status="ok",
        model_loaded=model_loaded,
        beers_in_db=beers_in_db,
    )


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL,
    )
