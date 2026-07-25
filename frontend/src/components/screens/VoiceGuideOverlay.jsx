import React, { useCallback, useRef, useState } from "react";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Screen 7 — Dynamic Voice AI Tour Guide / Q&A
 *
 * FEAT-015: Mid-tour persona switcher with golden ring active indicator,
 * audio interruption on switch, transition greeting TTS playback,
 * and text submit input fallback.
 */
export default function VoiceGuideOverlay({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const {
    status,
    captions,
    setCaptions,
    startListening,
    stopListeningAndSend,
    sendTextQuestion,
    stopAudio
  } = useVoiceGuide(exhibit?.hotspot_json);

  const [inputQuery, setInputQuery] = useState("");
  const transitionAudioRef = useRef(null);

  /**
   * FEAT-015: Handle persona chip selection.
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
        const utter = new SpeechSynthesisUtterance(greeting);
        window.speechSynthesis?.speak(utter);
      }
    },
    [persona, setPersona, setCaptions, stopAudio]
  );

  const handleTextSubmit = (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || status !== "idle") return;
    const query = inputQuery;
    setInputQuery("");
    sendTextQuestion(query);
  };

  return (
    <div className="min-h-screen flex flex-col justify-end bg-obsidian/60 bg-adwa-geometry p-4">
      <div className="adwa-glass rounded-2xl p-6 shadow-gold-glow border border-imperial-gold/30">
        {/* ---- Top Header ---- */}
        <div className="flex items-center justify-between mb-3 border-b border-imperial-gold/20 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-imperial-gold">
              AI Voice Guide & RAG
            </p>
            <h2 className="font-display text-base text-parchment">
              {exhibit?.name || "Empress Taytu Monument"}
            </h2>
          </div>
          <span className="rounded-full bg-imperial-gold/15 px-3 py-1 text-xs text-imperial-gold border border-imperial-gold/30">
            {status === "listening"
              ? "🎙️ Listening…"
              : status === "thinking"
              ? "🧠 Thinking…"
              : status === "speaking"
              ? "🔊 Speaking…"
              : "✦ Ready"}
          </span>
        </div>

        {/* ---- FEAT-015: Persona Switcher Section ---- */}
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-imperial-gold-light/60 mb-2">
          SELECT GUIDE PERSONA
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {PERSONAS.map((p) => {
            const isActive = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={[
                  "adwa-chip flex items-center gap-1.5 transition-all duration-200 px-3 py-1.5 rounded-full border text-xs",
                  isActive
                    ? "ring-2 ring-imperial-gold bg-imperial-gold/20 border-imperial-gold text-parchment shadow-gold-glow font-bold"
                    : "text-parchment/70 border-imperial-gold/30 hover:bg-obsidian-overlay hover:border-imperial-gold/50"
                ].join(" ")}
                data-active={isActive}
                onClick={() => handlePersonaSwitch(p.id)}
                aria-pressed={isActive}
                aria-label={`Switch to ${p.label} guide persona`}
              >
                <span className="text-sm" role="img" aria-hidden="true">
                  {p.icon}
                </span>
                <span className="font-medium">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---- Captions / Response Display ---- */}
        <div className="min-h-[4.5em] max-h-[8em] overflow-y-auto rounded-xl bg-obsidian-raised/80 p-3.5 mb-4 border border-imperial-gold/20 text-center flex items-center justify-center">
          <p className="text-xs sm:text-sm text-parchment/90 leading-relaxed">
            {captions || "Ask me anything about Empress Taytu or the Battle of Adwa."}
          </p>
        </div>

        {/* ---- Mic Button ---- */}
        <div className="flex flex-col items-center justify-center mb-4">
          <button
            type="button"
            className={`w-20 h-20 rounded-full border-2 border-imperial-gold bg-gradient-to-b from-imperial-gold to-imperial-gold-dark flex items-center justify-center text-3xl shadow-gold-glow transition-transform active:scale-95 ${
              status === "listening" ? "ring-4 ring-imperial-gold/50 animate-pulse scale-105" : ""
            }`}
            onMouseDown={startListening}
            onMouseUp={stopListeningAndSend}
            onTouchStart={startListening}
            onTouchEnd={stopListeningAndSend}
            aria-label="Hold to speak to voice guide"
          >
            🎙️
          </button>
          <p className="mt-2 text-center text-xs text-parchment/60 font-medium">
            Hold button to speak • Release to send
          </p>
        </div>

        {/* ---- Text Input Form with Submit Button ---- */}
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-obsidian-raised/90 text-parchment placeholder-parchment/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm border border-imperial-gold/30 focus:border-imperial-gold focus:outline-none"
            disabled={status !== "idle"}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || status !== "idle"}
            className="adwa-btn-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span>Send</span>
            <span>➔</span>
          </button>
        </form>

        {/* ---- Navigation Button ---- */}
        <button
          type="button"
          className="mt-4 text-xs text-imperial-gold underline mx-auto block hover:text-parchment transition-colors"
          onClick={() => navigate?.("inspection")}
        >
          Back to 3D Inspection
        </button>
      </div>
    </div>
  );
}
