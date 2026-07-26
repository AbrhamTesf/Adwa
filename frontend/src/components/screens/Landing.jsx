import React, { useState } from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import AdwaDivider from "../ui/AdwaDivider.jsx";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";
import { useSessionStore, SUPPORTED_LANGUAGES } from "../../stores/useSessionStore";
import { useTranslation } from "../../lib/i18n";

/**
 * Screen 1 — Landing / Onboarding
 * Production-grade: ambient radial backdrop, entrance animations, CTA glow.
 */
export default function Landing({ navigate }) {
  const { t, language } = useTranslation();
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const [showPrimingModal, setShowPrimingModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  async function handleGrantPermissions() {
    setIsRequestingPermission(true);
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => {});
      }
    } catch (e) {
      console.warn("Permission priming skipped:", e);
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
    <div className="relative flex flex-col items-center justify-between min-h-screen px-6 py-8 overflow-hidden bg-obsidian text-parchment">

      {/* ── Ambient Radial Hero Backdrop ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(212,175,55,0.18) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0,154,68,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse 50% 50% at 20% 110%, rgba(224,0,0,0.08) 0%, transparent 55%)",
            "linear-gradient(to bottom, rgba(18,14,12,0.2) 0%, rgba(18,14,12,0.85) 100%)"
          ].join(", ")
        }}
      />

      {/* ── Header Branding ── */}
      <div className="relative z-10 text-center pt-2 animate-slide-up">
        <div className="inline-block px-3.5 py-1 mb-2 rounded-full text-xs font-semibold uppercase tracking-widest text-adwa-emerald bg-adwa-emerald/10 border border-adwa-emerald/30 shadow-sm">
          {t("landing.badge", "Victory of Adwa Centenary Companion")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-imperial-gold tracking-wide drop-shadow-md">
          {t("common.adwaLens", "Adwa Lens")}
        </h1>
        <p className="text-parchment/80 text-sm sm:text-base font-light mt-1">
          {t("landing.tagline", "Your museum, brought to life.")}
        </p>
      </div>

      {/* ── Regal Gasha Shield Hero Emblem ── */}
      <div className="relative z-10 my-auto w-full animate-slide-up-delay">
        <InteractiveModelViewer
          modelPath="/models/gasha.glb"
          posterPath="/models/posters/gasha_poster.png"
          altText="Adwa Imperial Victory Gasha Shield"
          exhibitTrivia="The Gasha shield was crafted from dense ox hide and reinforced with embossed gold leaf, serving as both defensive armor and a proud royal symbol during the Battle of Adwa in 1896."
          containerClassName="relative w-full max-w-sm aspect-square mx-auto flex items-center justify-center"
          camera-orbit="0deg 75deg auto"
          interaction-prompt="none"
        />
      </div>

      {/* ── Main Glassmorphic Action Panel ── */}
      <div className="relative z-10 text-center w-full max-w-md animate-fade-scale-delay">
        <div className="glass-card rounded-xl2 p-6 border border-imperial-gold/25">

          {/* Primary Action Button */}
          <PrimaryButton
            id="btn-start-tour"
            onClick={() => setShowPrimingModal(true)}
            className="w-full mb-3 py-3 text-base font-bold shadow-gold-glow hover:shadow-gold-glow-lg"
          >
            {t("landing.startTour", "Start My Tour")}
          </PrimaryButton>

          {/* Secondary Navigation Link */}
          <button
            id="btn-ticket-qr"
            className="text-adwa-emerald hover:text-adwa-emerald-light underline underline-offset-2 text-sm font-medium transition-colors duration-200"
            onClick={() => navigate("navigation")}
          >
            {t("landing.ticketQR", "I have a ticket QR")}
          </button>

          <AdwaDivider className="my-4 opacity-40" />

          {/* Supported Languages Selector */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-parchment/60 uppercase tracking-wider font-semibold">
              {t("landing.selectLanguage", "Select Language / ቋንቋ ይምረጡ")}
            </span>
            <div className="flex justify-center gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    id={`lang-btn-${lang.code}`}
                    onClick={() => setLanguage(lang.code)}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-imperial-gold text-obsidian font-bold shadow-gold-glow border border-imperial-gold-light ring-2 ring-imperial-gold/30 scale-105"
                        : "bg-obsidian-raised/80 text-parchment/80 hover:text-parchment hover:bg-obsidian-raised border border-parchment/20 hover:border-parchment/40"
                    ].join(" ")}
                    data-active={active}
                  >
                    {lang.flag} {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── In-App Soft Permission Priming Modal ── */}
      {showPrimingModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
          <div className="w-full max-w-sm p-6 text-left glass-card rounded-xl2 border border-imperial-gold/40 animate-fade-scale">

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-imperial-gold">
                {t("landing.modal.title", "Unlock Interactive Experience")}
              </h3>
              <button
                onClick={handleSkipPermissions}
                className="text-parchment/60 hover:text-parchment text-lg p-1 leading-none transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {t("landing.modal.description", "To experience WebAR 3D exhibit scanning and real-time Voice AI guide answers, Adwa Lens requires device permissions.")}
            </p>

            <div className="space-y-3 mb-6 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-obsidian-overlay/60 border border-parchment/10">
                <span className="text-lg">📷</span>
                <div>
                  <span className="font-semibold text-slate-100 block">
                    {t("landing.modal.cameraAccess", "Camera Access")}
                  </span>
                  <span className="text-slate-400">
                    {t("landing.modal.cameraDesc", "Scan historical exhibits and view 3D AR overlays")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-obsidian-overlay/60 border border-parchment/10">
                <span className="text-lg">🎙️</span>
                <div>
                  <span className="font-semibold text-slate-100 block">
                    {t("landing.modal.micAccess", "Microphone Access")}
                  </span>
                  <span className="text-slate-400">
                    {t("landing.modal.micDesc", "Ask your AI voice guide questions hands-free")}
                  </span>
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
                {isRequestingPermission
                  ? t("landing.modal.requestingAccess", "Requesting Access...")
                  : t("landing.modal.grantAccess", "Grant Access & Continue")}
              </PrimaryButton>

              <button
                id="btn-skip-permissions"
                onClick={handleSkipPermissions}
                className="w-full py-2 text-xs text-parchment/60 hover:text-parchment text-center underline underline-offset-2 transition-colors"
              >
                {t("landing.modal.skipPermissions", "Continue without media permissions")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
