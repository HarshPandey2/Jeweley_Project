"""Application configuration from environment."""

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings

# Load .env from backend directory so it works regardless of cwd
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "karatplus"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        extra = "ignore"

    @field_validator("GEMINI_API_KEY", mode="before")
    @classmethod
    def strip_api_key(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


settings = Settings()
