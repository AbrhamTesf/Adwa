import React, { useEffect, useState } from "react";
import { useCameraScanner } from "../../hooks/useCameraScanner";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";

const HINT_TEXT = {
  more_light: "Try adding more light",
  move_closer: "Move closer to exhibit",
  hold_steady: "Hold camera steady"
};

/** Screen 4 — Camera AI Vision Scanner with Interactive Shutter & Laser Animation */
export default function CameraScanner({ navigate }) {
  const loadExhibit = useExhibitStore((s) => s.loadExhibit);
  const markVisited = useSessionStore((s) => s.markVisited);
  const [matched, setMatched] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Position exhibit inside reticle");

  const { videoRef, hint, startStream, captureFrame } = useCameraScanner({
    onFrameReady: () => {}
  });

  useEffect(() => {
    (async () => {
      try {
        await startStream();
      } catch (err) {
        setErrorMsg("Unable to access camera feed. Please check permissions.");
      }
    })();
  }, [startStream]);

  async function triggerScan() {
    if (isAnalyzing || matched) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    const frameBase64 = captureFrame();
    if (!frameBase64) {
      setErrorMsg("Frame captured was too dark. Please align exhibit clearly.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setStatusMsg("Analyzing exhibit with Gemini AI...");

    try {
      const res = await fetch("/api/vision-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: frameBase64 })
      });

      const data = await res.json();

      if (!res.ok && !data.quotaFallback) {
        if (res.status === 429 || data.error === "QUOTA_EXCEEDED") {
          setErrorMsg("Gemini API rate limit reached. Retrying in a few moments...");
        } else {
          setErrorMsg(data.message || "Failed to analyze frame.");
        }
        setIsAnalyzing(false);
        return;
      }

      if (data.aboveThreshold && data.exhibit_id && data.exhibit_id !== "unknown") {
        const exhibit = await loadExhibit(data.exhibit_id);
        markVisited(data.exhibit_id);
        setMatched({ ...data, exhibit });
        setStatusMsg("Exhibit identified!");
      } else {
        setErrorMsg("Exhibit not recognized with high confidence. Try repositioning.");
      }
    } catch (err) {
      setErrorMsg("Network error contacting vision proxy.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-obsidian text-parchment overflow-hidden flex flex-col justify-between">
      {/* Video Viewfinder */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />

      {/* Camera Shutter Flash Overlay */}
      {isFlashing && <div className="absolute inset-0 bg-white shutter-flash z-30 pointer-events-none" />}

      {/* Header bar */}
      <div className="relative z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button
          className="text-sm font-semibold px-4 py-2 rounded-full bg-obsidian/70 border border-wanza-wood text-parchment"
          onClick={() => navigate("landing")}
        >
          ← Back
        </button>
        <span className="text-imperial-gold font-display font-bold text-sm uppercase tracking-wider">
          Adwa Lens AI Scanner
        </span>
        <div className="w-16" />
      </div>

      {/* Center Viewfinder & Laser Reticle */}
      {!matched && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative w-72 h-72 rounded-2xl border-2 border-imperial-gold/80 shadow-gold-glow overflow-hidden bg-black/10 backdrop-blur-[2px]">
            {/* Reticle Corner Brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-imperial-gold" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-imperial-gold" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-imperial-gold" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-imperial-gold" />

            {/* Active Scanning Laser Line */}
            {isAnalyzing && (
              <>
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-imperial-gold to-transparent animate-scan-laser shadow-[0_0_15px_#D4AF37]" />
                <div className="absolute inset-0 bg-imperial-gold/5 pointer-events-none" />
              </>
            )}
          </div>

          {/* Status / Hint text */}
          <div className="mt-6 text-center max-w-xs">
            {isAnalyzing ? (
              <div className="adwa-glass px-4 py-2 inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-imperial-gold animate-ping" />
                <p className="text-sm font-medium text-imperial-gold-light">{statusMsg}</p>
              </div>
            ) : hint ? (
              <p className="text-xs text-parchment/90 adwa-glass px-4 py-2">{HINT_TEXT[hint]}</p>
            ) : (
              <p className="text-xs text-parchment/70 bg-obsidian/60 px-4 py-2 rounded-full backdrop-blur-md">
                Align exhibit inside reticle and tap scan
              </p>
            )}
          </div>

          {/* Error Toast Notification */}
          {errorMsg && (
            <div className="mt-4 px-4 py-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs text-red-200 text-center max-w-xs animate-fade-in backdrop-blur-md shadow-lg">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Shutter Button & Controls Bar */}
      {!matched && (
        <div className="relative z-20 p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <button
            className={`w-20 h-20 rounded-full border-4 border-imperial-gold flex items-center justify-center bg-obsidian-raised/90 text-2xl shadow-gold-glow transition-all ${
              isAnalyzing ? "opacity-50 cursor-not-allowed scale-95" : "active:scale-90 hover:scale-105"
            }`}
            onClick={triggerScan}
            disabled={isAnalyzing}
          >
            📷
          </button>
          <p className="text-xs text-parchment/60 font-medium">Tap button to capture & scan</p>

          <button
            className="text-xs text-adwa-emerald hover:underline py-1"
            onClick={() => navigate("navigation")}
          >
            Scan QR code instead →
          </button>
        </div>
      )}

      {/* Exhibit Matched Card Overlay */}
      {matched && (
        <div className="relative z-30 adwa-glass m-4 p-6 rounded-2xl animate-fade-in border-2 border-imperial-gold">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-adwa-emerald">
                Match Found ({(matched.confidence * 100).toFixed(0)}%)
              </span>
              <h3 className="text-2xl font-display font-bold text-imperial-gold capitalize">
                {matched.exhibit_id.replace(/_/g, " ")}
              </h3>
            </div>
            <button
              className="text-xs text-parchment/60 underline"
              onClick={() => {
                setMatched(null);
                setStatusMsg("Position exhibit inside reticle");
              }}
            >
              Rescan
            </button>
          </div>

          <p className="text-xs text-parchment/80 mb-6 bg-obsidian-overlay p-3 rounded-lg border border-wanza-wood/50">
            {matched.material_guess}
          </p>

          <button
            className="adwa-btn-primary w-full text-center flex items-center justify-center gap-2"
            onClick={() => navigate("inspection")}
          >
            Explore Exhibit in 3D →
          </button>
        </div>
      )}
    </div>
  );
}
