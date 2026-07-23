import React from "react";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 8 — Post-Tour Memory Deck & Engagement */
export default function MemoryDeck({ navigate }) {
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-2xl text-imperial-gold mb-6 text-center">Your Adwa Recap</h2>

      <div className="flex flex-col gap-4">
        {visitedExhibitIds.length === 0 && (
          <p className="text-center text-parchment/60">No exhibits visited yet this tour.</p>
        )}
        {visitedExhibitIds.map((id) => (
          <div key={id} className="adwa-card">
            <p className="text-lg capitalize">{id.replace(/_/g, " ")}</p>
            <p className="text-sm text-parchment/60">Tap to review the quiz question</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button className="adwa-btn-secondary flex-1">Save my tour</button>
        <button className="adwa-btn-primary flex-1">Email me my recap</button>
      </div>

      <button className="mt-6 text-sm text-adwa-emerald underline mx-auto block" onClick={() => navigate("landing")}>
        Start a new tour
      </button>
    </div>
  );
}
