from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
                        env_file=".env",
                        env_file_encoding="utf-8",
                        extra='ignore')

    # PostgreSQL Database settings
    POSTGRES_URI: str
    
    # Redis settings
    REDIS_URI: str

    # JWT settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Refresh token settings
    REFRESH_TOKEN_EXPIRE_DAYS: int


def get_settings() -> Settings:
    return Settings()