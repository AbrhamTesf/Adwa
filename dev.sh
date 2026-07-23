#!/usr/bin/env bash

# UI colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting FastAPI Backend and Next.js Frontend...${NC}\n"

# Function to kill child processes on exit
trap 'kill 0' EXIT

# Start Backend
(
  cd backend
  source venv/bin/activate
  echo -e "${GREEN}[Backend] Starting Uvicorn on http://localhost:8000${NC}"
  uvicorn app.main:app --reload --port 8000
) &

# Start Frontend
(
  cd frontend
  echo -e "${BLUE}[Frontend] Starting Next.js on http://localhost:3000${NC}"
  npm run dev
) &

# Wait for all background processes
wait