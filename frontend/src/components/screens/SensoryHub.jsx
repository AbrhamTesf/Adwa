import React, { useCallback, useEffect, useRef, useState } from "react";
import { pulse } from "../../lib/haptics";
import {
  breathToTone,
  isBreathDetectionSupported,
  requestBreathStream,
  startBreathDetection
} from "../../lib/pitchDetection";
import { useExhibitStore } from "../../stores/useExhibitStore";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";
import { useTranslation } from "../../lib/i18n";
import { getExhibitText } from "../../data/exhibitsData";

const TAP_DISTANCE_PX = 14;
const WAVE_DURATION_MS = 520;
const MAX_PARTICLES = 170;
const BURST_DURATION_MS = 1200;
// Canvas paints outside Tailwind, so the imperial-gold token is mirrored here.
const IMPERIAL_GOLD_RGB = "212, 175, 55";

/**
 * Wind instrument mechanics per docs/GOVERNANCE.md Sections 4.4–4.5. Both horns
 * are fixed-pitch, so breath drives loudness and timbre while the tube fixes the note.
 */
const WIND_INSTRUMENTS = {
  embilta: {
    title: "Embilta Ceremonial Flute",
    hint: "Blow into your mic or tap the blowhole to sound the flute.",
    altText: "Embilta ceremonial bamboo flute",
    fallbackTrivia:
      "Embiltas have no finger holes — each flute sounds one tuned pitch, and players interlock in sets of three to build a single melody.",
    emitterHotspot: "blowhole",
    fallbackAnchor: { x: 0.5, y: 0.4 },
    airflowAngle: -0.45,
    oscillator: "sine",
    partialType: "triangle",
    partialGain: 0.3,
    partialDetune: 9,
    sampleKey: "tone_sample",
    profile: {
      baseFrequency: 233.08,
      minFrequency: 180,
      maxFrequency: 520,
      maxGain: 0.26,
      sensitivity: 7,
      overblowAt: 0.85
    },
    call: [{ frequency: 233.08, duration: 1.3 }],
    callLabel: "Sustained bamboo tone"
  },
  meleket: {
    title: "Meleket Royal Trumpet",
    hint: "Blow into your mic or tap the mouthpiece to sound the herald call.",
    altText: "Meleket royal ceremonial trumpet",
    fallbackTrivia:
      "Royal heralds sounded the Meleket to assemble troops — its flared bell carried commands across whole mountain valleys.",
    emitterHotspot: "bell_flare",
    fallbackAnchor: { x: 0.5, y: 0.68 },
    airflowAngle: 0.5,
    oscillator: "sawtooth",
    partialType: "square",
    partialGain: 0.18,
    partialDetune: -6,
    sampleKey: "call_sample",
    profile: {
      baseFrequency: 155.56,
      minFrequency: 120,
      maxFrequency: 400,
      maxGain: 0.22,
      sensitivity: 6.5,
      overblowAt: null
    },
    call: [
      { frequency: 155.56, duration: 0.32 },
      { frequency: 207.65, duration: 0.32 },
      { frequency: 233.08, duration: 0.9 }
    ],
    callLabel: "Three-note herald call"
  }
};

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

/**
 * Screen 6 — sensory interaction routed by exhibit category: percussion mechanics
 * for the Negarit drum, breath mechanics for the Embilta and Meleket horns.
 */
export default function SensoryHub({ navigate }) {
  const exhibit = useExhibitStore((state) => state.activeExhibit);
  const windConfig = WIND_INSTRUMENTS[exhibit?.exhibit_id];

  if (windConfig) {
    return <WindInstrumentStage navigate={navigate} exhibit={exhibit} config={windConfig} />;
  }
  return <NegaritDrumStage navigate={navigate} />;
}

/** Embilta & Meleket — mic breath detection, Blow button, and airflow overlay. */
function WindInstrumentStage({ navigate, exhibit, config }) {
  const { t, language } = useTranslation();
  const modelRef = useRef(null);
  const canvasRef = useRef(null);
  const hotspotRef = useRef(null);
  const meterRef = useRef(null);
  const audioContextRef = useRef(null);
  const voiceRef = useRef(null);
  const stopBreathRef = useRef(null);
  const sampleRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const pointerStartRef = useRef(null);
  const liveIntensityRef = useRef(0);
  const burstUntilRef = useRef(0);
  const wasBlowingRef = useRef(false);

  const [micState, setMicState] = useState("idle"); // idle | requesting | listening | denied | unsupported
  const [isBlowing, setIsBlowing] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [sampleReady, setSampleReady] = useState(false);

  const hotspot = exhibit?.hotspot_json?.[config.emitterHotspot];
  const samplePath = exhibit?.audio_profile?.[config.sampleKey];
  const exhibitId = exhibit?.exhibit_id;

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = getAudioContext();
    const context = audioContextRef.current;
    if (!context) {
      setAudioUnavailable(true);
      return null;
    }
    if (context.state === "suspended") context.resume();
    return context;
  }, []);

  /* ── Airflow particle overlay ───────────────────────────── */

  const emitterAnchor = useCallback((canvas) => {
    const marker = hotspotRef.current;
    const canvasBounds = canvas.getBoundingClientRect();
    const markerBounds = marker?.getBoundingClientRect();
    // The hotspot marker is placed by model-viewer from hotspot_json, so the
    // emitter follows the mesh as the visitor orbits the model.
    if (markerBounds?.width) {
      return {
        x: markerBounds.left + markerBounds.width / 2 - canvasBounds.left,
        y: markerBounds.top + markerBounds.height / 2 - canvasBounds.top
      };
    }
    return {
      x: canvasBounds.width * config.fallbackAnchor.x,
      y: canvasBounds.height * config.fallbackAnchor.y
    };
  }, [config.fallbackAnchor]);

  const spawnParticles = useCallback((anchor, intensity) => {
    const particles = particlesRef.current;
    const count = Math.round(1 + intensity * 6);
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const angle = config.airflowAngle + (Math.random() - 0.5) * 0.8;
      const speed = 0.7 + Math.random() * 1.6 + intensity * 2.6;
      particles.push({
        x: anchor.x + (Math.random() - 0.5) * 7,
        y: anchor.y + (Math.random() - 0.5) * 7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.011 + Math.random() * 0.019,
        radius: 1.1 + Math.random() * 2.4 * (0.55 + intensity)
      });
    }
  }, [config.airflowAngle]);

  const runParticleFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      frameRef.current = null;
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 320;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
    }

    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    // The Blow button has no live breath signal, so it drives a decaying envelope.
    const remaining = burstUntilRef.current - performance.now();
    const burstIntensity = remaining > 0 ? Math.min(remaining / BURST_DURATION_MS, 1) * 0.85 : 0;
    const intensity = Math.max(liveIntensityRef.current, burstIntensity);

    if (intensity > 0.03) spawnParticles(emitterAnchor(canvas), intensity);

    const particles = particlesRef.current;
    context.globalCompositeOperation = "lighter";
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy -= 0.018;
      particle.vx *= 0.99;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const glow = context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 4
      );
      glow.addColorStop(0, `rgba(${IMPERIAL_GOLD_RGB}, ${0.65 * particle.life})`);
      glow.addColorStop(1, `rgba(${IMPERIAL_GOLD_RGB}, 0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
      context.fill();
    }
    context.globalCompositeOperation = "source-over";

    if (meterRef.current) {
      meterRef.current.style.transform = `scaleX(${Math.max(intensity, 0.02)})`;
    }

    if (particles.length > 0 || intensity > 0.03) {
      frameRef.current = requestAnimationFrame(runParticleFrame);
    } else {
      frameRef.current = null;
      context.clearRect(0, 0, width, height);
      if (meterRef.current) meterRef.current.style.transform = "scaleX(0.02)";
    }
  }, [emitterAnchor, spawnParticles]);

  const ensureParticleLoop = useCallback(() => {
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(runParticleFrame);
  }, [runParticleFrame]);

  /* ── Synthesis ──────────────────────────────────────────── */

  const synthesizeCall = useCallback(() => {
    const context = ensureAudioContext();
    if (!context) return;

    let startAt = context.currentTime + 0.02;
    config.call.forEach(({ frequency, duration }) => {
      const oscillator = context.createOscillator();
      const partial = context.createOscillator();
      const partialGain = context.createGain();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = config.oscillator;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      partial.type = config.partialType;
      partial.frequency.setValueAtTime(frequency * 2, startAt);
      partial.detune.setValueAtTime(config.partialDetune, startAt);
      partialGain.gain.setValueAtTime(config.partialGain, startAt);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, startAt);

      // Breath instruments swell in rather than snapping on like a struck drum.
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(config.profile.maxGain, startAt + duration * 0.28);
      gain.gain.setValueAtTime(config.profile.maxGain, startAt + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      oscillator.connect(gain);
      partial.connect(partialGain).connect(gain);
      gain.connect(filter).connect(context.destination);
      oscillator.start(startAt);
      partial.start(startAt);
      oscillator.stop(startAt + duration + 0.05);
      partial.stop(startAt + duration + 0.05);

      startAt += duration * 0.92;
    });
  }, [config, ensureAudioContext]);

  const handleBlow = useCallback(() => {
    const sample = sampleReady ? sampleRef.current : null;
    if (sample) {
      sample.currentTime = 0;
      sample.play().catch(() => synthesizeCall());
    } else {
      synthesizeCall();
    }

    pulse([14, 26, 90]);
    burstUntilRef.current = performance.now() + BURST_DURATION_MS;
    ensureParticleLoop();
  }, [ensureParticleLoop, sampleReady, synthesizeCall]);

  /* ── Live mic breath voice ──────────────────────────────── */

  const handleReading = useCallback((reading) => {
    const voice = voiceRef.current;
    const context = audioContextRef.current;
    const tone = breathToTone(reading, config.profile);
    liveIntensityRef.current = reading.isBlowing ? tone.intensity : 0;

    if (voice && context) {
      const now = context.currentTime;
      voice.oscillator.frequency.setTargetAtTime(tone.frequency, now, 0.05);
      voice.partial.frequency.setTargetAtTime(tone.frequency * 2, now, 0.06);
      voice.gain.gain.setTargetAtTime(Math.max(tone.gain, 0.0001), now, 0.035);
      voice.filter.frequency.setTargetAtTime(800 + tone.intensity * 3400, now, 0.08);
    }

    if (wasBlowingRef.current !== reading.isBlowing) {
      wasBlowingRef.current = reading.isBlowing;
      if (reading.isBlowing) pulse(30);
      setIsBlowing(reading.isBlowing);
    }
    ensureParticleLoop();
  }, [config.profile, ensureParticleLoop]);

  const stopMic = useCallback(() => {
    stopBreathRef.current?.();
    stopBreathRef.current = null;
    liveIntensityRef.current = 0;

    const voice = voiceRef.current;
    voiceRef.current = null;
    if (voice) {
      const context = audioContextRef.current;
      const now = context ? context.currentTime : 0;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0.0001, now, 0.05);
      voice.oscillator.stop(now + 0.3);
      voice.partial.stop(now + 0.3);
    }

    wasBlowingRef.current = false;
    setIsBlowing(false);
    setMicState((state) => (state === "listening" || state === "requesting" ? "idle" : state));
  }, []);

  async function toggleMic() {
    if (stopBreathRef.current) {
      stopMic();
      return;
    }
    if (!isBreathDetectionSupported()) {
      setMicState("unsupported");
      return;
    }

    // Safari only unlocks an AudioContext inside the gesture that opened it, and
    // awaiting the permission prompt below spends that gesture — so open it first.
    const context = ensureAudioContext();
    if (!context) return;

    setMicState("requesting");
    const { stream, error } = await requestBreathStream();
    if (!stream) {
      setMicState(error === "denied" ? "denied" : "unsupported");
      return;
    }

    voiceRef.current = createBreathVoice(context, config);
    stopBreathRef.current = startBreathDetection(stream, handleReading);
    setMicState("listening");
    ensureParticleLoop();
  }

  /* ── Direct mesh tap on the blowhole / mouthpiece ────────── */

  function handlePointerDown(event) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleMeshTap(event) {
    const startedAt = pointerStartRef.current;
    pointerStartRef.current = null;
    // Stream A owns the mesh target — never bind the trigger before it loads.
    if (!modelReady || !startedAt) return;
    if (Math.hypot(event.clientX - startedAt.x, event.clientY - startedAt.y) > TAP_DISTANCE_PX) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const meshHit = modelRef.current?.surfaceFromPoint?.(
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );
    if (meshHit === null) return;
    handleBlow();
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  useEffect(() => {
    // The recorded sample is an enhancement; preloading keeps the Blow button
    // instant and silently leaves us on the synth voice when it is missing.
    if (!samplePath) return undefined;
    setSampleReady(false);
    const audio = new Audio(samplePath);
    audio.preload = "auto";
    const handleReady = () => setSampleReady(true);
    audio.addEventListener("canplaythrough", handleReady);
    sampleRef.current = audio;

    return () => {
      audio.removeEventListener("canplaythrough", handleReady);
      audio.pause();
      sampleRef.current = null;
    };
  }, [samplePath]);

  useEffect(() => () => {
    stopBreathRef.current?.();
    stopBreathRef.current = null;
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    particlesRef.current = [];
    audioContextRef.current?.close();
  }, []);

  const isListening = micState === "listening";
  const statusMessage = audioUnavailable
    ? "Audio is unavailable in this browser; the airflow overlay remains active."
    : micState === "denied"
      ? "Microphone blocked — use the Blow button to sound the instrument."
      : micState === "unsupported"
        ? "Mic breath input is unavailable here; use the Blow button instead."
        : micState === "requesting"
          ? "Waiting for microphone permission…"
          : isBlowing
            ? "Breath detected — air is flowing through the instrument."
            : isListening
              ? "Listening — blow steadily into your microphone."
              : config.callLabel;

  return (
    <section className="flex min-h-screen flex-col overflow-hidden bg-obsidian bg-adwa-geometry px-5 pb-6 pt-5 text-parchment">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">{t("sensory.title")}</p>
          <h1 className="font-display text-2xl">{getExhibitText(exhibitId, "title", language) || exhibit?.name || config.title}</h1>
          <p className="mt-1 text-sm text-parchment/70">{config.hint}</p>
        </div>
        <button type="button" className="adwa-btn-secondary px-4 py-2 text-sm" onClick={() => navigate?.("inspection")}>
          ← {t("common.back")}
        </button>
      </header>

      <div
        className={`relative min-h-0 flex-1 overflow-hidden rounded-xl2 border bg-obsidian-raised transition-shadow ${
          isBlowing ? "border-imperial-gold shadow-gold-glow" : "border-imperial-gold/30"
        }`}
      >
        <InteractiveModelViewer
          ref={modelRef}
          modelPath={exhibit?.glb_url || `/models/${exhibitId}.glb`}
          posterPath={`/models/posters/${exhibitId}_poster.webp`}
          altText={config.altText}
          exhibitTrivia={exhibit?.persona_scripts?.usage || config.fallbackTrivia}
          containerClassName="h-full w-full flex items-center justify-center"
          className="h-full min-h-[360px] w-full"
          cameraControls
          autoRotate
          shadowIntensity="1"
          exposure="1.1"
          onLoad={() => setModelReady(true)}
          onPointerDown={handlePointerDown}
          onPointerUp={handleMeshTap}
        >
          {hotspot && (
            <button
              ref={hotspotRef}
              type="button"
              slot={`hotspot-${config.emitterHotspot}`}
              data-position={hotspot.position}
              data-normal={hotspot.normal}
              className={`h-5 w-5 rounded-full border-2 border-imperial-gold bg-imperial-gold/25 transition-transform ${
                isBlowing ? "scale-125 shadow-gold-glow" : ""
              }`}
              onClick={handleBlow}
              aria-label={`Blow into the ${hotspot.label || config.emitterHotspot}`}
            />
          )}
        </InteractiveModelViewer>

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-obsidian-raised via-obsidian-raised/25 to-transparent px-4 pb-3 pt-16">
          <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-parchment/75">
            {modelReady ? "Blowhole tap enabled" : "Loading instrument mesh…"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-parchment/60">
          <span>Breath intensity</span>
          <span className={isListening ? "text-imperial-gold" : "text-parchment/40"}>
            {isListening ? "Mic live" : "Mic off"}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-imperial-gold/30 bg-obsidian-overlay">
          <div
            ref={meterRef}
            className="h-full w-full origin-left bg-gradient-to-r from-imperial-gold-dark via-imperial-gold to-imperial-gold-light"
            style={{ transform: "scaleX(0.02)" }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="adwa-btn-secondary"
          onClick={toggleMic}
          disabled={micState === "requesting"}
        >
          {isListening ? "Stop mic" : "Blow to Play"}
        </button>
        <button type="button" className="adwa-btn-primary" onClick={handleBlow}>
          Blow
        </button>
      </div>

      <p className="mt-3 min-h-5 text-center text-sm text-parchment/75" role="status">
        {statusMessage}
      </p>
    </section>
  );
}

/** Sustained breath voice — a fundamental plus a detuned partial for air noise. */
function createBreathVoice(context, config) {
  const oscillator = context.createOscillator();
  const partial = context.createOscillator();
  const partialGain = context.createGain();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = config.oscillator;
  oscillator.frequency.value = config.profile.baseFrequency;
  partial.type = config.partialType;
  partial.frequency.value = config.profile.baseFrequency * 2;
  partial.detune.value = config.partialDetune;
  partialGain.gain.value = config.partialGain;
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  partial.connect(partialGain).connect(gain);
  gain.connect(filter).connect(context.destination);
  oscillator.start();
  partial.start();

  return { oscillator, partial, gain, filter };
}

/** Negarit drum interaction with mesh taps, synth audio, and haptics. */
function NegaritDrumStage({ navigate }) {
  const { t, language } = useTranslation();
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
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">{t("sensory.title")}</p>
          <h1 className="font-display text-2xl">{getExhibitText("negarit_drum", "title", language) || "Negarit Royal Drum"}</h1>
          <p className="mt-1 text-sm text-parchment/70">{t("sensory.tapOrStrike")}</p>
        </div>
        <button type="button" className="adwa-btn-secondary px-4 py-2 text-sm" onClick={() => navigate?.("inspection")}>
          ← {t("common.back")}
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
          <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-parchment/75">{t("sensory.meshTapEnabled")}</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="mt-3 h-20 w-full" aria-label="Animated audio wave feedback" />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" className="adwa-btn-secondary" onClick={() => strikeDrum("rim")}>
          {t("sensory.rimTap")}
        </button>
        <button type="button" className="adwa-btn-primary" onClick={() => strikeDrum("center")}>
          {t("sensory.strikeDrum")}
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
