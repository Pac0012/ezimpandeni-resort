from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ezimpandeni Resort API"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "ezimpandeni_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
    FRONTEND_URL: str = "http://localhost:5173"

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    ADMIN_ALERT_EMAIL: str = "luyandakhaya93@gmail.com"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [self.FRONTEND_URL, "http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()