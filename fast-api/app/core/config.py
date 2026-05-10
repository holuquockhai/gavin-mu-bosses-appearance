from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from urllib.parse import quote_plus

ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "mu_bosses"
    MYSQL_USERNAME: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_CHARSET: str = "utf8mb4"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        username = quote_plus(self.MYSQL_USERNAME)
        password = quote_plus(self.MYSQL_PASSWORD)
        credentials = f"{username}:{password}" if password else username
        database = quote_plus(self.MYSQL_DATABASE)
        charset = quote_plus(self.MYSQL_CHARSET)

        return (
            f"mysql+pymysql://{credentials}@{self.MYSQL_HOST}:"
            f"{self.MYSQL_PORT}/{database}?charset={charset}"
        )


settings = Settings()
