/**
 * Adwa AI Companion — Shared API Contracts
 * Keep in sync with shared/schemas/schemas.py
 */

// ─── Itinerary ───────────────────────────────────────────────────────────────

export interface ItineraryRequest {
  latitude: number;
  longitude: number;
  persona: PersonaId;
  duration_minutes?: number;
}

export interface ItineraryStop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  artifact_ids: string[];
  estimated_minutes: number;
}

export interface ItineraryResponse {
  stops: ItineraryStop[];
  total_minutes: number;
  persona: PersonaId;
  generated_at: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatQueryRequest {
  query: string;
  persona: PersonaId;
  session_id?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ChatQueryResponse {
  answer: string;
  persona: PersonaId;
  session_id: string;
  sources: string[];
  audio_url?: string;
}

// ─── AR Artifacts ────────────────────────────────────────────────────────────

export interface ARArtifactResponse {
  id: string;
  name: string;
  description: string;
  model_url: string;
  thumbnail_url?: string;
  narration_text: string;
  audio_url?: string;
  historical_period: string;
  tags: string[];
}

// ─── Vision Analysis ─────────────────────────────────────────────────────────

export interface VisionAnalyzeRequest {
  image_base64: string;
  persona?: PersonaId;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface VisionAnalyzeResponse {
  identified: boolean;
  artifact_id?: string;
  artifact_name?: string;
  confidence: number;
  description: string;
  suggested_prompt?: string;
}

// ─── Shared Enums ────────────────────────────────────────────────────────────

export type PersonaId = "menelik" | "taytu" | "patriot" | "observer";
