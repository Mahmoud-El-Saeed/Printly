import redis.asyncio as redis
from app.core import get_settings

settings = get_settings()

redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URI,
    encoding="utf-8",
    decode_responses=True,
    max_connections=20
)

def get_redis_client():
    return redis.Redis(connection_pool=redis_pool)