import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.config import get_settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    settings = get_settings()

    service = LLMService(
        provider=settings.LLM_PROVIDER,
        api_key=settings.OPENAI_API_KEY if settings.LLM_PROVIDER == "openai" else settings.GROQ_API_KEY,
        model=settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai" else settings.GROQ_MODEL,
    )

    try:
        reply = await service.generate(
            message=request.message,
            history=request.history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    conversation_id = request.conversation_id or str(uuid.uuid4())

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
    )
