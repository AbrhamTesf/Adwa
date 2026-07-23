"""Load environment variables safely via pydantic-settings."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve project root (.env lives one level above backend/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    elevenlabs_api_key: str = ""
    chromadb_host: str = "localhost:8001"
    next_public_backend_url: str = "http://localhost:8000"

    @property
    def chromadb_url(self) -> str:
        host = self.chromadb_host
        if not host.startswith("http"):
            return f"http://{host}"
        return host


settings = Settings()
