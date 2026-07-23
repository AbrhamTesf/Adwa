"""Adwa AI Companion — FastAPI application entry point."""

import sys
from pathlib import Path

# Allow imports from shared/ at monorepo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import artifacts, chat, itinerary, vision

app = FastAPI(
    title="Adwa AI Companion API",
    description="Voice-first & WebXR AR tour guide backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itinerary.router, prefix="/api/itinerary", tags=["itinerary"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["artifacts"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "adwa-backend"}
