"""Vision analysis routes (camera frame → artifact identification)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import APIRouter

from shared.schemas.schemas import VisionAnalyzeRequest, VisionAnalyzeResponse

router = APIRouter()


@router.post("/analyze", response_model=VisionAnalyzeResponse)
async def analyze_image(request: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    # TODO: Send image_base64 to OpenAI vision model, match against artifact catalog
    return VisionAnalyzeResponse(
        identified=False,
        confidence=0.0,
        description="[Stub] Vision analysis not yet implemented.",
        suggested_prompt="What am I looking at?",
    )
