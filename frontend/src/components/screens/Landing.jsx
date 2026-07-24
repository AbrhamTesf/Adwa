import React, { useState } from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import AdwaDivider from "../ui/AdwaDivider.jsx";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";
import { useSessionStore, SUPPORTED_LANGUAGES } from "../../stores/useSessionStore";

/**
 * Screen 1 — Landing / Onboarding with Static Regal Gasha Shield Hero Emblem
 * Adheres strictly to docs/adwa_lens_architecture.md Section 2
 */
export default function Landing({ navigate }) {
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const [showPrimingModal, setShowPrimingModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  /**
   * Soft permission grant handler.
   * Explains intent before OS permission dialogs fire to maximize grant rates.
   */
  async function handleGrantPermissions() {
    setIsRequestingPermission(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => {
          // Fall back gracefully if user rejects or device lacks inputs
        });
      }
    } catch (e) {
      console.warn("Permission priming skipped or unavailable:", e);
    } finally {
      setIsRequestingPermission(false);
      setShowPrimingModal(false);
      navigate("planner");
    }
  }

  function handleSkipPermissions() {
    setShowPrimingModal(false);
    navigate("planner");
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen px-6 py-8 overflow-hidden bg-obsidian">
      {/* Background Radial Geometry Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent pointer-events-none z-0" />

      {/* Header Branding */}
      <div className="relative z-10 text-center pt-2">
        <div className="inline-block px-3.5 py-1 mb-2 rounded-full text-xs font-semibold uppercase tracking-widest text-adwa-emerald bg-adwa-emerald/10 border border-adwa-emerald/30 shadow-sm">
          Victory of Adwa Centenary Companion
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-imperial-gold tracking-wide drop-shadow-md">
          Adwa Lens
        </h1>
        <p className="text-parchment/80 text-sm sm:text-base font-light">Your museum, brought to life.</p>
      </div>

      {/* Regal Gasha Shield Hero Emblem with Interactive 2D Loading UX */}
      <div className="relative z-10 my-auto w-full">
        <InteractiveModelViewer
          modelPath="/models/gasha.glb"
          posterPath="/models/posters/gasha_poster.webp"
          altText="Adwa Imperial Victory Gasha Shield"
          exhibitTrivia="The Gasha shield was crafted from dense ox hide and reinforced with embossed gold leaf, serving as both defensive armor and a proud royal symbol during the Battle of Adwa in 1896."
          containerClassName="relative w-full max-w-sm aspect-square mx-auto flex items-center justify-center"
          camera-orbit="0deg 75deg auto"
          interaction-prompt="none"
        />
      </div>

      {/* Main Glassmorphic Action Panel */}
      <div className="relative z-10 text-center adwa-glass p-6 w-full max-w-md border border-imperial-gold/30 rounded-xl2 shadow-gold-glow backdrop-blur-md">
        {/* Primary Action Button */}
        <PrimaryButton
          id="btn-start-tour"
          onClick={() => setShowPrimingModal(true)}
          className="w-full mb-3 py-3 text-base shadow-gold-glow"
        >
          Start My Tour
        </PrimaryButton>

        {/* Secondary Navigation Link */}
        <button
          id="btn-ticket-qr"
          className="text-adwa-emerald hover:text-adwa-emerald-light underline text-sm font-medium transition-colors"
          onClick={() => navigate("navigation")}
        >
          I have a ticket QR
        </button>

        <AdwaDivider className="my-4 opacity-40" />

        {/* Supported Languages Selector */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-parchment/60 uppercase tracking-wider font-semibold">
            Select Language / ቋንቋ ይምረጡ
          </span>
          <div className="flex justify-center gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-btn-${lang.code}`}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-imperial-gold text-obsidian font-bold shadow-gold-glow border border-imperial-gold-light"
                      : "bg-obsidian-raised/80 text-parchment/80 hover:text-parchment border border-parchment/20"
                  }`}
                  data-active={active}
                >
                  {lang.flag} {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* In-App Soft Permission Priming Modal */}
      {showPrimingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm p-6 text-left adwa-glass border border-imperial-gold/40 rounded-xl2 shadow-gold-glow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-imperial-gold">
                Unlock Interactive Experience
              </h3>
              <button
                onClick={handleSkipPermissions}
                className="text-parchment/60 hover:text-parchment text-lg p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-parchment/80 mb-4 leading-relaxed">
              To experience WebAR 3D exhibit scanning and real-time Voice AI guide answers, Adwa Lens requires device permissions.
            </p>

            <div className="space-y-3 mb-6 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-obsidian-overlay/60 border border-parchment/10">
                <span className="text-lg">📷</span>
                <div>
                  <span className="font-semibold text-parchment block">Camera Access</span>
                  <span className="text-parchment/70">Scan historical exhibits and view 3D AR overlays</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-obsidian-overlay/60 border border-parchment/10">
                <span className="text-lg">🎙️</span>
                <div>
                  <span className="font-semibold text-parchment block">Microphone Access</span>
                  <span className="text-parchment/70">Ask your AI voice guide questions hands-free</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <PrimaryButton
                id="btn-grant-permissions"
                onClick={handleGrantPermissions}
                disabled={isRequestingPermission}
                className="w-full text-sm"
              >
                {isRequestingPermission ? "Requesting Access..." : "Grant Access & Continue"}
              </PrimaryButton>

              <button
                id="btn-skip-permissions"
                onClick={handleSkipPermissions}
                className="w-full py-2 text-xs text-parchment/60 hover:text-parchment text-center underline"
              >
                Continue without media permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
