import React, { useState } from "react";
import { createRecoverySession } from "../../lib/sessionSync";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 8 — Post-Tour Memory Deck & Engagement */
export default function MemoryDeck({ navigate }) {
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);
  const sessionSyncStatus = useSessionStore((s) => s.sessionSyncStatus);
  const [recoveryLink, setRecoveryLink] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function saveTour() {
    setSaveMessage("");
    try {
      const saved = await createRecoverySession();
      setRecoveryLink(saved.recoveryLink);
      setSaveMessage("Your private recovery link is ready. Keep it somewhere safe.");
    } catch (error) {
      setSaveMessage(error.message);
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

  return (
    <div className="min-h-screen p-6">
      <h2 className="mb-6 text-center text-2xl text-imperial-gold">Your Adwa Recap</h2>
      <div className="flex flex-col gap-4">
        {visitedExhibitIds.length === 0 && <p className="text-center text-parchment/60">No exhibits visited yet this tour.</p>}
        {visitedExhibitIds.map((id) => (
          <div key={id} className="adwa-card">
            <p className="text-lg capitalize">{id.replace(/_/g, " ")}</p>
            <p className="text-sm text-parchment/60">Tap to review the quiz question</p>
          </div>
        ))}
      </div>
      <section className="adwa-glass mt-8 p-4">
        <h3 className="text-lg text-imperial-gold">Continue on another device</h3>
        <p className="mt-1 text-sm text-parchment/70">Create a private recovery link for your route, visited exhibits, preferences, and earned badges.</p>
        <button type="button" className="adwa-btn-secondary mt-4 w-full" onClick={saveTour} disabled={sessionSyncStatus === "saving"}>
          {sessionSyncStatus === "saving" ? "Saving your tour…" : "Save my tour"}
        </button>
        {recoveryLink && <div className="mt-3 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-imperial-gold/30 bg-obsidian px-3 py-2 text-xs text-parchment" value={recoveryLink} readOnly aria-label="Tour recovery link" /><button type="button" className="adwa-btn-primary px-4 py-2 text-sm" onClick={copyRecoveryLink}>Copy</button></div>}
        {saveMessage && <p className="mt-3 text-sm text-parchment/75" role="status">{saveMessage}</p>}
      </section>
      <div className="mt-4 flex gap-3"><button type="button" className="adwa-btn-primary flex-1">Email me my recap</button></div>
      <button className="mx-auto mt-6 block text-sm text-adwa-emerald underline" onClick={() => navigate("landing")}>Start a new tour</button>
    </div>
  );
}