"""KaratPlus AI - FastAPI entry point. CORS for http://localhost:3000, static uploads."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import get_db
from app.routers import jewelry

app = FastAPI(
    title="KaratPlus AI",
    description="Demo Jewelry CAD Processing Platform",
    version="1.0.0",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads folder and static serve
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(jewelry.router)


@app.on_event("startup")
async def startup():
    await get_db()
    has_key = bool((getattr(settings, "GEMINI_API_KEY", "") or "").strip())
    print(f"KaratPlus AI: GEMINI_API_KEY set={'yes' if has_key else 'no'} (restart backend after changing .env)")


@app.get("/health")
def health():
    return {"status": "ok"}
