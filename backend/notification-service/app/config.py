from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://sparklex:sparklex_secret@localhost:5432/sparklex_notifications"
    REDIS_URL: str = "redis://:sparklex_redis_secret@localhost:6379/3"
    RABBITMQ_URL: str = "amqp://sparklex:sparklex_rabbit_secret@localhost:5672/sparklex_vhost"
    AUTH_SERVICE_URL: str = "http://auth-service:8000"
    SMTP_HOST: str = "mailhog"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@sparklex.io"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
