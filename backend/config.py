from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./caja_contratos_v3.db"
    MINIO_URL: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_NAME: str = "contratos"
    APP_PASSWORD: str = "caja123"
    APP_SECRET_TOKEN: str = "caja_token_secreto_777"

    class Config:
        env_file = ".env"

settings = Settings()
