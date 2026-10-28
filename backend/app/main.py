from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.api.endpoints import router as api_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PrivacyLens — Personal-Data Discovery & Privacy Evidence Inventory. "
                "Discovers candidate personal-data fields, connects declared purposes and retention metadata, "
                "and generates structured privacy evidence for human review.",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Mount Static Files
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def root():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "message": "Welcome to PrivacyLens API",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

@app.get("/app")
def serve_app():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"error": "UI shell not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main.py:app", host="127.0.0.1", port=8000, reload=True)
