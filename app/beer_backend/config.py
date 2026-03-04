"""
config.py
----------
Application configuration loaded from environment variables / .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ------------------------------------------------------------------ #
    # Gemini API
    # ------------------------------------------------------------------ #
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"

    # ------------------------------------------------------------------ #
    # File paths
    # ------------------------------------------------------------------ #
    MODEL_PATH: str = str(BASE_DIR / "models" / "beer_classifier.pkl")
    BEER_XLSX_PATH: str = str(BASE_DIR / "data" / "beers.xlsx")

    # ------------------------------------------------------------------ #
    # Server
    # ------------------------------------------------------------------ #
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # ------------------------------------------------------------------ #
    # CORS — add your frontend origin(s) here
    # ------------------------------------------------------------------ #
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]


settings = Settings()