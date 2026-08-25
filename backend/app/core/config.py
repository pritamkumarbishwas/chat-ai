from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import json


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Chat AI Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"]
    )

    # LLM Provider: "mock", "openai", "groq"
    LLM_PROVIDER: str = "mock"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

    # Qdrant Vector DB
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "chat_ai"

    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "frozen": True,
    }

    @property
    def active_api_key(self) -> str:
        if self.LLM_PROVIDER == "openai":
            return self.OPENAI_API_KEY
        if self.LLM_PROVIDER == "groq":
            return self.GROQ_API_KEY
        return ""

    @property
    def active_model(self) -> str:
        if self.LLM_PROVIDER == "openai":
            return self.OPENAI_MODEL
        if self.LLM_PROVIDER == "groq":
            return self.GROQ_MODEL
        return ""

    @property
    def has_valid_api_key(self) -> bool:
        if self.LLM_PROVIDER == "mock":
            return True
        return bool(self.active_api_key)

    def model_post_init(self, __context) -> None:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                object.__setattr__(self, "CORS_ORIGINS", json.loads(self.CORS_ORIGINS))
            except json.JSONDecodeError:
                object.__setattr__(self, "CORS_ORIGINS", [o.strip() for o in self.CORS_ORIGINS.split(",")])


@lru_cache
def get_settings() -> Settings:
    return Settings()
