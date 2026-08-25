import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from openai import RateLimitError, APITimeoutError, APIError
import httpx

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.core.config import get_settings, Settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


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


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    service: LLMService = Depends(get_llm_service),
):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    try:
        reply = await service.generate(
            message=request.message,
            history=request.history,
        )
    except RateLimitError:
        logger.warning("Rate limit exceeded for LLM provider")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
        )
    except APITimeoutError:
        logger.warning("LLM request timed out")
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again.",
        )
    except APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=502,
            detail="AI service returned an error. Please try again.",
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq HTTP error: {e.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail="AI service returned an error. Please try again.",
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

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        model=service.model,
    )
