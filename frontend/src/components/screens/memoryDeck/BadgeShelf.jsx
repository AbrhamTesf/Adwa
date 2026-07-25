import React from "react";
import { evaluateBadges } from "./badgeEvaluator";

export default function BadgeShelf({ visitedExhibitIds = [], quizScores = {} }) {
  const badges = evaluateBadges(visitedExhibitIds, quizScores);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-imperial-gold-light/90">
          Digital Badge Collection
        </h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-imperial-gold/20 text-imperial-gold border border-imperial-gold/40 shadow-gold-glow">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center text-center ${
              badge.unlocked
                ? "bg-imperial-gold/15 border-imperial-gold/60 text-parchment shadow-gold-glow ring-1 ring-imperial-gold/40 animate-fadeIn"
                : "bg-obsidian-overlay/50 border-wanza-wood/30 text-parchment/40 opacity-60"
            }`}
          >
            <div className="text-2xl mb-1 filter drop-shadow">{badge.icon}</div>
            <p className="text-xs font-semibold leading-snug">{badge.title}</p>
            <p className="text-[10px] text-parchment/60 mt-1 leading-tight">{badge.description}</p>
            {!badge.unlocked ? (
              <span className="mt-1 text-[9px] uppercase tracking-wider text-parchment/40">
                🔒 Locked
              </span>
            ) : (
              <span className="mt-1 text-[9px] uppercase tracking-wider text-adwa-emerald font-semibold">
                ✨ Unlocked
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
