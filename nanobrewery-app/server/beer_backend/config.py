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
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://beer-rec.onrender.com/"]


settings = Settings()