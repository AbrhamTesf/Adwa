import React from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import { useSessionStore, SUPPORTED_LANGUAGES } from "../../stores/useSessionStore";

/** Screen 1 — Landing / Onboarding */
export default function Landing({ navigate }) {
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);

  return (
    <div className="relative flex flex-col items-center justify-end min-h-screen px-6 pb-16 overflow-hidden">
      <model-viewer
        src="/models/shotel_sword.glb"
        auto-rotate
        camera-controls
        disable-zoom
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          "--poster-color": "transparent"
        }}
      />

      <div className="relative z-10 text-center adwa-glass p-6 w-full max-w-md">
        <h1 className="text-4xl mb-1 text-imperial-gold">Adwa Lens</h1>
        <p className="text-parchment/80 mb-6">Your museum, brought to life.</p>

        <PrimaryButton onClick={() => navigate("planner")} className="w-full mb-3">
          Start My Tour
        </PrimaryButton>

        <button
          className="text-adwa-emerald underline text-sm"
          onClick={() => navigate("navigation")}
        >
          I have a ticket QR
        </button>

        <div className="flex justify-center gap-2 mt-6">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`adwa-chip ${language === lang.code ? "border-imperial-gold" : ""}`}
              data-active={language === lang.code}
            >
              {lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
