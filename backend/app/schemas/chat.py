from pydantic import BaseModel, Field, field_validator
from enum import Enum
import uuid


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=32000)


class ChatRequest(BaseModel):
    message: str = Field(
        ..., min_length=1, max_length=32000, description="User message"
    )
    conversation_id: str | None = Field(
        None, description="Optional conversation ID (UUID v4)"
    )
    history: list[Message] = Field(
        default_factory=list,
        description="Chat history (max 50 messages)",
        max_length=50,
    )

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            uuid_obj = uuid.UUID(v, version=4)
            return str(uuid_obj)
        except ValueError:
            raise ValueError(f"Invalid conversation_id: must be a valid UUID v4, got '{v}'")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI response")
    conversation_id: str | None = Field(None, description="Conversation ID")
    model: str | None = Field(None, description="Model used for response")


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    llm_provider: str
    api_configured: bool = Field(description="Whether API key is configured")


class ErrorResponse(BaseModel):
    detail: str
    error_type: str
