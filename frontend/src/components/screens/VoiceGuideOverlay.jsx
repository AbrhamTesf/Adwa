import React from "react";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 7 — Dynamic Voice AI Tour Guide / Q&A */
export default function VoiceGuideOverlay({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const { status, captions, startListening, stopListeningAndSend } = useVoiceGuide(exhibit?.hotspot_json);

  return (
    <div className="min-h-screen flex flex-col justify-end">
      <div className="adwa-glass rounded-b-none p-6">
        <div className="flex justify-center gap-3 mb-4">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={`adwa-chip ${persona === p.id ? "border-imperial-gold" : ""}`}
              data-active={persona === p.id}
              onClick={() => setPersona(p.id)}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <p className="min-h-[3em] text-center text-parchment/90 mb-4">{captions || "Ask me anything about this exhibit."}</p>

        <div className="flex justify-center mb-4">
          <button
            className={`w-20 h-20 rounded-full adwa-btn-primary flex items-center justify-center text-2xl ${
              status === "listening" ? "shadow-gold-glow animate-pulse" : ""
            }`}
            onMouseDown={startListening}
            onMouseUp={stopListeningAndSend}
            onTouchStart={startListening}
            onTouchEnd={stopListeningAndSend}
          >
            🎙️
          </button>
        </div>
        <p className="text-center text-xs text-parchment/50 mb-4">Hold to talk, release to send</p>

        <input
          type="text"
          placeholder="Or type your question..."
          className="w-full bg-obsidian-overlay rounded-full px-4 py-2 border border-wanza-wood"
        />

        <button className="mt-4 text-sm text-adwa-emerald underline mx-auto block" onClick={() => navigate("inspection")}>
          Back to exhibit
        </button>
      </div>
    </div>
  );
}
