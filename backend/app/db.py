"""MongoDB connection using Motor."""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient | None = None
db = None


async def get_db():
    global client, db
    if client is None:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB]
    return db


def get_db_sync():
    """For use in sync contexts (e.g. seed script)."""
    from motor.motor_asyncio import AsyncIOMotorClient
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    return c[settings.MONGODB_DB]
