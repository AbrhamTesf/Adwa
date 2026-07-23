"""
Adwa AI Companion — Shared Pydantic v2 Models
Keep in sync with shared/types/api.ts
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PersonaId(str, Enum):
    MENELIK = "menelik"
    TAYTU = "taytu"
    PATRIOT = "patriot"
    OBSERVER = "observer"


class Location(BaseModel):
    latitude: float
    longitude: float


# ─── Itinerary ───────────────────────────────────────────────────────────────


class ItineraryRequest(BaseModel):
    latitude: float
    longitude: float
    persona: PersonaId
    duration_minutes: Optional[int] = Field(default=60, ge=15, le=240)


class ItineraryStop(BaseModel):
    id: str
    name: str
    description: str
    latitude: float
    longitude: float
    artifact_ids: list[str] = Field(default_factory=list)
    estimated_minutes: int = Field(ge=1)


class ItineraryResponse(BaseModel):
    stops: list[ItineraryStop]
    total_minutes: int
    persona: PersonaId
    generated_at: str


# ─── Chat ────────────────────────────────────────────────────────────────────


class ChatQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    persona: PersonaId
    session_id: Optional[str] = None
    location: Optional[Location] = None


class ChatQueryResponse(BaseModel):
    answer: str
    persona: PersonaId
    session_id: str
    sources: list[str] = Field(default_factory=list)
    audio_url: Optional[str] = None


# ─── AR Artifacts ────────────────────────────────────────────────────────────


class ARArtifactResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    name: str
    description: str
    model_url: str
    thumbnail_url: Optional[str] = None
    narration_text: str
    audio_url: Optional[str] = None
    historical_period: str
    tags: list[str] = Field(default_factory=list)


# ─── Vision Analysis ─────────────────────────────────────────────────────────


class VisionAnalyzeRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    persona: Optional[PersonaId] = None
    location: Optional[Location] = None


class VisionAnalyzeResponse(BaseModel):
    identified: bool
    artifact_id: Optional[str] = None
    artifact_name: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    description: str
    suggested_prompt: Optional[str] = None
