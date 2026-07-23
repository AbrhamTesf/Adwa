import React, { useEffect, useState } from "react";
import { useCameraScanner } from "../../hooks/useCameraScanner";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";

const HINT_TEXT = {
  more_light: "Try more light",
  move_closer: "Move closer",
  hold_steady: "Hold steady"
};

/** Screen 4 — Camera AI Vision Scanner ([1]-[2] of the data flow pipeline) */
export default function CameraScanner({ navigate }) {
  const loadExhibit = useExhibitStore((s) => s.loadExhibit);
  const markVisited = useSessionStore((s) => s.markVisited);
  const [matched, setMatched] = useState(null);
  const [scanning, setScanning] = useState(true);

  const { videoRef, hint, startStream, startLoop } = useCameraScanner({
    onFrameReady: handleFrame
  });

  async function handleFrame(base64) {
    if (!scanning) return;
    const res = await fetch("/api/vision-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 })
    });
    const data = await res.json();

    if (data.aboveThreshold && data.exhibit_id !== "unknown") {
      setScanning(false);
      const exhibit = await loadExhibit(data.exhibit_id);
      markVisited(data.exhibit_id);
      setMatched({ ...data, exhibit });
    }
  }

  useEffect(() => {
    let stopLoop = () => {};
    (async () => {
      await startStream();
      stopLoop = startLoop();
    })();
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />

      {!matched && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-64 h-64 border-4 border-imperial-gold rounded-xl2 shadow-gold-glow" />
          {hint && <p className="mt-4 text-parchment adwa-glass px-4 py-2">{HINT_TEXT[hint]}</p>}
          <button
            className="absolute bottom-10 adwa-btn-secondary"
            onClick={() => navigate("navigation")}
          >
            Scan QR code instead
          </button>
        </div>
      )}

      {matched && (
        <div className="absolute bottom-0 inset-x-0 adwa-glass p-6 rounded-t-xl2 rounded-b-none">
          <p className="text-imperial-gold text-lg mb-1">{matched.exhibit_id.replace(/_/g, " ")}</p>
          <p className="text-sm text-parchment/70 mb-4">{matched.material_guess}</p>
          <button className="adwa-btn-primary w-full" onClick={() => navigate("inspection")}>
            View in 3D
          </button>
        </div>
      )}
    </div>
  );
}
