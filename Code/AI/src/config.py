from dataclasses import dataclass, field
from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    api_key: str = field(default="", repr=False)
    model: str = ""
    base_url: str = "https://api.b.ai/v1"
    api_secret: str = field(default="", repr=False)
    timeout_seconds: float = 25.0

    def missing_bai_settings(self) -> list[str]:
        return [name for name, value in (("BAI_API_KEY", self.api_key),
                                         ("BAI_MODEL", self.model)) if not value.strip()]


@lru_cache
def get_settings() -> Settings:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)
    timeout = float(os.getenv("BAI_TIMEOUT_SECONDS", "25"))
    if not 1 <= timeout <= 120:
        raise ValueError("BAI_TIMEOUT_SECONDS phải nằm trong khoảng 1 đến 120.")
    return Settings(
        api_key=os.getenv("BAI_API_KEY", "").strip(),
        model=os.getenv("BAI_MODEL", "").strip(),
        base_url=os.getenv("BAI_BASE_URL", "https://api.b.ai/v1").strip().rstrip("/"),
        api_secret=os.getenv("AI_SERVICE_API_SECRET", "").strip(),
        timeout_seconds=timeout,
    )
