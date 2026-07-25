import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { PERSONAS } from "../../personas/personas";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";

/* ────────────────────────────────────────────────────────────
   Constants & Metadata
   ──────────────────────────────────────────────────────────── */

const TABS = [
  { id: "material", label: "Material", icon: "◆" },
  { id: "craft", label: "Craft & Method", icon: "✦" },
  { id: "usage", label: "Usage & Significance", icon: "◈" }
];

/**
 * 4 Specific Pins for Empress Taytu Monument (FEAT-019)
 */
const TAYTU_HOTSPOTS = [
  {
    id: "albaso_braids",
    title: "Royal Braided Hairstyle (Albaso)",
    tag: "Craft & Tradition",
    tab: "craft",
    position: [0, 1.75, 0.1],
    cameraTarget: [0, 1.75, 0.1],
    cameraPos: [0, 1.85, 1.2],
    description:
      "Traditional Ethiopian royal braiding symbolizing dignity and leadership."
  },
  {
    id: "kaba_dress",
    title: "Ceremonial Kaba & Dress",
    tag: "Material & Craft",
    tab: "material",
    position: [0, 1.15, 0.25],
    cameraTarget: [0, 1.15, 0.25],
    cameraPos: [0, 1.25, 1.5],
    description:
      "Heavy royal cloak with chest clasp and detailed belt medallion."
  },
  {
    id: "royal_sword",
    title: "Sheathed Royal Sword",
    tag: "Military Command",
    tab: "usage",
    position: [-0.35, 0.75, 0.1],
    cameraTarget: [-0.35, 0.75, 0.1],
    cameraPos: [-0.8, 0.85, 1.3],
    description:
      "Represents Empress Taytu's personal military command and troop deployment at Adwa."
  },
  {
    id: "command_gesture",
    title: "Strategic Command Gesture",
    tag: "Strategic Mastermind",
    tab: "usage",
    position: [0.55, 1.05, 0.35],
    cameraTarget: [0.55, 1.05, 0.35],
    cameraPos: [0.9, 1.15, 1.4],
    description:
      "Outstretched pointing hand highlighting her strategic mastermind during the Battle of Adwa."
  }
];

/** Default camera pose */
const DEFAULT_CAMERA_POS = [0, 1.2, 3.2];
const DEFAULT_CAMERA_TARGET = [0, 0.6, 0];

/**
 * Exploded-view part definitions for Shotel Sword.
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
   3D Canvas Subcomponents (R3F)
   ──────────────────────────────────────────────────────────── */

/** React Error Boundary for Three.js Canvas */
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[InspectionHub Canvas Error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/** Suspense Fallback Loader */
function CanvasLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center rounded-xl border border-imperial-gold/40 bg-obsidian-raised/90 p-4 shadow-gold-glow backdrop-blur text-center text-parchment min-w-[200px]">
        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-imperial-gold border-t-transparent" />
        <p className="font-display text-xs tracking-wider text-imperial-gold">Loading 3D Statue Mesh…</p>
      </div>
    </Html>
  );
}

/** Taytu Monument 3D Mesh Loader using Drei useGLTF */
function TaytuModelMesh({ glbUrl, selectedHotspotId, onSelectHotspot, isTaytu }) {
  const { scene } = useGLTF(glbUrl || "/models/taytu_statue.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group position={[0, -0.6, 0]}>
      <primitive object={clonedScene} scale={[1, 1, 1]} />
      {isTaytu &&
        TAYTU_HOTSPOTS.map((hotspot) => {
          const isSelected = selectedHotspotId === hotspot.id;
          return (
            <group key={hotspot.id} position={hotspot.position}>
              <Html position={[0, 0, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
                <button
                  type="button"
                  aria-label={hotspot.title}
                  className={`group relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isSelected
                      ? "h-9 w-9 bg-imperial-gold ring-4 ring-imperial-gold/40 shadow-gold-glow scale-110"
                      : "h-7 w-7 bg-obsidian/85 border-2 border-imperial-gold/80 hover:scale-125 hover:bg-imperial-gold hover:text-obsidian"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHotspot(hotspot);
                  }}
                >
                  <span className={`text-xs font-bold ${isSelected ? "text-obsidian" : "text-imperial-gold group-hover:text-obsidian"}`}>
                    ✦
                  </span>
                  <span className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-md bg-obsidian-raised px-2.5 py-1 text-[0.7rem] text-parchment shadow-md border border-imperial-gold/30 group-hover:block">
                    {hotspot.title}
                  </span>
                </button>
              </Html>
            </group>
          );
        })}
    </group>
  );
}

/** Smooth Camera Controller */
function CameraController({ controlsRef, focusTarget, focusPos }) {
  useFrame(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (focusTarget && focusPos) {
      controls.target.lerp(
        { x: focusTarget[0], y: focusTarget[1] - 0.6, z: focusTarget[2] },
        0.08
      );
      controls.object.position.lerp(
        { x: focusPos[0], y: focusPos[1], z: focusPos[2] },
        0.08
      );
      controls.update();
    }
  });
  return null;
}

/* ────────────────────────────────────────────────────────────
   Helper Functions for ModelViewer Fallback
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
    /* swallow */
  }
  return null;
}

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
   Main Component: InspectionHub
   ──────────────────────────────────────────────────────────── */

/** Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub */
export default function InspectionHub({ navigate }) {
  /* ── Store selectors ───────────────────────────────────── */
  const exhibit = useExhibitStore((state) => state.activeExhibit);
  const isLoading = useExhibitStore((state) => state.isLoading);
  const scanError = useExhibitStore((state) => state.scanError);
  const loadExhibit = useExhibitStore((state) => state.loadExhibit);
  const persona = useSessionStore((state) => state.persona);
  const setPersona = useSessionStore((state) => state.setPersona);
  const markVisited = useSessionStore((state) => state.markVisited);

  /* ── Local state ───────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState("material");
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [glbError, setGlbError] = useState(false);

  /* Overhaul UI States */
  const [textQuery, setTextQuery] = useState("");
  const [showTranscriptHUD, setShowTranscriptHUD] = useState(true);
  const [hotspotAIExplanation, setHotspotAIExplanation] = useState("");
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  /* Camera focus state for R3F Canvas */
  const [focusTarget, setFocusTarget] = useState(DEFAULT_CAMERA_TARGET);
  const [focusPos, setFocusPos] = useState(DEFAULT_CAMERA_POS);

  /* ── Voice Guide Hook ──────────────────────────────────── */
  const {
    status,
    captions,
    isPlaying,
    startListening,
    stopListeningAndSend,
    sendTextQuestion,
    speakText,
    stopAudio
  } = useVoiceGuide(exhibit);

  /* ── Refs ───────────────────────────────────────────────── */
  const controlsRef = useRef(null);
  const modelViewerRef = useRef(null);
  const initialPositionsRef = useRef({});
  const meshNodesRef = useRef({});
  const tweensRef = useRef([]);

  /* ── Derived values ────────────────────────────────────── */
  const exhibitId = exhibit?.exhibit_id || "taytu_statue";
  const isTaytu = exhibitId === "taytu_statue" || exhibitId === "menelik_taytu_statue";
  const isShotel = exhibitId === "shotel_sword";
  const isInstrument = exhibit?.category === "instrument";

  const hotspots = useMemo(() => {
    if (isTaytu) return TAYTU_HOTSPOTS;
    return normaliseHotspots(exhibit?.hotspot_json);
  }, [exhibit?.hotspot_json, isTaytu]);

  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId);
  const modelSource = exhibit?.glb_url || "/models/taytu_statue.glb";
  const posterPath = `/models/posters/${exhibitId}_poster.webp`;

  const exhibitTrivia =
    exhibit?.persona_scripts?.usage ||
    exhibit?.persona_scripts?.craft ||
    "Empress Taytu Betul was key strategist of the Ethiopian forces during the Battle of Adwa.";

  const activeTabText =
    selectedHotspot?.description ||
    selectedHotspot?.content?.[activeTab] ||
    selectedHotspot?.[activeTab] ||
    exhibit?.persona_scripts?.[activeTab] ||
    "Select a glowing hotspot on the monument to inspect historical details.";

  /* Ensure Taytu exhibit loads if activeExhibit is null */
  useEffect(() => {
    if (!exhibit && !isLoading) {
      loadExhibit("taytu_statue");
    }
  }, [exhibit, isLoading, loadExhibit]);

  /* ── Model load handler for model-viewer fallback ──────── */
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

  /* ── Exploded-view GSAP animation for Shotel ──────────── */
  useEffect(() => {
    if (!modelReady || !isShotel) return;

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
          if (mvEl) {
            try {
              mvEl.requestUpdate?.();
            } catch {
              /* noop */
            }
            mvEl.dispatchEvent?.(new CustomEvent("camera-change"));
          }
        }
      });
      tweensRef.current.push(tween);
    }

    if (exploded) setAutoRotate(false);

    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
    };
  }, [exploded, modelReady, isShotel]);

  /* ── Interaction handlers ──────────────────────────────── */

  /**
   * Requirement 3: Interactive Hotspot AI Explainer & Read-Aloud
   */
  async function chooseHotspot(hotspot) {
    setSelectedHotspotId(hotspot.id);
    setActiveTab(hotspot.tab || "material");
    setAutoRotate(false);

    if (hotspot.cameraTarget && hotspot.cameraPos) {
      setFocusTarget(hotspot.cameraTarget);
      setFocusPos(hotspot.cameraPos);
    }

    // Trigger AI Hotspot Explainer & Read-Aloud
    setIsGeneratingExplanation(true);
    setHotspotAIExplanation("Generating deep AI historical analysis…");

    const prompt = `Explain the historical and strategic significance of ${hotspot.title} (${hotspot.description}) on the Empress Taytu Monument in 2 concise sentences.`;
    const explanationText = await sendTextQuestion(prompt);
    const finalExplanation = explanationText || hotspot.description;
    setHotspotAIExplanation(finalExplanation);
    setIsGeneratingExplanation(false);
  }

  function handleResetCamera() {
    setSelectedHotspotId(null);
    setFocusTarget(DEFAULT_CAMERA_TARGET);
    setFocusPos(DEFAULT_CAMERA_POS);
    setAutoRotate(true);
    setHotspotAIExplanation("");
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
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

  /**
   * Requirement 1 & 4: Submit Handlers for Text & Voice
   */
  const handleTextFormSubmit = async (e) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    const query = textQuery;
    setTextQuery("");
    await sendTextQuestion(query);
  };

  const handleMicToggle = async () => {
    if (isMicActive) {
      setIsMicActive(false);
      await stopListeningAndSend();
    } else {
      setIsMicActive(true);
      await startListening();
    }
  };

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

  /* Fallback Card when GLB fails to render */
  const canvasFallbackUI = (
    <div className="grid h-full w-full place-items-center bg-obsidian bg-adwa-geometry p-6 text-center text-parchment">
      <div className="max-w-md rounded-2xl border border-imperial-gold/40 bg-obsidian-raised/90 p-6 shadow-gold-glow">
        <span className="mb-2 inline-block text-3xl">🗿</span>
        <h3 className="font-display text-lg text-imperial-gold mb-2">
          {exhibit?.name || "Empress Taytu Monument"}
        </h3>
        <p className="text-xs text-parchment/80 mb-4">
          3D WebGL preview fallback active. You can still inspect historical hotspots and query the AI voice guide below.
        </p>
        <button
          type="button"
          className="adwa-btn-secondary text-xs"
          onClick={() => setGlbError(false)}
        >
          Retry 3D Render
        </button>
      </div>
    </div>
  );

  /* ── Main render ───────────────────────────────────────── */
  return (
    <section className="relative min-h-screen overflow-hidden bg-obsidian text-parchment">
      {/* ─ 3D Canvas / Model Container ──────────────────── */}
      <div className="relative h-[72vh] w-full">
        {!glbError ? (
          <CanvasErrorBoundary fallback={canvasFallbackUI}>
            <Canvas
              shadows
              camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
              className="h-full w-full bg-adwa-geometry"
              onPointerDown={handleModelInteraction}
              onError={() => setGlbError(true)}
            >
              {/* Carved stone highlighting lights */}
              <ambientLight intensity={0.7} />
              <directionalLight
                position={[5, 8, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight position={[-5, -2, -3]} intensity={0.4} color="#ffd700" />
              <hemisphereLight intensity={0.4} groundColor="#1a0f00" />

              {/* Suspense Wrapper */}
              <Suspense fallback={<CanvasLoader />}>
                <TaytuModelMesh
                  glbUrl={modelSource}
                  selectedHotspotId={selectedHotspotId}
                  onSelectHotspot={chooseHotspot}
                  isTaytu={isTaytu}
                />
              </Suspense>

              {/* Orbit Controls with Smooth Damping */}
              <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
                minDistance={1.2}
                maxDistance={6.0}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2 + 0.1}
                target={DEFAULT_CAMERA_TARGET}
              />

              {/* Camera lerp controller */}
              <CameraController
                controlsRef={controlsRef}
                focusTarget={focusTarget}
                focusPos={focusPos}
              />
            </Canvas>
          </CanvasErrorBoundary>
        ) : (
          canvasFallbackUI
        )}
      </div>

      {/* ─ Exploded-View ModelViewer Fallback for Shotel Sword ── */}
      {isShotel && (
        <InteractiveModelViewer
          ref={modelViewerRef}
          modelPath={modelSource}
          posterPath={posterPath}
          altText={exhibit?.name || "Shotel curved sword"}
          exhibitTrivia={exhibitTrivia}
          containerClassName="hidden"
          className="h-full w-full"
          autoRotate={autoRotate}
          cameraControls
          onLoad={handleModelLoad}
        />
      )}

      {/* ─ Floating Exploded-View Callout Cards (Shotel only) ─ */}
      {exploded && isShotel && (
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
              <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-imperial-gold shadow-gold-glow" />
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

      {/* ─ Top Bar: Title, Category & Persona Selector ─── */}
      <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3 z-20">
        <div className="max-w-[70%] rounded-xl2 border border-imperial-gold/30 bg-obsidian/80 px-4 py-3 backdrop-blur shadow-md">
          <div className="flex items-center gap-2">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-imperial-gold font-semibold">
              3D Inspection
            </p>
            <span className="rounded-full bg-imperial-gold/20 px-2 py-0.5 text-[0.65rem] text-imperial-gold border border-imperial-gold/30">
              {exhibit?.category || "Monument"}
            </span>
          </div>
          <h1 className="font-display text-base sm:text-lg text-parchment">
            {exhibit?.name || "Empress Taytu Monument"}
          </h1>
          <p className="mt-0.5 text-[0.7rem] text-parchment/65">
            {autoRotate ? "Orbiting — click pins to inspect regalia" : "Interactive camera active"}
          </p>
        </div>

        <div className="flex rounded-xl2 border border-imperial-gold/30 bg-obsidian/80 p-1 backdrop-blur shadow-md">
          {PERSONAS.map((personaOption) => (
            <button
              key={personaOption.id}
              type="button"
              className={`grid h-9 w-9 place-items-center rounded-lg text-base transition ${
                persona === personaOption.id
                  ? "bg-imperial-gold text-obsidian shadow-gold-glow font-bold"
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

      {/* ─ Requirement 2: Story Transcript HUD Overlay ─ */}
      <div className="absolute left-4 top-24 right-4 z-20 max-w-lg transition-all duration-300">
        <div className="rounded-xl border border-imperial-gold/30 bg-black/40 px-3.5 py-2.5 shadow-lg backdrop-blur-md text-parchment">
          <div className="flex items-center justify-between gap-2 border-b border-imperial-gold/20 pb-1 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">📜</span>
              <span className="text-xs font-bold uppercase tracking-wider text-imperial-gold">
                Story Transcript
              </span>
              <span className="text-[10px] text-imperial-gold/80 bg-imperial-gold/15 px-2 py-0.5 rounded-full border border-imperial-gold/30 font-semibold">
                {persona.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTranscriptHUD((prev) => !prev)}
              className="text-xs text-imperial-gold/80 hover:text-imperial-gold flex items-center gap-1 font-semibold transition-colors"
            >
              {showTranscriptHUD ? "Hide ▲" : "Show ▼"}
            </button>
          </div>

          {showTranscriptHUD && (
            <div className="animate-fadeIn">
              <p className="text-xs leading-relaxed text-parchment/90 italic">
                "{exhibit?.persona_scripts?.[persona] || exhibit?.persona_scripts?.[activeTab] || exhibitTrivia}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─ Requirement 3: Hotspot AI Explainer & Read-Aloud Card ─ */}
      {selectedHotspot && (
        <div className="absolute right-4 bottom-56 left-4 z-30 max-w-md mx-auto animate-fadeIn">
          <div className="rounded-2xl border border-imperial-gold/50 bg-black/60 p-4 shadow-gold-glow backdrop-blur-xl text-parchment">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-imperial-gold text-lg">✦</span>
                <h3 className="font-display text-sm font-bold text-imperial-gold">
                  {selectedHotspot.title}
                </h3>
              </div>

              {/* Equalizer & Voice Control */}
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-4" title="Audio streaming active">
                    <span className="w-1 bg-imperial-gold animate-bounce rounded-full h-3" />
                    <span className="w-1 bg-imperial-gold animate-bounce delay-100 rounded-full h-4" />
                    <span className="w-1 bg-imperial-gold animate-bounce delay-200 rounded-full h-2" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={isPlaying ? stopAudio : () => speakText(hotspotAIExplanation || selectedHotspot.description)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-imperial-gold/40 bg-imperial-gold/20 text-imperial-gold hover:bg-imperial-gold hover:text-obsidian transition-colors font-semibold"
                >
                  {isPlaying ? "⏸️ Pause Voice" : "🔊 Replay Audio"}
                </button>
              </div>
            </div>

            <p className="text-xs text-parchment/75 mb-2 leading-relaxed">
              {selectedHotspot.description}
            </p>

            {isGeneratingExplanation ? (
              <div className="flex items-center gap-2 text-xs text-imperial-gold animate-pulse pt-2 border-t border-parchment/10">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-imperial-gold border-t-transparent" />
                <span>Consulting Groq AI for deep coordinate analysis…</span>
              </div>
            ) : hotspotAIExplanation ? (
              <div className="pt-2 border-t border-imperial-gold/20 text-xs leading-relaxed text-parchment font-medium bg-imperial-gold/10 p-2.5 rounded-xl border border-imperial-gold/30">
                <span className="font-bold text-imperial-gold block mb-0.5">💡 AI Hotspot Explainer:</span>
                {hotspotAIExplanation}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─ Bottom Drawer: Hotspot Inspection & Actions ─── */}
      <aside className="absolute bottom-0 left-0 right-0 z-20 rounded-t-xl2 border-t border-imperial-gold/30 bg-obsidian-raised/95 p-4 shadow-gold-glow backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.15em] text-imperial-gold font-semibold">
              {selectedHotspot?.tag || "Hotspot Details"}
            </p>
            <h2 className="font-display text-base text-parchment">
              {selectedHotspot?.title || selectedHotspot?.label || "Empress Taytu Betul Monument"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-imperial-gold/50 bg-obsidian/80 px-3 py-1.5 text-xs text-imperial-gold shadow-sm backdrop-blur hover:bg-imperial-gold hover:text-obsidian transition-colors"
              onClick={handleResetCamera}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.035 8.035 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Camera View
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div
          className="mb-3 flex gap-1 overflow-x-auto border-b border-parchment/15"
          role="tablist"
          aria-label="Artifact detail tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`shrink-0 border-b-2 px-3 py-1.5 text-xs sm:text-sm transition ${
                activeTab === tab.id
                  ? "border-imperial-gold text-imperial-gold font-semibold"
                  : "border-transparent text-parchment/65 hover:text-parchment"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span aria-hidden="true" className="mr-1.5">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description Copy */}
        <p className="min-h-10 text-xs sm:text-sm leading-6 text-parchment/85">
          {activeTabText}
        </p>

        {/* ─ Requirement 1 & 4: Explicit Text Submit & Voice Input Bar ─ */}
        <form onSubmit={handleTextFormSubmit} className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleMicToggle}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
              isMicActive || status === "listening"
                ? "border-adwa-crimson bg-adwa-crimson text-white animate-pulse shadow-lg"
                : "border-imperial-gold/40 bg-obsidian/80 text-imperial-gold hover:bg-imperial-gold/20"
            }`}
            aria-label="Toggle voice input"
            title={isMicActive ? "Stop Listening & Send" : "Speak to Voice Guide"}
          >
            🎤
          </button>

          <input
            type="text"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            placeholder={
              status === "listening"
                ? "Listening to your voice query…"
                : status === "thinking"
                ? "Thinking…"
                : "Ask AI persona about Empress Taytu…"
            }
            className="flex-1 rounded-xl border border-imperial-gold/30 bg-obsidian/80 px-3.5 py-2 text-xs text-parchment placeholder-parchment/50 focus:border-imperial-gold focus:outline-none backdrop-blur"
          />

          <button
            type="submit"
            disabled={!textQuery.trim() || status === "thinking"}
            className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl border border-imperial-gold bg-imperial-gold text-obsidian font-bold text-xs shadow-gold-glow hover:bg-imperial-gold-light disabled:opacity-40 disabled:pointer-events-none transition-all"
            aria-label="Send question"
          >
            <span>Send</span>
            <span className="text-sm">➔</span>
          </button>
        </form>

        {captions && (
          <div className="mt-2 text-xs text-imperial-gold bg-imperial-gold/10 p-2 rounded-lg border border-imperial-gold/30 animate-fadeIn flex items-center justify-between">
            <span>{captions}</span>
            {status === "thinking" && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-imperial-gold border-t-transparent" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isShotel && (
            <button
              id="exploded-view-toggle"
              type="button"
              aria-pressed={exploded}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                exploded
                  ? "border-imperial-gold bg-imperial-gold/15 text-imperial-gold shadow-gold-glow"
                  : "border-adwa-emerald bg-transparent text-adwa-emerald"
              }`}
              onClick={toggleExploded}
            >
              {exploded ? "Assemble" : "Exploded View"}
            </button>
          )}

          {isInstrument && (
            <button type="button" className="adwa-btn-secondary flex-1" onClick={openSensoryMode}>
              Sensory mode
            </button>
          )}

          <button type="button" className="adwa-btn-primary flex-1" onClick={openVoiceGuide}>
            Full Voice Guide Overlay 🎙️
          </button>
        </div>
      </aside>
    </section>
  );
}