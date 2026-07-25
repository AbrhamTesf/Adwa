import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { PERSONAS } from "../../personas/personas";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const TABS = [
  { id: "material", label: "Material", icon: "◆" },
  { id: "craft", label: "Craft & Method", icon: "✦" },
  { id: "usage", label: "Usage & Significance", icon: "◈" }
];

/**
 * Exploded-view part definitions for the Shotel Sword.
 *
 * The shotel_sword.glb model contains two mesh nodes:
 *   • tripo_part_1 — upper blade geometry
 *   • tripo_part_0 — lower hilt / guard geometry
 *
 * A third "Leather Sheath" callout is rendered without a mesh
 * because the current model does not include a separate sheath node.
 * Its callout badge still appears for educational value.
 */
const EXPLODED_PARTS = [
  {
    meshName: "tripo_part_1",
    label: "Curved Blade",
    description: "Damascus-forged high-carbon steel optimized for cavalry combat.",
    icon: "⚔️",
    offset: { x: 0, y: 0.15, z: 0 },
    calloutAnchor: { top: "15%", left: "48%" }
  },
  {
    meshName: "tripo_part_0",
    label: "Hilt Guard",
    description: "Hand-carved horn grip with imperial gold inlay.",
    icon: "🛡️",
    offset: { x: 0, y: -0.15, z: 0 },
    calloutAnchor: { top: "62%", left: "48%" }
  },
  {
    meshName: null,
    label: "Leather Sheath",
    description: "Embossed leather scabbard with brass fittings.",
    icon: "📜",
    offset: null,
    calloutAnchor: { top: "42%", left: "80%" }
  }
];

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

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

/**
 * Traverse the model-viewer's internal Three.js scene to locate the loaded
 * model container. model-viewer v3.x stores the Three.js ModelScene behind
 * a private Symbol. We enumerate symbols to find the one that exposes
 * `modelContainer` — the Object3D root holding all loaded glTF nodes.
 */
function getModelScene(modelViewerEl) {
  if (!modelViewerEl) return null;
  try {
    const keys = Reflect.ownKeys(modelViewerEl);
    for (const key of keys) {
      if (typeof key !== "symbol") continue;
      const val = modelViewerEl[key];
      if (val && typeof val === "object" && val.modelContainer) {
        return val;
      }
    }
  } catch {
    /* swallow – scene access unsupported */
  }
  return null;
}

/**
 * Recursively find a mesh/node with `name` inside the scene graph.
 */
function findNodeByName(root, name) {
  if (!root) return null;
  if (root.name === name) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */

/** Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub with Exploded View */
export default function InspectionHub({ navigate }) {
  /* ── Store selectors ───────────────────────────────────── */
  const exhibit = useExhibitStore((state) => state.activeExhibit);
  const isLoading = useExhibitStore((state) => state.isLoading);
  const scanError = useExhibitStore((state) => state.scanError);
  const persona = useSessionStore((state) => state.persona);
  const setPersona = useSessionStore((state) => state.setPersona);
  const markVisited = useSessionStore((state) => state.markVisited);

  /* ── Local state ───────────────────────────────────────── */
  const hotspots = useMemo(
    () => normaliseHotspots(exhibit?.hotspot_json),
    [exhibit?.hotspot_json]
  );
  const [activeTab, setActiveTab] = useState("material");
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  /* ── Refs ───────────────────────────────────────────────── */
  const modelViewerRef = useRef(null);
  /** Map of meshName → { x0, y0, z0 } initial position vectors */
  const initialPositionsRef = useRef({});
  /** Map of meshName → Three.js node reference */
  const meshNodesRef = useRef({});
  /** Active GSAP tweens for cleanup */
  const tweensRef = useRef([]);

  /* ── Derived values ────────────────────────────────────── */
  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId);
  const isInstrument = exhibit?.category === "instrument";
  const modelSource = exhibit?.glb_url || "/models/shotel_sword.glb";
  const exhibitId = exhibit?.exhibit_id || "shotel_sword";
  const posterPath = `/models/posters/${exhibitId}_poster.webp`;
  const exhibitTrivia =
    exhibit?.persona_scripts?.usage ||
    exhibit?.persona_scripts?.craft ||
    "The Shotel's unique semi-circular crescent curve enabled Ethiopian warriors to reach around enemy shields during close-quarters combat at Adwa.";

  const activeTabText =
    selectedHotspot?.content?.[activeTab] ||
    selectedHotspot?.[activeTab] ||
    exhibit?.persona_scripts?.[activeTab] ||
    "Select a glowing point on the artifact to explore its story.";

  /* ── Model load handler ────────────────────────────────── */
  const handleModelLoad = useCallback(() => {
    setModelReady(true);

    const mvEl = modelViewerRef.current;
    const scene = getModelScene(mvEl);
    if (!scene?.modelContainer) return;

    const container = scene.modelContainer;
    const positions = {};
    const nodes = {};

    for (const part of EXPLODED_PARTS) {
      if (!part.meshName) continue;
      const node = findNodeByName(container, part.meshName);
      if (node) {
        /* Store the initial local-space position (x0, y0, z0) */
        positions[part.meshName] = {
          x0: node.position.x,
          y0: node.position.y,
          z0: node.position.z
        };
        nodes[part.meshName] = node;
      }
    }

    initialPositionsRef.current = positions;
    meshNodesRef.current = nodes;
  }, []);

  /* ── Exploded-view GSAP animation ──────────────────────── */
  useEffect(() => {
    if (!modelReady) return;

    /* Kill any in-flight tweens to prevent overlaps */
    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];

    const mvEl = modelViewerRef.current;

    for (const part of EXPLODED_PARTS) {
      if (!part.meshName || !part.offset) continue;
      const node = meshNodesRef.current[part.meshName];
      const origin = initialPositionsRef.current[part.meshName];
      if (!node || !origin) continue;

      const target = exploded
        ? {
            x: origin.x0 + part.offset.x,
            y: origin.y0 + part.offset.y,
            z: origin.z0 + part.offset.z
          }
        : { x: origin.x0, y: origin.y0, z: origin.z0 };

      const tween = gsap.to(node.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 0.8,
        ease: "power3.inOut",
        onUpdate: () => {
          /* Force model-viewer to re-render after each GSAP frame */
          if (mvEl) {
            try { mvEl.requestUpdate?.(); } catch { /* noop */ }
            mvEl.dispatchEvent?.(new CustomEvent("camera-change"));
          }
        }
      });
      tweensRef.current.push(tween);
    }

    /* Pause auto-rotate during exploded mode so parts stay visible */
    if (exploded) setAutoRotate(false);

    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
    };
  }, [exploded, modelReady]);

  /* ── Interaction handlers ──────────────────────────────── */
  function chooseHotspot(hotspot) {
    setSelectedHotspotId(hotspot.id);
    setActiveTab(hotspot.tab || "material");
    setAutoRotate(false);
  }

  function handleModelInteraction() {
    setAutoRotate(false);
  }

  function toggleExploded() {
    setExploded((prev) => !prev);
  }

  function openSensoryMode() {
    if (exhibit?.exhibit_id) markVisited(exhibit.exhibit_id);
    navigate?.("sensory");
  }

  function openVoiceGuide() {
    if (exhibit?.exhibit_id) markVisited(exhibit.exhibit_id);
    navigate?.("voiceGuide");
  }

  /* ── Loading state ─────────────────────────────────────── */
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

  /* ── Error state ───────────────────────────────────────── */
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

  /* ── Main render ───────────────────────────────────────── */
  return (
    <section className="relative min-h-screen overflow-hidden bg-obsidian text-parchment">
      {/* ─ 3D Canvas ─────────────────────────────────────── */}
      <InteractiveModelViewer
        ref={modelViewerRef}
        modelPath={modelSource}
        posterPath={posterPath}
        altText={exhibit?.name || "Shotel curved sword"}
        exhibitTrivia={exhibitTrivia}
        containerClassName="relative h-[72vh] w-full"
        className="h-full w-full bg-adwa-geometry"
        autoRotate={autoRotate}
        cameraControls
        shadowIntensity="1"
        exposure="1"
        onPointerDown={handleModelInteraction}
        onTouchStart={handleModelInteraction}
        onLoad={handleModelLoad}
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
      </InteractiveModelViewer>

      {/* ─ Floating Exploded-View Callout Cards ──────────── */}
      {exploded && (
        <div className="pointer-events-none absolute inset-0 z-30" aria-live="polite">
          {EXPLODED_PARTS.map((part, i) => (
            <div
              key={part.label}
              className="pointer-events-auto absolute"
              style={{
                top: part.calloutAnchor.top,
                left: part.calloutAnchor.left,
                transform: "translate(-50%, -50%)",
                animation: `calloutFadeIn 0.35s ${i * 0.1}s both ease-out`
              }}
            >
              {/* Connector dot */}
              <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-imperial-gold shadow-gold-glow" />

              {/* Card */}
              <div className="ml-3 max-w-[11rem] rounded-xl border border-imperial-gold/40 bg-obsidian/85 px-3 py-2.5 shadow-gold-glow backdrop-blur-lg">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-sm" aria-hidden="true">{part.icon}</span>
                  <span className="text-xs font-semibold tracking-wide text-imperial-gold">
                    {part.label}
                  </span>
                </div>
                <p className="text-[0.65rem] leading-[1.35] text-parchment/80">
                  {part.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─ Top Bar: Exhibit Title + Persona Chips ────────── */}
      <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3 z-20">
        <div className="max-w-[70%] rounded-xl2 border border-imperial-gold/30 bg-obsidian/80 px-4 py-3 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-imperial-gold">3D inspection</p>
          <h1 className="font-display text-lg">{exhibit?.name || "Shotel Curved Sword"}</h1>
          <p className="mt-1 text-xs text-parchment/65">
            {exploded
              ? "Exploded view — sub-components separated"
              : autoRotate
              ? "Drag or pinch to inspect"
              : "Manual orbit and pinch zoom enabled"}
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

      {/* ─ Bottom Drawer: Hotspot Details + Action Buttons ─ */}
      <aside className="absolute bottom-0 left-0 right-0 z-20 rounded-t-xl2 border-t border-imperial-gold/30 bg-obsidian-raised/95 p-4 shadow-gold-glow backdrop-blur">
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
          {/* ── Exploded-View / Assemble Toggle ──────────── */}
          <button
            id="exploded-view-toggle"
            type="button"
            aria-pressed={exploded}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-all active:scale-95 ${
              exploded
                ? "border-imperial-gold bg-imperial-gold/15 text-imperial-gold shadow-gold-glow"
                : "border-adwa-emerald bg-transparent text-adwa-emerald"
            }`}
            onClick={toggleExploded}
          >
            {/* Layer/Split SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${exploded ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              {exploded ? (
                /* Assemble icon — layers collapsing */
                <>
                  <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                  <path d="m2 17 10 5 10-5" />
                  <path d="m2 12 10 5 10-5" />
                </>
              ) : (
                /* Exploded icon — layers expanding */
                <>
                  <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                  <path d="m2 17 10 5 10-5" opacity="0.5" />
                  <path d="m2 12 10 5 10-5" opacity="0.7" />
                </>
              )}
            </svg>
            {exploded ? "Assemble" : "Exploded View"}
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