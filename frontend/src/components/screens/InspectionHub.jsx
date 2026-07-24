import "@google/model-viewer";
import React, { useMemo, useState } from "react";
import { PERSONAS } from "../../personas/personas";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";

const TABS = [
  { id: "material", label: "Material", icon: "◆" },
  { id: "craft", label: "Craft & Method", icon: "✦" },
  { id: "usage", label: "Usage & Significance", icon: "◈" }
];

function normaliseHotspots(hotspotJson) {
  if (Array.isArray(hotspotJson)) {
    return hotspotJson.map((hotspot, index) => ({
      id: hotspot.id ?? hotspot.key ?? `hotspot-${index}`,
      ...hotspot
    }));
  }

  return Object.entries(hotspotJson ?? {}).map(([id, hotspot]) => ({
    id,
    ...hotspot
  }));
}

/** Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub */
export default function InspectionHub({ navigate }) {
  const exhibit = useExhibitStore((state) => state.activeExhibit);
  const isLoading = useExhibitStore((state) => state.isLoading);
  const scanError = useExhibitStore((state) => state.scanError);
  const persona = useSessionStore((state) => state.persona);
  const setPersona = useSessionStore((state) => state.setPersona);
  const markVisited = useSessionStore((state) => state.markVisited);

  const hotspots = useMemo(
    () => normaliseHotspots(exhibit?.hotspot_json),
    [exhibit?.hotspot_json]
  );
  const [activeTab, setActiveTab] = useState("material");
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(false);

  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId);
  const isInstrument = exhibit?.category === "instrument";
  const modelSource = exhibit?.glb_url || "/models/shotel_sword.glb";
  const activeTabText =
    selectedHotspot?.content?.[activeTab] ||
    selectedHotspot?.[activeTab] ||
    exhibit?.persona_scripts?.[activeTab] ||
    "Select a glowing point on the artifact to explore its story.";

  function chooseHotspot(hotspot) {
    setSelectedHotspotId(hotspot.id);
    setActiveTab(hotspot.tab || "material");
    setAutoRotate(false);
  }

  function handleModelInteraction() {
    setAutoRotate(false);
  }

  function openSensoryMode() {
    if (exhibit?.exhibit_id) markVisited(exhibit.exhibit_id);
    navigate?.("sensory");
  }

  function openVoiceGuide() {
    if (exhibit?.exhibit_id) markVisited(exhibit.exhibit_id);
    navigate?.("voiceGuide");
  }

  if (isLoading) {
    return (
      <section className="grid min-h-screen place-items-center bg-obsidian bg-adwa-geometry px-6 text-center text-parchment">
        <div>
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-imperial-gold border-t-transparent" />
          <p className="font-display text-lg">Preparing the artifact…</p>
        </div>
      </section>
    );
  }

  if (scanError) {
    return (
      <section className="grid min-h-screen place-items-center bg-obsidian bg-adwa-geometry px-6 text-center text-parchment">
        <div className="max-w-sm rounded-xl2 border border-adwa-crimson/60 bg-obsidian-raised p-6">
          <p className="mb-2 font-display text-xl text-imperial-gold">Artifact unavailable</p>
          <p className="mb-5 text-sm text-parchment/75">{scanError}</p>
          <button className="adwa-btn-primary" onClick={() => navigate?.("scanner")}>
            Return to scanner
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-obsidian text-parchment">
      <model-viewer
        src={modelSource}
        alt={exhibit?.name || "Shotel curved sword"}
        camera-controls
        interaction-prompt="auto"
        auto-rotate={autoRotate ? "" : undefined}
        auto-rotate-delay="0"
        rotation-per-second="18deg"
        shadow-intensity="1"
        exposure="1"
        className="h-[72vh] w-full bg-adwa-geometry"
        onPointerDown={handleModelInteraction}
        onTouchStart={handleModelInteraction}
      >
        {hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            slot={`hotspot-${hotspot.id}`}
            data-position={hotspot.position}
            data-normal={hotspot.normal}
            type="button"
            aria-label={`Open ${hotspot.label || hotspot.id} details`}
            aria-pressed={selectedHotspotId === hotspot.id}
            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-parchment bg-imperial-gold text-xs text-obsidian shadow-gold-glow transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-parchment ${
              selectedHotspotId === hotspot.id ? "scale-125 ring-2 ring-parchment" : "animate-pulse"
            }`}
            onClick={() => chooseHotspot(hotspot)}
          >
            +
          </button>
        ))}
      </model-viewer>

      <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
        <div className="max-w-[70%] rounded-xl2 border border-imperial-gold/30 bg-obsidian/80 px-4 py-3 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">3D inspection</p>
          <h1 className="font-display text-lg">{exhibit?.name || "Shotel Curved Sword"}</h1>
          <p className="mt-1 text-xs text-parchment/65">
            {autoRotate ? "Drag or pinch to inspect" : "Manual orbit and pinch zoom enabled"}
          </p>
        </div>
        <div className="flex rounded-xl2 border border-imperial-gold/30 bg-obsidian/80 p-1 backdrop-blur">
          {PERSONAS.map((personaOption) => (
            <button
              key={personaOption.id}
              type="button"
              className={`grid h-9 w-9 place-items-center rounded-lg text-base transition ${
                persona === personaOption.id
                  ? "bg-imperial-gold text-obsidian"
                  : "text-parchment hover:bg-obsidian-overlay"
              }`}
              aria-label={`Switch to ${personaOption.label}`}
              title={personaOption.label}
              onClick={() => setPersona(personaOption.id)}
            >
              {personaOption.icon}
            </button>
          ))}
        </div>
      </div>

      <aside className="absolute bottom-0 left-0 right-0 rounded-t-xl2 border-t border-imperial-gold/30 bg-obsidian-raised/95 p-4 shadow-gold-glow backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-imperial-gold">Hotspot details</p>
            <h2 className="font-display text-base">{selectedHotspot?.label || "Explore the artifact"}</h2>
          </div>
          {!autoRotate && (
            <button
              type="button"
              className="text-xs text-imperial-gold underline underline-offset-4"
              onClick={() => setAutoRotate(true)}
            >
              Resume rotation
            </button>
          )}
        </div>

        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-parchment/15" role="tablist" aria-label="Artifact detail tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "border-imperial-gold text-imperial-gold"
                  : "border-transparent text-parchment/65 hover:text-parchment"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span aria-hidden="true" className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <p className="min-h-12 text-sm leading-6 text-parchment/85">{activeTabText}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="adwa-btn-secondary flex-1"
            aria-pressed={exploded}
            onClick={() => setExploded((isExploded) => !isExploded)}
          >
            {exploded ? "Layer view on" : "Exploded view"}
          </button>
          {isInstrument && (
            <button type="button" className="adwa-btn-secondary flex-1" onClick={openSensoryMode}>
              Sensory mode
            </button>
          )}
          <button type="button" className="adwa-btn-primary flex-1" onClick={openVoiceGuide}>
            Ask a question
          </button>
        </div>
      </aside>
    </section>
  );
}