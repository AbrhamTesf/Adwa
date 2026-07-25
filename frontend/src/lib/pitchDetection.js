/**
 * [Screen 6] Wind instrument breath detection —
 * autocorrelation-based pitch tracking off an AnalyserNode buffer.
 */

const BLOW_ONSET_RMS = 0.045;
const BLOW_RELEASE_RMS = 0.018;
const AMPLITUDE_SMOOTHING = 0.25;

const MIN_PERIODICITY = 0.3;
const PEAK_TOLERANCE = 0.9;

export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / SIZE);
  if (rms < 0.01) return -1; // too quiet, treat as silence

  const MIN_SAMPLES = Math.floor(sampleRate / 1000);
  const MAX_SAMPLES = Math.floor(sampleRate / 60);

  // Normalising by the energy of both windows (rather than by window length)
  // keeps every lag comparable — dividing by the sample count alone inflates
  // long lags and makes the detector lock onto a sub-harmonic of the note.
  const correlations = new Float32Array(MAX_SAMPLES);
  let bestCorrelation = 0;

  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let product = 0;
    let energyHead = 0;
    let energyLagged = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      const head = buffer[i];
      const lagged = buffer[i + offset];
      product += head * lagged;
      energyHead += head * head;
      energyLagged += lagged * lagged;
    }
    const energy = Math.sqrt(energyHead * energyLagged);
    const correlation = energy > 0 ? product / energy : 0;
    correlations[offset] = correlation;
    if (correlation > bestCorrelation) bestCorrelation = correlation;
  }

  if (bestCorrelation < MIN_PERIODICITY) return -1;

  // A periodic signal correlates just as strongly at every multiple of its
  // period, so the fundamental is the *first* qualifying peak, not the tallest.
  const threshold = bestCorrelation * PEAK_TOLERANCE;
  let bestOffset = -1;
  for (let offset = MIN_SAMPLES + 1; offset < MAX_SAMPLES - 1; offset++) {
    const correlation = correlations[offset];
    if (
      correlation >= threshold &&
      correlation >= correlations[offset - 1] &&
      correlation >= correlations[offset + 1]
    ) {
      bestOffset = offset;
      break;
    }
  }
  if (bestOffset <= 0) return -1;

  // Parabolic interpolation around the peak — without it the detected pitch
  // quantises to whole samples, which is audibly coarse in the upper register.
  const previous = correlations[bestOffset - 1];
  const next = correlations[bestOffset + 1];
  const curvature = 2 * (2 * correlations[bestOffset] - previous - next);
  const refinedOffset =
    curvature !== 0 ? bestOffset + (next - previous) / curvature : bestOffset;

  return sampleRate / refinedOffset;
}

function getAudioContextClass() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function rootMeanSquare(buffer) {
  return Math.sqrt(buffer.reduce((sum, value) => sum + value * value, 0) / buffer.length);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function isBreathDetectionSupported() {
  return Boolean(getAudioContextClass() && navigator?.mediaDevices?.getUserMedia);
}

/**
 * Breath is exactly the kind of signal the default capture constraints treat as
 * noise, so every cleanup processor is disabled before we listen.
 * Resolves to `{ stream, error }` instead of throwing so callers can degrade.
 */
export async function requestBreathStream() {
  if (!isBreathDetectionSupported()) return { stream: null, error: "unsupported" };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    return { stream, error: null };
  } catch (err) {
    const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
    return { stream: null, error: denied ? "denied" : "unavailable" };
  }
}

export function startBreathDetection(stream, onPitchAmplitude, options = {}) {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass || !stream) return () => {};

  const {
    onsetThreshold = BLOW_ONSET_RMS,
    releaseThreshold = BLOW_RELEASE_RMS,
    smoothing = AMPLITUDE_SMOOTHING,
    stopTracks = true
  } = options;

  const ctx = new AudioContextClass();
  if (ctx.state === "suspended") ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let rafId;
  let stopped = false;
  let smoothedAmplitude = 0;
  let isBlowing = false;

  function loop() {
    analyser.getFloatTimeDomainData(buffer);
    const amplitude = rootMeanSquare(buffer);
    smoothedAmplitude += (amplitude - smoothedAmplitude) * smoothing;

    // Separate onset and release thresholds — a single one makes the tone
    // stutter while a steady breath sits right on the boundary.
    if (!isBlowing && smoothedAmplitude >= onsetThreshold) isBlowing = true;
    else if (isBlowing && smoothedAmplitude <= releaseThreshold) isBlowing = false;

    const pitch = isBlowing ? autoCorrelate(buffer, ctx.sampleRate) : -1;
    onPitchAmplitude({ amplitude, smoothedAmplitude, pitch, isBlowing });
    rafId = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    source.disconnect();
    analyser.disconnect();
    if (stopTracks) stream.getTracks().forEach((track) => track.stop());
    if (ctx.state !== "closed") ctx.close();
  };
}

/**
 * Maps a breath reading onto a playable note for a fixed-pitch wind instrument.
 * The tube decides the note and the breath decides the loudness, so a detection
 * outside the instrument's register falls back to the fundamental.
 */
export function breathToTone(reading, profile = {}) {
  const {
    baseFrequency = 220,
    minFrequency = baseFrequency * 0.5,
    maxFrequency = baseFrequency * 2,
    maxGain = 0.3,
    sensitivity = 6,
    overblowAt = null
  } = profile;

  const rawAmplitude = Number.isFinite(reading?.smoothedAmplitude)
    ? reading.smoothedAmplitude
    : reading?.amplitude ?? 0;
  const intensity = clamp(rawAmplitude * sensitivity, 0, 1);

  const detected = reading?.pitch ?? -1;
  const inRegister = detected >= minFrequency && detected <= maxFrequency;
  const tracked = inRegister ? detected : baseFrequency;

  // A hard-blown flute jumps to its second harmonic rather than just getting louder.
  const frequency = overblowAt !== null && intensity >= overblowAt ? tracked * 2 : tracked;

  return { frequency, gain: intensity * maxGain, intensity };
}
