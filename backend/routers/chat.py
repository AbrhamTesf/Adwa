"""RAG chat / voice query routes."""

import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import APIRouter

from shared.schemas.schemas import ChatQueryRequest, ChatQueryResponse

router = APIRouter()


@router.post("", response_model=ChatQueryResponse)
async def chat_query(request: ChatQueryRequest) -> ChatQueryResponse:
    # TODO: Retrieve context from ChromaDB, call OpenAI, optionally ElevenLabs TTS
    return ChatQueryResponse(
        answer=f"[Stub] Received query for persona '{request.persona.value}': {request.query}",
        persona=request.persona,
        session_id=request.session_id or str(uuid.uuid4()),
        sources=[],
        audio_url=None,
    )
