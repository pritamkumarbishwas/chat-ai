import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
_connected: bool = False


async def connect_database() -> None:
    global _client, _db, _connected
    settings = get_settings()
    if not settings.MONGO_URI:
        logger.warning("MONGO_URI not set — database features disabled")
        return
    try:
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True,
        )
        _db = _client[settings.MONGO_DB_NAME]
        await _client.admin.command("ping")
        _connected = True
        logger.info(f"Connected to MongoDB: {settings.MONGO_DB_NAME}")

        # Ensure indexes
        await _db["messages"].create_index("conversation_id")
        await _db["conversations"].create_index("updated_at")
        logger.info("MongoDB indexes ensured")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        _client = None
        _db = None
        _connected = False


async def close_database() -> None:
    global _client, _db, _connected
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")
    _client = None
    _db = None
    _connected = False


def get_database() -> AsyncIOMotorDatabase:
    if _db is None or not _connected:
        raise RuntimeError("Database not connected. Is MONGO_URI configured?")
    return _db


def is_database_connected() -> bool:
    return _connected
