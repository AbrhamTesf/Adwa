import React, { useState } from "react";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub */
export default function InspectionHub({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const [activeTab, setActiveTab] = useState("material");
  const [exploded, setExploded] = useState(false);

  const hotspots = exhibit?.hotspot_json ?? {};
  const isInstrument = exhibit?.category === "instrument";

  return (
    <div className="relative min-h-screen">
      <model-viewer
        src={exhibit?.glb_url || "/models/shotel_sword.glb"}
        camera-controls
        auto-rotate={!exploded}
        style={{ width: "100%", height: "70vh" }}
      >
        {/* Hotspot pins injected from hotspot_json — glowing pin-point markers */}
        {Object.entries(hotspots).map(([key, hs]) => (
          <button
            key={key}
            slot={`hotspot-${key}`}
            data-position={hs.position}
            data-normal={hs.normal}
            className="w-3 h-3 rounded-full bg-imperial-gold shadow-gold-glow"
            onClick={() => setActiveTab(hs.tab)}
          />
        ))}
      </model-viewer>

      <div className="absolute top-4 right-4 flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            className={`adwa-chip ${persona === p.id ? "border-imperial-gold" : ""}`}
            data-active={persona === p.id}
            onClick={() => setPersona(p.id)}
            title={p.label}
          >
            {p.icon}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 inset-x-0 adwa-glass rounded-b-none p-4">
        <div className="flex gap-4 mb-3">
          {["material", "craft", "usage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize pb-1 border-b-2 ${
                activeTab === tab ? "border-imperial-gold text-imperial-gold" : "border-transparent"
              }`}
            >
              {tab === "craft" ? "Craft & Method" : tab === "usage" ? "Usage & Significance" : tab}
            </button>
          ))}
        </div>
        <p className="text-sm text-parchment/80 mb-4">
          {exhibit?.persona_scripts?.[activeTab] || "Exhibit detail unavailable."}
        </p>

        <div className="flex gap-3">
          <button className="adwa-btn-secondary flex-1" onClick={() => setExploded((v) => !v)}>
            {exploded ? "Collapse View" : "Exploded View"}
          </button>
          {isInstrument && (
            <button className="adwa-btn-secondary flex-1" onClick={() => navigate("sensory")}>
              🥁 Sensory Mode
            </button>
          )}
          <button className="adwa-btn-primary flex-1" onClick={() => navigate("voiceGuide")}>
            Ask a Question
          </button>
        </div>
      </div>
    </div>
  );
}
