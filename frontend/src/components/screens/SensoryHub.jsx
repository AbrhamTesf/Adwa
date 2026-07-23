import React, { useEffect, useState } from "react";
import { pulse } from "../../lib/haptics";
import { startBreathDetection } from "../../lib/pitchDetection";

/** Screen 6 — Multi-Sensory Audio & Haptic Interaction (instruments only) */
export default function SensoryHub({ navigate }) {
  const [mode, setMode] = useState("drum"); // drum | wind | blade
  const [breath, setBreath] = useState({ amplitude: 0, pitch: -1 });
  const [visualPulse, setVisualPulse] = useState(false);

  useEffect(() => {
    if (mode !== "wind") return;
    let stop = () => {};
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stop = startBreathDetection(stream, setBreath);
    })();
    return () => stop();
  }, [mode]);

  function playDrumZone(zone) {
    playSynthTone(zone === "center" ? 90 : 440);
    pulse(zone === "center" ? 60 : 25, () => {
      setVisualPulse(true);
      setTimeout(() => setVisualPulse(false), 150);
    });
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex gap-2 mb-6">
        {["drum", "wind", "blade"].map((m) => (
          <button
            key={m}
            className={`adwa-chip ${mode === m ? "border-imperial-gold" : ""}`}
            data-active={mode === m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "drum" && (
        <div className={`flex-1 grid place-items-center ${visualPulse ? "animate-pulse" : ""}`}>
          <div
            className="w-64 h-64 rounded-full bg-wanza-wood-light border-8 border-wanza-wood grid place-items-center cursor-pointer"
            onClick={() => playDrumZone("center")}
          >
            <div
              className="w-24 h-24 rounded-full bg-imperial-gold/30"
              onClick={(e) => {
                e.stopPropagation();
                playDrumZone("edge");
              }}
            />
          </div>
        </div>
      )}

      {mode === "wind" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="mb-4 text-parchment/70">Blow into the mic to play the Embilta</p>
          <div
            className="w-40 h-40 rounded-full bg-adwa-emerald/30 border-4 border-adwa-emerald"
            style={{ transform: `scale(${1 + Math.min(breath.amplitude * 4, 0.6)})` }}
          />
        </div>
      )}

      {mode === "blade" && (
        <div className="flex-1 grid place-items-center text-parchment/70">
          Swipe across the crossed blades (gesture demo placeholder)
        </div>
      )}

      <button className="adwa-btn-secondary mt-6" onClick={() => navigate("inspection")}>
        Back to Inspection
      </button>
    </div>
  );
}

function playSynthTone(freq) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}
