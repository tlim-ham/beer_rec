"""
config.py
----------
Application configuration loaded from environment variables / .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# config.py is at: nanobrewery-app/server/beer_backend/config.py
# We need to go up 3 levels to reach nanobrewery-app/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"BASE_DIR exists: {BASE_DIR.exists()}")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ------------------------------------------------------------------ #
    # Gemini API
    # ------------------------------------------------------------------ #
    GEMINI_API_KEY: str

    # ------------------------------------------------------------------ #
    # File paths
    # ------------------------------------------------------------------ #
    MODEL_PATH: str = str(BASE_DIR / "models" / "beer_multioutput_classifier.pkl")
    ENCODERS_PATH: str = str(BASE_DIR / "models" / "label_encoders.pkl")
    BEER_XLSX_PATH: str = str(BASE_DIR / "data" / "Beer_data (1).xlsx")

    # ------------------------------------------------------------------ #
    # Server
    # ------------------------------------------------------------------ #
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    LOG_LEVEL: str = "info"

    # ------------------------------------------------------------------ #
    # CORS — add your frontend origin(s) here
    # ------------------------------------------------------------------ #
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://beer-rec-1.onrender.com"]


settings = Settings()

logger.info(f"MODEL_PATH: {settings.MODEL_PATH}")
logger.info(f"MODEL_PATH exists: {Path(settings.MODEL_PATH).exists()}")
logger.info(f"ENCODERS_PATH: {settings.ENCODERS_PATH}")
logger.info(f"ENCODERS_PATH exists: {Path(settings.ENCODERS_PATH).exists()}")
logger.info(f"BEER_XLSX_PATH: {settings.BEER_XLSX_PATH}")
logger.info(f"BEER_XLSX_PATH exists: {Path(settings.BEER_XLSX_PATH).exists()}")