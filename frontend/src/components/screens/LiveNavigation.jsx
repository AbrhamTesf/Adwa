import React from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Screen 3 — Indoor Mapping & Live Navigation.
 * Hackathon MVP: hardcoded walking path + manual "I'm here" QR
 * check-in rather than real BLE/Wi-Fi RTT triangulation (Section 5.2).
 */
export default function LiveNavigation({ navigate }) {
  const itinerary = useSessionStore((s) => s.itinerary);
  const currentStopIndex = useSessionStore((s) => s.currentStopIndex);
  const stop = itinerary[currentStopIndex];

  return (
    <div className="min-h-screen flex flex-col p-6">
      <h2 className="text-2xl text-imperial-gold mb-4">Your Route</h2>

      <div className="adwa-card flex-1 flex items-center justify-center mb-4">
        {/* SVG 2D floor map placeholder — swap for real venue SVG (Stream C) */}
        <svg viewBox="0 0 200 200" className="w-full h-64">
          <rect x="10" y="10" width="180" height="180" rx="12" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <circle cx="100" cy="150" r="6" fill="#009A44" />
          <text x="100" y="30" textAnchor="middle" fill="#F4E9D8" fontSize="10">
            {stop ? stop.name : "Museum Floor"}
          </text>
        </svg>
      </div>

      <div className="adwa-glass p-4 mb-4">
        <p className="text-sm text-parchment/70 mb-1">Next stop</p>
        <p className="text-lg">{stop ? stop.name : "No itinerary yet"}</p>
      </div>

      <PrimaryButton onClick={() => navigate("scanner")}>I'm here — Scan Exhibit</PrimaryButton>
    </div>
  );
}
