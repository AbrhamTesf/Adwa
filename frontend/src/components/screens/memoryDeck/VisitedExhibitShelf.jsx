import React from "react";
import { useVisitedExhibits } from "./useVisitedExhibits";
import MiniQuizCard from "./MiniQuizCard";

export default function VisitedExhibitShelf({ visitedExhibitIds = [], onAnswer }) {
  const { exhibits, loading } = useVisitedExhibits(visitedExhibitIds);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mb-6">
        <div className="h-28 bg-obsidian-overlay/60 rounded-xl animate-pulse border border-wanza-wood/30" />
        <div className="h-28 bg-obsidian-overlay/60 rounded-xl animate-pulse border border-wanza-wood/30" />
      </div>
    );
  }

  if (!visitedExhibitIds || visitedExhibitIds.length === 0) {
    return (
      <div className="adwa-card text-center py-8 px-4 mb-6 border-dashed border-imperial-gold/30">
        <span className="text-4xl block mb-2">🗺️</span>
        <h4 className="text-base font-semibold text-imperial-gold mb-1">No Exhibits Visited Yet</h4>
        <p className="text-xs text-parchment/70 max-w-xs mx-auto">
          Scan exhibit QR codes or explore the 3D models in the Inspection Hub to unlock souvenir recap cards!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-imperial-gold-light/90 text-left">
        Visited Exhibits Recap ({exhibits.length})
      </h3>

      {exhibits.map((exhibit) => {
        const takeaway =
          exhibit?.persona_scripts?.usage ||
          exhibit?.persona_scripts?.craft ||
          exhibit?.persona_scripts?.material ||
          "Historic artifact commemorated at the Adwa Victory Memorial.";

        return (
          <div key={exhibit.exhibit_id || exhibit.id} className="adwa-card relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-adwa-emerald/20 text-adwa-emerald border border-adwa-emerald/30">
                  {exhibit.category || "Heritage"}
                </span>
                <h4 className="text-lg font-display text-parchment mt-1">
                  {exhibit.name || exhibit.exhibit_id}
                </h4>
              </div>
              <span className="text-2xl" role="img" aria-label="Exhibit icon">
                {exhibit.category === "weapon" ? "⚔️" : exhibit.category === "instrument" ? "🎺" : "👑"}
              </span>
            </div>

            <p className="text-xs text-parchment/80 leading-relaxed mb-3">
              <strong className="text-imperial-gold-light">Key Insight:</strong> {takeaway}
            </p>

            <MiniQuizCard exhibit={exhibit} onAnswer={onAnswer} />
          </div>
        );
      })}
    </div>
  );
}
