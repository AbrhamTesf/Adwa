import React, { useState, useCallback } from "react";
import { createRecoverySession } from "../../lib/sessionSync.js";
import { useSessionStore } from "../../stores/useSessionStore";
import BadgeShelf from "./memoryDeck/BadgeShelf";
import VisitedExhibitShelf from "./memoryDeck/VisitedExhibitShelf";
import ShareExportModal from "./memoryDeck/ShareExportModal";
import QuizEngineModal from "./memoryDeck/QuizEngineModal";

/**
 * Screen 8 — Post-Tour Memory Deck & Engagement
 * FEAT-011 & FEAT-018: Visited exhibit cards, interactive quiz engine, digital badge collection shelf,
 * share/export souvenir modal, cross-device recovery, and reset tour orchestration.
 */
export default function MemoryDeck({ navigate }) {
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);
  const persona = useSessionStore((s) => s.persona);
  const resetSession = useSessionStore((s) => s.resetSession);
  const sessionSyncStatus = useSessionStore((s) => s.sessionSyncStatus);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [quizScores, setQuizScores] = useState({});
  const [recoveryLink, setRecoveryLink] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const handleQuizAnswer = useCallback((exhibitId, isCorrect) => {
    setQuizScores((prev) => ({
      ...prev,
      [exhibitId]: isCorrect
    }));
  }, []);

  const handleQuizCompleted = useCallback((completedScores) => {
    setQuizScores((prev) => ({
      ...prev,
      ...completedScores
    }));
  }, []);

  const totalAnswered = Object.keys(quizScores).length;
  const totalCorrect = Object.values(quizScores).filter(Boolean).length;

  async function saveTour() {
    setSaveMessage("");
    try {
      const saved = await createRecoverySession();
      setRecoveryLink(saved.recoveryLink);
      setSaveMessage("Your private recovery link is ready. Keep it somewhere safe.");
    } catch (error) {
      setSaveMessage(error?.message || "Failed to save recovery link.");
    }
  }

  async function copyRecoveryLink() {
    try {
      await navigator.clipboard.writeText(recoveryLink);
      setSaveMessage("Recovery link copied.");
    } catch {
      setSaveMessage("Copy the recovery link manually from the field below.");
    }
  }

  const handleStartNewTour = () => {
    resetSession();
    navigate("landing");
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col justify-between">
      <div>
        {/* ---- Header ---- */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-imperial-gold-light/70">
            Screen 8 — Post-Tour Souvenir
          </span>
          <h2 className="text-3xl font-display text-imperial-gold mt-1">Your Adwa Recap</h2>
          <p className="text-xs text-parchment/70 mt-1">
            Review your discoveries, earned badges, and memorial souvenir card.
          </p>
          <div className="adwa-divider mt-4 max-w-xs mx-auto" />
        </div>

        {/* ---- Quiz Challenge Trigger Hero Card ---- */}
        <div className="adwa-glass p-4 rounded-xl mb-6 border border-imperial-gold/40 flex items-center justify-between shadow-gold-glow">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-imperial-gold">FEAT-018 Quiz Engine</span>
            <h3 className="text-base font-display text-parchment">Interactive Museum Quiz</h3>
            <p className="text-xs text-parchment/70">
              Test your knowledge on visited exhibits to unlock special badges!
            </p>
          </div>
          <button
            onClick={() => setIsQuizModalOpen(true)}
            className="adwa-btn-primary py-2.5 px-4 text-xs font-semibold whitespace-nowrap"
          >
            Take Quiz 🏆
          </button>
        </div>

        {/* ---- Digital Badge Shelf ---- */}
        <BadgeShelf visitedExhibitIds={visitedExhibitIds} quizScores={quizScores} />

        {/* ---- Visited Exhibit Cards & Mini Quizzes ---- */}
        <VisitedExhibitShelf visitedExhibitIds={visitedExhibitIds} onAnswer={handleQuizAnswer} />

        {/* ---- Continue On Another Device (Cross-Device Recovery) ---- */}
        <section className="adwa-glass mt-6 p-4 rounded-xl border border-imperial-gold/30">
          <h3 className="text-base font-semibold text-imperial-gold">Continue on another device</h3>
          <p className="mt-1 text-xs text-parchment/70">
            Create a private recovery link for your route, visited exhibits, preferences, and earned badges.
          </p>
          <button
            type="button"
            className="adwa-btn-secondary mt-3 w-full py-2.5 text-xs font-semibold"
            onClick={saveTour}
            disabled={sessionSyncStatus === "saving"}
          >
            {sessionSyncStatus === "saving" ? "Saving your tour…" : "Save my tour link"}
          </button>
          {recoveryLink && (
            <div className="mt-3 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-imperial-gold/30 bg-obsidian px-3 py-2 text-xs text-parchment focus:outline-none"
                value={recoveryLink}
                readOnly
                aria-label="Tour recovery link"
              />
              <button type="button" className="adwa-btn-primary px-4 py-2 text-xs font-semibold" onClick={copyRecoveryLink}>
                Copy
              </button>
            </div>
          )}
          {saveMessage && (
            <p className="mt-2 text-xs text-parchment/75" role="status">
              {saveMessage}
            </p>
          )}
        </section>
      </div>

      {/* ---- Footer Actions ---- */}
      <div className="mt-8 pt-4 border-t border-anza-wood/40 flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            className="adwa-btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
            onClick={() => setIsShareModalOpen(true)}
          >
            <span>📜</span> Save My Tour Souvenir
          </button>
          <button
            className="adwa-btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2"
            onClick={() => setIsShareModalOpen(true)}
          >
            <span>✉️</span> Email Me My Recap
          </button>
        </div>

        {showResetConfirm ? (
          <div className="p-4 bg-obsidian-overlay border border-adwa-crimson/50 rounded-xl text-center animate-fadeIn">
            <p className="text-xs text-parchment/90 mb-3">
              Are you sure? Starting a new tour will reset your current itinerary and visited exhibit history.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-2 bg-adwa-crimson text-parchment rounded-full text-xs font-semibold"
                onClick={handleStartNewTour}
              >
                Yes, Reset & Start New Tour
              </button>
              <button
                className="px-4 py-2 bg-obsidian-raised border border-wanza-wood text-parchment/70 rounded-full text-xs"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="text-xs text-adwa-emerald underline mx-auto block py-2 hover:text-imperial-gold transition-colors"
            onClick={() => setShowResetConfirm(true)}
          >
            Start a new tour
          </button>
        )}
      </div>

      {/* ---- Interactive Quiz Engine Modal ---- */}
      <QuizEngineModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        visitedExhibitIds={visitedExhibitIds}
        onCompleteQuiz={handleQuizCompleted}
      />

      {/* ---- Share/Export Modal ---- */}
      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        visitedExhibitIds={visitedExhibitIds}
        persona={persona}
        quizScore={{ correct: totalCorrect, total: totalAnswered }}
      />
    </div>
  );
}
