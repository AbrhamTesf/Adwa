import React, { useState } from "react";
import { evaluateBadges } from "./badgeEvaluator";

export default function ShareExportModal({ isOpen, onClose, visitedExhibitIds = [], persona = "scholar", quizScore = { correct: 0, total: 0 } }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const unlockedBadges = evaluateBadges(visitedExhibitIds).filter((b) => b.unlocked);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSentSuccess(true);
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-fadeIn">
      <div className="adwa-glass max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-parchment/60 hover:text-parchment text-lg"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h3 className="text-xl font-display text-imperial-gold mb-1 text-center">
          Your Adwa Tour Souvenir
        </h3>
        <p className="text-xs text-parchment/70 text-center mb-4">
          Digital certificate of museum completion
        </p>

        {/* ---- Certificate Card Collage Preview ---- */}
        <div className="bg-obsidian-raised border-2 border-imperial-gold/50 rounded-xl p-4 mb-6 relative overflow-hidden shadow-gold-glow">
          <div className="adwa-divider mb-3" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-imperial-gold uppercase tracking-wider">Adwa Victory Museum</p>
              <p className="text-[10px] text-parchment/60">Official Visitor Record</p>
            </div>
            <span className="text-2xl">🇪🇹</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-3 my-2 bg-obsidian-overlay/60 rounded-lg border border-wanza-wood/30">
            <div>
              <p className="text-lg font-bold text-imperial-gold-light">{visitedExhibitIds.length}</p>
              <p className="text-[10px] text-parchment/60">Exhibits</p>
            </div>
            <div>
              <p className="text-lg font-bold text-adwa-emerald">{unlockedBadges.length}</p>
              <p className="text-[10px] text-parchment/60">Badges</p>
            </div>
            <div>
              <p className="text-lg font-bold text-imperial-gold">{quizScore.correct}</p>
              <p className="text-[10px] text-parchment/60">Quiz Score</p>
            </div>
          </div>

          {unlockedBadges.length > 0 && (
            <div className="mt-3 pt-2 border-t border-anza-wood/30">
              <p className="text-[10px] uppercase font-semibold text-imperial-gold-light mb-1">Badges Earned:</p>
              <div className="flex flex-wrap gap-1.5">
                {unlockedBadges.map((b) => (
                  <span key={b.id} className="text-xs px-2 py-0.5 rounded bg-imperial-gold/20 text-imperial-gold border border-imperial-gold/40 flex items-center gap-1">
                    <span>{b.icon}</span> {b.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-parchment/40 mt-3 text-right">Guide: <span className="capitalize">{persona}</span></p>
        </div>

        {/* ---- Actions ---- */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCopyLink}
            className="adwa-btn-secondary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5"
          >
            <span>🔗</span> {copiedLink ? "Link Copied!" : "Share Tour Link"}
          </button>
        </div>

        {/* ---- Email Form ---- */}
        <div className="border-t border-anza-wood/40 pt-4">
          <p className="text-xs font-semibold text-imperial-gold-light mb-1 text-left">
            📧 Email Me My Digital Souvenir
          </p>
          <p className="text-[11px] text-parchment/60 text-left mb-3">
            No password required — send a recap link directly to your inbox.
          </p>

          {sentSuccess ? (
            <div className="p-3 bg-adwa-emerald/20 border border-adwa-emerald rounded-lg text-xs text-parchment text-center">
              🎉 <strong>Recap sent!</strong> Check your email for your digital souvenir.
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-obsidian-overlay border border-wanza-wood rounded-full px-4 py-2 text-xs text-parchment focus:border-imperial-gold focus:outline-none"
              />
              {emailError && <p className="text-[10px] text-adwa-crimson text-left pl-2">{emailError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="adwa-btn-primary py-2.5 text-xs font-semibold shadow-gold-glow flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Sending...
                  </>
                ) : (
                  "Send Recap to Email"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
