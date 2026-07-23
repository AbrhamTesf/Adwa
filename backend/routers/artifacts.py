"""AR artifact metadata routes."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import APIRouter, HTTPException

from shared.schemas.schemas import ARArtifactResponse

router = APIRouter()


@router.get("/{artifact_id}", response_model=ARArtifactResponse)
async def get_artifact(artifact_id: str) -> ARArtifactResponse:
    # TODO: Look up artifact from database or static catalog
    if artifact_id == "artifact-monument":
        return ARArtifactResponse(
            id=artifact_id,
            name="Victory Monument",
            description="A towering monument honoring the heroes of Adwa.",
            model_url="/models/victory-monument.glb",
            narration_text="This monument stands as a testament to Ethiopian unity.",
            historical_period="1896–present",
            tags=["monument", "adwa", "victory"],
        )

    raise HTTPException(status_code=404, detail=f"Artifact '{artifact_id}' not found")
