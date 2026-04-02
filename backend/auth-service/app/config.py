from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://sparklex:sparklex_secret@localhost:5432/sparklex_auth"
    REDIS_URL: str = "redis://:sparklex_redis_secret@localhost:6379/0"
    RABBITMQ_URL: str = "amqp://sparklex:sparklex_rabbit_secret@localhost:5672/sparklex_vhost"
    SECRET_KEY: str = "sparklex_jwt_secret_key_change_in_production_minimum_32_chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = ""
    GOOGLE_CLIENT_ID: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
