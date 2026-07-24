import React, { useCallback, useEffect, useRef, useState } from "react";
import { pulse } from "../../lib/haptics";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";

const TAP_DISTANCE_PX = 14;
const WAVE_DURATION_MS = 520;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

/** Screen 6 — Negarit drum interaction with mesh taps, synth audio, and haptics. */
export default function SensoryHub({ navigate }) {
  const modelRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const pointerStartRef = useRef(null);
  const [lastStrike, setLastStrike] = useState(null);
  const [isStriking, setIsStriking] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  const drawWave = useCallback((zone) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 100;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const startedAt = performance.now();
    const frequency = zone === "center" ? 2.2 : 5.8;
    const amplitude = zone === "center" ? 30 : 17;

    function frame(now) {
      const progress = Math.min((now - startedAt) / WAVE_DURATION_MS, 1);
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.strokeStyle = zone === "center" ? "#D4AF37" : "#2FBE68";
      context.lineWidth = 2.5;

      for (let x = 0; x <= width; x += 4) {
        const wave = Math.sin((x / width) * Math.PI * 2 * frequency + progress * 18);
        const envelope = (1 - progress) * (0.45 + 0.55 * Math.sin((x / width) * Math.PI));
        const y = height / 2 + wave * amplitude * envelope;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();

      if (progress < 1) requestAnimationFrame(frame);
      else context.clearRect(0, 0, width, height);
    }

    requestAnimationFrame(frame);
  }, []);

  const playDrumTone = useCallback((zone) => {
    const audioContext = audioContextRef.current || getAudioContext();
    audioContextRef.current = audioContext;
    if (!audioContext) {
      setAudioUnavailable(true);
      return;
    }

    if (audioContext.state === "suspended") audioContext.resume();

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const tone = zone === "center" ? 92 : 280;
    const decay = zone === "center" ? 0.62 : 0.22;

    oscillator.type = zone === "center" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(tone, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, tone * 0.52), now + decay);
    gain.gain.setValueAtTime(zone === "center" ? 0.42 : 0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + decay);
  }, []);

  const strikeDrum = useCallback((zone) => {
    playDrumTone(zone);
    pulse(zone === "center" ? [28, 35, 55] : 22, () => drawWave(zone));
    drawWave(zone);
    setLastStrike(zone);
    setIsStriking(true);
    window.setTimeout(() => setIsStriking(false), 180);
  }, [drawWave, playDrumTone]);

  function handlePointerDown(event) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleMeshTap(event) {
    const startedAt = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!startedAt || Math.hypot(event.clientX - startedAt.x, event.clientY - startedAt.y) > TAP_DISTANCE_PX) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    // model-viewer performs a raycast at this screen point when supported. The
    // radial zone then maps that direct mesh hit to a skin centre or rim tone.
    const meshHit = modelRef.current?.surfaceFromPoint?.(localX, localY);
    if (meshHit === null) return;

    const distanceFromCentre = Math.hypot(
      localX - bounds.width / 2,
      localY - bounds.height / 2
    );
    const zone = distanceFromCentre < Math.min(bounds.width, bounds.height) * 0.22
      ? "center"
      : "rim";
    strikeDrum(zone);
  }

  useEffect(() => () => audioContextRef.current?.close(), []);

  return (
    <section className="flex min-h-screen flex-col overflow-hidden bg-obsidian bg-adwa-geometry px-5 pb-6 pt-5 text-parchment">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">Sensory interaction</p>
          <h1 className="font-display text-2xl">Negarit Royal Drum</h1>
          <p className="mt-1 text-sm text-parchment/70">Tap the 3D drum skin or strike the virtual mallet.</p>
        </div>
        <button type="button" className="adwa-btn-secondary px-4 py-2 text-sm" onClick={() => navigate?.("inspection")}>
          Back
        </button>
      </header>

      <div className={`relative min-h-0 flex-1 overflow-hidden rounded-xl2 border border-imperial-gold/30 bg-obsidian-raised ${isStriking ? "shadow-gold-glow" : ""}`}>
        <InteractiveModelViewer
          ref={modelRef}
          modelPath="/models/negarit_drum.glb"
          posterPath="/models/posters/negarit_drum_poster.webp"
          altText="Negarit ceremonial royal drum"
          exhibitTrivia="The Negarit drum was the sacred voice of the Ethiopian Sovereign — struck to proclaim military mobilization decrees and announce historic battle victories."
          containerClassName="h-full w-full flex items-center justify-center"
          className="h-full min-h-[360px] w-full"
          cameraControls
          autoRotate
          shadowIntensity="1"
          exposure="1.1"
          onPointerDown={handlePointerDown}
          onPointerUp={handleMeshTap}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian-raised via-obsidian-raised/25 to-transparent px-4 pb-3 pt-16 z-20">
          <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-parchment/75">Direct mesh tap enabled</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="mt-3 h-20 w-full" aria-label="Animated audio wave feedback" />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" className="adwa-btn-secondary" onClick={() => strikeDrum("rim")}>
          Rim tap
        </button>
        <button type="button" className="adwa-btn-primary" onClick={() => strikeDrum("center")}>
          Strike drum
        </button>
      </div>

      <p className="mt-3 min-h-5 text-center text-sm text-parchment/75" role="status">
        {audioUnavailable
          ? "Audio is unavailable in this browser; visual feedback remains active."
          : lastStrike === "center"
            ? "Deep ceremonial bass tone"
            : lastStrike === "rim"
              ? "Bright rim tone"
              : "Choose a strike to begin"}
      </p>
    </section>
  );
}