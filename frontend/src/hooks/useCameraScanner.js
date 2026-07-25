import { useCallback, useEffect, useRef, useState } from "react";

// StrictMode tears an effect down and immediately re-runs it. Releasing the
// camera on that grace period rather than instantly lets the remount reuse the
// live stream instead of racing a second getUserMedia call.
const STOP_GRACE_MS = 300;

/**
 * [1] CAMERA FRAME CAPTURE
 * Throttled to 1 capture / 2s, downscaled to 512px, base64 JPEG,
 * plus a cheap client-side brightness/blur heuristic so we don't
 * waste a Gemini call on a bad frame (Screen 4 hint text).
 */
export function useCameraScanner({ onFrameReady, intervalMs = 2000, targetSize = 512 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamPromiseRef = useRef(null);
  const stopTimerRef = useRef(null);
  const [hint, setHint] = useState(null); // "move_closer" | "hold_steady" | "more_light" | null

  const startStream = useCallback(async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    // Caching the promise keeps concurrent callers on one capture session —
    // a second parallel request ends the first stream and leaves the
    // viewfinder black on iOS even though permission was granted.
    if (!streamPromiseRef.current) {
      streamPromiseRef.current = navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
    }

    let stream;
    try {
      stream = await streamPromiseRef.current;
    } catch (err) {
      streamPromiseRef.current = null; // allow a retry after a failure
      throw err;
    }

    const video = videoRef.current;
    if (video) {
      if (video.srcObject !== stream) video.srcObject = stream;
      // iOS refuses to play a stream inline unless both flags are on the
      // element itself, and React's muted prop does not always reach the DOM.
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      try {
        await video.play();
      } catch {
        // Autoplay can still be blocked; the shutter tap retries with a gesture.
      }
    }

    return stream;
  }, []);

  const stopStream = useCallback(({ immediate = false } = {}) => {
    const release = () => {
      stopTimerRef.current = null;
      const pending = streamPromiseRef.current;
      streamPromiseRef.current = null;
      pending
        ?.then((stream) => stream.getTracks().forEach((track) => track.stop()))
        .catch(() => {});
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    if (immediate) release();
    else if (!stopTimerRef.current) stopTimerRef.current = setTimeout(release, STOP_GRACE_MS);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    // A frame grabbed before the first decode is solid black, which reads as
    // "too dark" and burns a scan attempt.
    if (video.readyState < 2 || !video.videoWidth) {
      setHint("hold_steady");
      video.play?.().catch(() => {});
      return null;
    }

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = targetSize;
    canvas.height = targetSize * (video.videoHeight / video.videoWidth || 1);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const brightness = estimateBrightness(imageData.data);

    if (brightness < 60) {
      setHint("more_light");
      return null;
    }
    setHint(null);

    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    return base64;
  }, [targetSize]);

  const startLoop = useCallback(() => {
    const id = setInterval(() => {
      const frame = captureFrame();
      if (frame) onFrameReady(frame);
    }, intervalMs);
    return () => clearInterval(id);
  }, [captureFrame, intervalMs, onFrameReady]);

  useEffect(
    () => () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    },
    []
  );

  return { videoRef, hint, startStream, stopStream, startLoop, captureFrame };
}

function estimateBrightness(pixels) {
  let sum = 0;
  const sampleStep = 40; // sparse sample for speed
  let count = 0;
  for (let i = 0; i < pixels.length; i += sampleStep) {
    sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    count++;
  }
  return sum / count;
}
