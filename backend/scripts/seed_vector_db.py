"""
Seed ChromaDB with verified exhibit history from shared/data/.

Usage (from backend/):
    python scripts/seed_vector_db.py
    python scripts/seed_vector_db.py --reset   # drop and recreate collection

Requires OPENAI_API_KEY in project-root .env for text-embedding-3-small.
Falls back to Chroma default embeddings (offline) with a warning if unset.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Monorepo root on sys.path for shared imports and config
ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(BACKEND))

import chromadb
from chromadb.utils import embedding_functions

from config import settings  # noqa: E402

COLLECTION_NAME = "adwa_verified_history"
PERSIST_DIR = ROOT / "chroma_data"


def load_verified_history() -> list[dict]:
    path = ROOT / "shared" / "data" / "verified_history.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("verified_history.json must be a JSON array")
    return data


def load_personas() -> dict[str, dict]:
    path = ROOT / "shared" / "data" / "personas.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_document_text(exhibit: dict) -> str:
    """Concatenate fields used for semantic retrieval."""
    key_facts = exhibit.get("key_facts", [])
    facts_text = "\n".join(
        f"- {item['fact']}: {item['value']}" for item in key_facts if "fact" in item
    )
    keywords = ", ".join(exhibit.get("keywords", []))
    tags = ", ".join(exhibit.get("personalization_tags", []))

    return (
        f"Title: {exhibit['title']}\n"
        f"Category: {exhibit['category']}\n"
        f"Location: {exhibit['location']}\n"
        f"Summary: {exhibit['summary']}\n"
        f"Full Story: {exhibit['full_story']}\n"
        f"Keywords: {keywords}\n"
        f"Personalization Tags: {tags}\n"
        f"Key Facts:\n{facts_text}\n"
        f"Citation: {exhibit['citation']}"
    )


def build_metadata(exhibit: dict) -> dict:
    """Chroma metadata — scalar values only (str, int, float, bool)."""
    return {
        "exhibit_id": exhibit["id"],
        "title": exhibit["title"],
        "artifact_id": exhibit["artifact_id"],
        "qr_code_id": exhibit["qr_code_id"],
        "category": exhibit["category"],
        "location": exhibit["location"],
        "citation": exhibit["citation"],
        "keywords": ", ".join(exhibit.get("keywords", [])),
        "personalization_tags": ", ".join(exhibit.get("personalization_tags", [])),
        "related_exhibits": ", ".join(exhibit.get("related_exhibits", [])),
    }


def get_embedding_function():
    if settings.openai_api_key:
        print("Using OpenAI text-embedding-3-small")
        return embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key,
            model_name="text-embedding-3-small",
        )
    print(
        "WARNING: OPENAI_API_KEY not set — using Chroma default embeddings. "
        "Set the key in .env for production RAG parity."
    )
    return embedding_functions.DefaultEmbeddingFunction()


def get_chroma_client(*, remote: bool = False):
    """Default: embedded persistence at chroma_data/. Pass remote=True for HTTP server."""
    if not remote:
        PERSIST_DIR.mkdir(parents=True, exist_ok=True)
        print(f"ChromaDB persistent path: {PERSIST_DIR}")
        return chromadb.PersistentClient(path=str(PERSIST_DIR))

    host = settings.chromadb_host.strip()
    hostname, _, port_str = host.partition(":")
    port = int(port_str) if port_str.isdigit() else 8000
    print(f"ChromaDB HTTP client: {hostname}:{port}")
    return chromadb.HttpClient(host=hostname, port=port)


def seed_collection(*, reset: bool = False, remote: bool = False) -> None:
    exhibits = load_verified_history()
    personas = load_personas()
    print(f"Loaded {len(exhibits)} exhibit records, {len(personas)} personas.")

    client = get_chroma_client(remote=remote)
    ef = get_embedding_function()

    if reset:
        try:
            client.delete_collection(COLLECTION_NAME)
            print(f"Dropped existing collection '{COLLECTION_NAME}'.")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine", "project": "adwa-ai-companion"},
    )

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for exhibit in exhibits:
        ids.append(exhibit["id"])
        documents.append(build_document_text(exhibit))
        metadatas.append(build_metadata(exhibit))

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    print(f"Upserted {len(ids)} documents into '{COLLECTION_NAME}'.")
    print("Sample IDs:", ", ".join(ids[:3]), "...")

    # Validate persona preferred_exhibits reference real exhibit IDs
    exhibit_ids = {e["id"] for e in exhibits}
    for persona_id, persona in personas.items():
        for pref in persona.get("preferred_exhibits", []):
            if pref not in exhibit_ids:
                print(f"WARNING: persona '{persona_id}' references unknown exhibit '{pref}'")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Adwa verified history into ChromaDB")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete and recreate the collection before seeding",
    )
    parser.add_argument(
        "--remote",
        action="store_true",
        help="Use remote ChromaDB HTTP server from CHROMADB_HOST (default: local chroma_data/)",
    )
    args = parser.parse_args()
    seed_collection(reset=args.reset, remote=args.remote)


if __name__ == "__main__":
    main()
