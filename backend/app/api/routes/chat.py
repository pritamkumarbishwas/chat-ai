import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from groq import APIError as GroqAPIError, RateLimitError as GroqRateLimitError, APITimeoutError as GroqTimeoutError

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.services.history_service import HistoryService
from app.core.config import get_settings, Settings
from app.core.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


def get_llm_service(settings: Settings = Depends(get_settings)) -> LLMService:
    if not settings.has_valid_api_key:
        raise HTTPException(
            status_code=500,
            detail=f"API key not configured for provider: {settings.LLM_PROVIDER}",
        )
    return LLMService(
        provider=settings.LLM_PROVIDER,
        api_key=settings.active_api_key,
        model=settings.active_model,
    )


def get_history_service() -> HistoryService:
    db = get_database()
    return HistoryService(db)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm_service),
    history_service: HistoryService = Depends(get_history_service),
):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    try:
        reply = await llm.generate(
            message=request.message,
            history=request.history,
        )
    except GroqRateLimitError:
        logger.warning("Groq rate limit exceeded")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
        )
    except GroqTimeoutError:
        logger.warning("Groq request timed out")
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again.",
        )
    except GroqAPIError as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {str(e)}",
        )
    except ValueError as e:
        logger.error(f"Invalid LLM provider: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in chat: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred.",
        )

    # Persist to MongoDB
    try:
        exists = await history_service.conversation_exists(conversation_id)
        if not exists:
            title = request.message[:40] + ("..." if len(request.message) > 40 else "")
            await history_service.create_conversation(conversation_id, title)

        await history_service.add_message(
            conversation_id=conversation_id,
            message_id=str(uuid.uuid4()),
            role="user",
            content=request.message,
        )
        await history_service.add_message(
            conversation_id=conversation_id,
            message_id=str(uuid.uuid4()),
            role="assistant",
            content=reply,
        )
    except Exception as e:
        logger.error(f"Failed to persist chat history: {e}")

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        model=llm.model,
    )


@router.get("/conversations")
async def list_conversations(
    history_service: HistoryService = Depends(get_history_service),
):
    try:
        conversations = await history_service.get_conversations()
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Failed to fetch conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    history_service: HistoryService = Depends(get_history_service),
):
    try:
        messages = await history_service.get_messages(conversation_id)
        return {"conversation_id": conversation_id, "messages": messages}
    except Exception as e:
        logger.error(f"Failed to fetch conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversation")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    history_service: HistoryService = Depends(get_history_service),
):
    try:
        await history_service.delete_conversation(conversation_id)
        return {"detail": "Conversation deleted"}
    except Exception as e:
        logger.error(f"Failed to delete conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")
