/**
 * Dummy fallback data conforming to shared/types/api.ts.
 * Used when the backend is unavailable during development.
 */

import type {
  ARArtifactResponse,
  ChatQueryResponse,
  ItineraryResponse,
  VisionAnalyzeResponse,
} from "@/types/api";

export const mockItinerary: ItineraryResponse = {
  stops: [
    {
      id: "stop-1",
      name: "Adwa Victory Monument",
      description: "Central memorial commemorating the 1896 victory.",
      latitude: 14.1667,
      longitude: 38.9,
      artifact_ids: ["artifact-monument"],
      estimated_minutes: 15,
    },
    {
      id: "stop-2",
      name: "Emperor Menelik II Square",
      description: "Historic gathering point before the march to Adwa.",
      latitude: 14.17,
      longitude: 38.905,
      artifact_ids: ["artifact-menelik-statue"],
      estimated_minutes: 20,
    },
  ],
  total_minutes: 35,
  persona: "observer",
  generated_at: new Date().toISOString(),
};

export const mockChatResponse: ChatQueryResponse = {
  answer:
    "The Battle of Adwa on March 1, 1896, was a decisive victory for Ethiopia against Italian colonial forces — a landmark moment in African history.",
  persona: "observer",
  session_id: "mock-session-001",
  sources: ["verified_history:adwa-1896"],
  audio_url: "/audio/fallback/observer-intro.mp3",
};

export const mockArtifact: ARArtifactResponse = {
  id: "artifact-monument",
  name: "Victory Monument",
  description: "A towering monument honoring the heroes of Adwa.",
  model_url: "/models/victory-monument.glb",
  thumbnail_url: "/models/victory-monument-thumb.jpg",
  narration_text:
    "This monument stands as a testament to Ethiopian unity and sovereignty.",
  audio_url: "/audio/fallback/monument-narration.mp3",
  historical_period: "1896–present",
  tags: ["monument", "adwa", "victory"],
};

export const mockVisionResponse: VisionAnalyzeResponse = {
  identified: true,
  artifact_id: "artifact-monument",
  artifact_name: "Victory Monument",
  confidence: 0.92,
  description: "Recognized the Adwa Victory Monument from the camera frame.",
  suggested_prompt: "Tell me about the Battle of Adwa memorial.",
};
