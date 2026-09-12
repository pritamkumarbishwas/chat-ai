import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db = None


async def connect_database() -> None:
    global _client, _db
    settings = get_settings()
    if not settings.MONGO_URI:
        logger.warning("MONGO_URI not set — database features disabled")
        return
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]
    # Verify connection
    await _client.admin.command("ping")
    logger.info(f"Connected to MongoDB: {settings.MONGO_DB_NAME}")


async def close_database() -> None:
    global _client, _db
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")
    _client = None
    _db = None


def get_database():
    if _db is None:
        raise RuntimeError("Database not connected. Is MONGO_URI configured?")
    return _db
