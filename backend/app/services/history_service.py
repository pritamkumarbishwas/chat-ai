import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_COLLECTION = "messages"


class HistoryService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_conversation(self, conversation_id: str, title: str) -> None:
        now = datetime.now(timezone.utc)
        await self.db[CONVERSATIONS_COLLECTION].insert_one({
            "_id": conversation_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
        })

    async def touch_conversation(self, conversation_id: str) -> None:
        await self.db[CONVERSATIONS_COLLECTION].update_one(
            {"_id": conversation_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}},
        )

    async def add_message(
        self, conversation_id: str, message_id: str, role: str, content: str
    ) -> None:
        await self.db[MESSAGES_COLLECTION].insert_one({
            "_id": message_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        })
        await self.touch_conversation(conversation_id)

    async def get_conversations(self) -> list[dict]:
        cursor = self.db[CONVERSATIONS_COLLECTION].find().sort("updated_at", -1)
        conversations = []
        async for doc in cursor:
            conversations.append({
                "id": doc["_id"],
                "title": doc["title"],
                "created_at": doc["created_at"].isoformat(),
                "updated_at": doc["updated_at"].isoformat(),
            })
        return conversations

    async def get_messages(self, conversation_id: str) -> list[dict]:
        cursor = self.db[MESSAGES_COLLECTION].find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1)
        messages = []
        async for doc in cursor:
            messages.append({
                "id": doc["_id"],
                "role": doc["role"],
                "content": doc["content"],
                "timestamp": doc["timestamp"].isoformat(),
            })
        return messages

    async def delete_conversation(self, conversation_id: str) -> None:
        await self.db[MESSAGES_COLLECTION].delete_many(
            {"conversation_id": conversation_id}
        )
        await self.db[CONVERSATIONS_COLLECTION].delete_one({"_id": conversation_id})

    async def conversation_exists(self, conversation_id: str) -> bool:
        count = await self.db[CONVERSATIONS_COLLECTION].count_documents(
            {"_id": conversation_id}, limit=1
        )
        return count > 0
