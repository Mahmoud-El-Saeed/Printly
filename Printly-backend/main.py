from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes.db import engine
from app.routes.redis_client import get_redis_client
from app.routes import auth_router, customer_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize resources here (e.g., database connection, Redis client)
    redis_client = get_redis_client()
    try:
        await redis_client.ping()  # Test Redis connection
    except Exception as e:
        print(f"Error occurred while testing Redis connection: {e}")

    yield  # This is where the application runs

    # Clean up resources here (e.g., close database connection, Redis client)
    await redis_client.close()  # Close Redis connection
    engine.dispose()  # Dispose of the database engine 
    
    
    
app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(customer_router)

@app.get("/")
async def read_root():
    return {"Hello": "World"}