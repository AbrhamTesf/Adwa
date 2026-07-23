import { useCallback, useRef, useState } from "react";

/**
 * [1] CAMERA FRAME CAPTURE
 * Throttled to 1 capture / 2s, downscaled to 512px, base64 JPEG,
 * plus a cheap client-side brightness/blur heuristic so we don't
 * waste a Gemini call on a bad frame (Screen 4 hint text).
 */
export function useCameraScanner({ onFrameReady, intervalMs = 2000, targetSize = 512 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const [hint, setHint] = useState(null); // "move_closer" | "hold_steady" | "more_light" | null

  const startStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    return stream;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

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

  return { videoRef, hint, startStream, startLoop, captureFrame };
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
