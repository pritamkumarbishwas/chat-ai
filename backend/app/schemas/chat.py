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
    message: str = Field(..., min_length=1, max_length=32000, description="User message")
    conversation_id: str | None = Field(None, description="Optional conversation ID")
    history: list[Message] = Field(default_factory=list, description="Chat history")


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    llm_provider: str
