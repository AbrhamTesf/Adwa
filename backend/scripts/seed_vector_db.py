"""Seed ChromaDB with verified historical facts from shared/data/."""

import json
import sys
from pathlib import Path

# Monorepo root on sys.path for shared imports
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from config import settings  # noqa: E402


def load_verified_history() -> list[dict]:
    history_path = ROOT / "shared" / "data" / "verified_history.json"
    with open(history_path, encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    records = load_verified_history()
    print(f"Loaded {len(records)} verified history records.")
    print(f"ChromaDB target: {settings.chromadb_url}")

    # TODO: Connect to ChromaDB, create collection, embed and upsert records
    if not records:
        print("No records to seed — populate shared/data/verified_history.json first.")


if __name__ == "__main__":
    main()
