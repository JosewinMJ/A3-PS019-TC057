import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = BASE_DIR / "uploads"
CONFIG_DIR = BASE_DIR / "config"
REPORTS_DIR = BASE_DIR.parent / "reports"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "PrivacyLens — Personal-Data Discovery & Privacy Evidence Inventory"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{STORAGE_DIR / 'privacylens.db'}")
    RULES_PATH: Path = Path(os.getenv("RULES_CONFIG_PATH", str(CONFIG_DIR / "rules.yaml")))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    MAX_SAMPLE_ROWS: int = int(os.getenv("MAX_SAMPLE_ROWS", "100"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

settings = Settings()
