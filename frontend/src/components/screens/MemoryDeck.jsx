import React, { useState, useCallback } from "react";
import { useSessionStore } from "../../stores/useSessionStore";
import BadgeShelf from "./memoryDeck/BadgeShelf";
import VisitedExhibitShelf from "./memoryDeck/VisitedExhibitShelf";
import ShareExportModal from "./memoryDeck/ShareExportModal";

/**
 * Screen 8 — Post-Tour Memory Deck & Engagement
 * FEAT-011: Visited exhibit cards, mini-quizzes, digital badge collection shelf,
 * share/export souvenir modal, and reset tour orchestration.
 */
export default function MemoryDeck({ navigate }) {
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);
  const persona = useSessionStore((s) => s.persona);
  const resetSession = useSessionStore((s) => s.resetSession);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [quizScores, setQuizScores] = useState({});

  const handleQuizAnswer = useCallback((exhibitId, isCorrect) => {
    setQuizScores((prev) => ({
      ...prev,
      [exhibitId]: isCorrect
    }));
  }, []);

  const totalAnswered = Object.keys(quizScores).length;
  const totalCorrect = Object.values(quizScores).filter(Boolean).length;

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

        {/* ---- Digital Badge Shelf ---- */}
        <BadgeShelf visitedExhibitIds={visitedExhibitIds} />

        {/* ---- Visited Exhibit Cards & Mini Quizzes ---- */}
        <VisitedExhibitShelf visitedExhibitIds={visitedExhibitIds} onAnswer={handleQuizAnswer} />
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
