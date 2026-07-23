"""Itinerary generation routes."""

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import APIRouter

from shared.schemas.schemas import ItineraryRequest, ItineraryResponse, ItineraryStop

router = APIRouter()


@router.post("", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest) -> ItineraryResponse:
    # TODO: Query RAG + geospatial logic to build personalized stop list
    return ItineraryResponse(
        stops=[
            ItineraryStop(
                id="stub-stop-1",
                name="Adwa Victory Monument",
                description="Placeholder stop — implement during hackathon.",
                latitude=request.latitude,
                longitude=request.longitude,
                artifact_ids=["artifact-monument"],
                estimated_minutes=15,
            )
        ],
        total_minutes=15,
        persona=request.persona,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
