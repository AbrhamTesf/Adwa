import React, { useCallback, useRef } from "react";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Screen 7 — Dynamic Voice AI Tour Guide / Q&A
 *
 * FEAT-015: Mid-tour persona switcher with golden ring active indicator,
 * audio interruption on switch, and transition greeting TTS playback.
 */
export default function VoiceGuideOverlay({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const { status, captions, setCaptions, startListening, stopListeningAndSend, stopAudio } = useVoiceGuide(exhibit?.hotspot_json);

  /** Ref to the currently playing transition audio so we can abort on re-switch */
  const transitionAudioRef = useRef(null);

  /**
   * FEAT-015: Handle persona chip selection.
   * 1. Stop any currently playing audio (transition or guide response).
   * 2. Update persona in session store.
   * 3. Show the transition greeting as captions immediately.
   * 4. Fire a TTS request for the greeting so the user hears the new voice.
   */
  const handlePersonaSwitch = useCallback(
    async (newPersonaId) => {
      if (newPersonaId === persona) return;

      /* ---- 1. Interrupt any in-flight audio ---- */
      if (stopAudio) stopAudio();
      if (transitionAudioRef.current) {
        transitionAudioRef.current.pause();
        transitionAudioRef.current.currentTime = 0;
        transitionAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();

      /* ---- 2. Update store ---- */
      setPersona(newPersonaId);

      /* ---- 3. Show transition greeting immediately ---- */
      const selected = PERSONAS.find((p) => p.id === newPersonaId);
      const greeting = selected?.transitionGreeting || "";
      if (setCaptions) setCaptions(greeting);

      /* ---- 4. Speak the transition greeting via TTS ---- */
      try {
        const res = await fetch("/api/tts-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: greeting, persona: newPersonaId })
        });
        if (!res.ok) throw new Error("TTS upstream failed");
        const audio = new Audio(URL.createObjectURL(await res.blob()));
        transitionAudioRef.current = audio;
        await audio.play();
      } catch {
        // Offline / quota fallback → browser speech synthesis
        const utter = new SpeechSynthesisUtterance(greeting);
        window.speechSynthesis.speak(utter);
      }
    },
    [persona, setPersona, setCaptions, stopAudio]
  );

  return (
    <div className="min-h-screen flex flex-col justify-end">
      <div className="adwa-glass rounded-b-none p-6">
        {/* ---- FEAT-015: Persona Switcher Section ---- */}
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-imperial-gold-light/60 mb-2">
          YOUR GUIDE
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {PERSONAS.map((p) => {
            const isActive = persona === p.id;
            return (
              <button
                key={p.id}
                className={[
                  "adwa-chip flex items-center gap-1.5 transition-all duration-200",
                  isActive
                    ? "ring-2 ring-imperial-gold bg-imperial-gold/20 border-imperial-gold text-parchment shadow-gold-glow"
                    : "text-parchment/70 hover:bg-obsidian-overlay hover:border-imperial-gold/50"
                ].join(" ")}
                data-active={isActive}
                onClick={() => handlePersonaSwitch(p.id)}
                aria-pressed={isActive}
                aria-label={`Switch to ${p.label} guide persona`}
              >
                <span className="text-base" role="img" aria-hidden="true">{p.icon}</span>
                <span className="text-xs font-medium">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---- Captions / Response Area ---- */}
        <p className="min-h-[3em] text-center text-parchment/90 mb-4">{captions || "Ask me anything about this exhibit."}</p>

        {/* ---- Mic Button ---- */}
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

        {/* ---- Text Input Fallback ---- */}
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
