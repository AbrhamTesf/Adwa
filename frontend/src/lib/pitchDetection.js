/**
 * [Screen 6] Wind instrument breath detection —
 * autocorrelation-based pitch tracking off an AnalyserNode buffer.
 */
export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / SIZE);
  if (rms < 0.01) return -1; // too quiet, treat as silence

  let bestOffset = -1;
  let bestCorrelation = 0;
  const MIN_SAMPLES = Math.floor(sampleRate / 1000);
  const MAX_SAMPLES = Math.floor(sampleRate / 60);

  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE - offset);
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }
  return -1;
}

export function startBreathDetection(stream, onPitchAmplitude) {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let rafId;

  function loop() {
    analyser.getFloatTimeDomainData(buffer);
    const amplitude = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / buffer.length);
    const pitch = autoCorrelate(buffer, ctx.sampleRate);
    onPitchAmplitude({ amplitude, pitch });
    rafId = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    cancelAnimationFrame(rafId);
    ctx.close();
  };
}
