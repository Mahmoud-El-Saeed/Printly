from typing import AsyncGenerator, Generator
from app.routes.db import SessionLocal
from app.routes.redis_client import get_redis_client

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

async def get_redis() -> AsyncGenerator:
    redis_client = get_redis_client()
    try:
        yield redis_client
    finally:
        await redis_client.close()

