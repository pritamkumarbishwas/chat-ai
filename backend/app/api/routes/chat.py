import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from groq import APIError as GroqAPIError, RateLimitError as GroqRateLimitError, APITimeoutError as GroqTimeoutError

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.services.history_service import HistoryService
from app.core.config import get_settings, Settings
from app.core.database import get_database, is_database_connected

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


def _get_history_service() -> HistoryService | None:
    if not is_database_connected():
        return None
    try:
        db = get_database()
        return HistoryService(db)
    except RuntimeError:
        return None


async def _persist_messages(
    history_service: HistoryService | None,
    conversation_id: str,
    user_message: str,
    assistant_reply: str,
) -> None:
    if history_service is None:
        return
    try:
        exists = await history_service.conversation_exists(conversation_id)
        if not exists:
            title = user_message[:40] + ("..." if len(user_message) > 40 else "")
            await history_service.create_conversation(conversation_id, title)
        await history_service.add_message(
            conversation_id=conversation_id,
            message_id=str(uuid.uuid4()),
            role="user",
            content=user_message,
        )
        await history_service.add_message(
            conversation_id=conversation_id,
            message_id=str(uuid.uuid4()),
            role="assistant",
            content=assistant_reply,
        )
    except Exception as e:
        logger.error(f"Failed to persist chat history: {e}")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm_service),
):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    try:
        reply = await llm.generate(
            message=request.message,
            history=request.history,
        )
    except GroqRateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
    except GroqTimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out. Please try again.")
    except GroqAPIError as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in chat: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    history_service = _get_history_service()
    if history_service is None:
        logger.warning("History not saved: database not connected")
    else:
        await _persist_messages(history_service, conversation_id, request.message, reply)

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        model=llm.model,
    )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm_service),
):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    async def generate_stream():
        full_reply = []
        try:
            async for chunk in llm.generate_stream(
                message=request.message,
                history=request.history,
            ):
                full_reply.append(chunk)
                yield f"data: {chunk}\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: [ERROR]\n\n"
            return

        # Persist BEFORE [DONE] so the generator is still alive
        full_reply_text = "".join(full_reply)
        history_service = _get_history_service()
        if history_service is None:
            logger.warning("History not saved: database not connected")
        else:
            await _persist_messages(
                history_service,
                conversation_id,
                request.message,
                full_reply_text,
            )

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "X-Conversation-ID": conversation_id,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/conversations")
async def list_conversations():
    history_service = _get_history_service()
    if history_service is None:
        return {"conversations": []}
    try:
        conversations = await history_service.get_conversations()
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Failed to fetch conversations: {e}")
        return {"conversations": []}


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    history_service = _get_history_service()
    if history_service is None:
        return {"conversation_id": conversation_id, "messages": []}
    try:
        messages = await history_service.get_messages(conversation_id)
        return {"conversation_id": conversation_id, "messages": messages}
    except Exception as e:
        logger.error(f"Failed to fetch conversation: {e}")
        return {"conversation_id": conversation_id, "messages": []}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    history_service = _get_history_service()
    if history_service is None:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        await history_service.delete_conversation(conversation_id)
        return {"detail": "Conversation deleted"}
    except Exception as e:
        logger.error(f"Failed to delete conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")
