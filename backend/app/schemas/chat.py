from pydantic import BaseModel, Field
from enum import Enum


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
        None, description="Optional conversation ID"
    )
    history: list[Message] = Field(
        default_factory=list,
        description="Chat history (max 50 messages)",
        max_length=50,
    )


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
