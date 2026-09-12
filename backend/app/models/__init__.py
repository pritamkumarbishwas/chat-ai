from pydantic import BaseModel, Field
from datetime import datetime


class ConversationDocument(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MessageDocument(BaseModel):
    id: str = Field(..., alias="_id")
    conversation_id: str
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
