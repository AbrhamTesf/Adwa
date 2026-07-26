import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Vector3 } from "three";
import gsap from "gsap";
import { PERSONAS } from "../../personas/personas";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import InteractiveModelViewer from "../ui/InteractiveModelViewer.jsx";
import { useTranslation } from "../../lib/i18n";
import { getExhibitText } from "../../data/exhibitsData";

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

/** Individual 3D Hotspot Pin with Dot-Product Camera Occlusion */
function HotspotPin({ hotspot, isSelected, onSelectHotspot }) {
  const [isVisible, setIsVisible] = useState(true);
  const tempPos = useMemo(() => new Vector3(...hotspot.position), [hotspot.position]);
  const tempCamDir = useMemo(() => new Vector3(), []);
  const tempHotspotDir = useMemo(() => new Vector3(), []);

  useFrame(({ camera }) => {
    camera.getWorldDirection(tempCamDir);
    tempHotspotDir.copy(tempPos).sub(camera.position).normalize();
    const dot = tempCamDir.dot(tempHotspotDir);
    setIsVisible(dot > 0.1);
  });

  return (
    <group position={hotspot.position}>
      <Html position={[0, 0, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div className={`adwa-pin group ${isVisible ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-75"} transition-all duration-300`}>
          <button
            type="button"
            aria-label={hotspot.title}
            className={`adwa-pin__dot ${
              isSelected
                ? "adwa-pin__dot--active bg-imperial-gold ring-4 ring-imperial-gold/50 shadow-gold-glow scale-125"
                : "bg-imperial-gold/90 hover:scale-125"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectHotspot(hotspot);
            }}
          >
            <span className="sr-only">{hotspot.title}</span>
          </button>
          <div className={`adwa-pin__badge ${isSelected ? "adwa-pin__badge--visible" : "group-hover:adwa-pin__badge--visible"}`}>
            <span className="text-[9px] uppercase font-bold text-imperial-gold block tracking-wider leading-none mb-0.5">✦ {hotspot.tag}</span>
            <span className="text-xs font-semibold text-slate-100 block leading-tight">{hotspot.title}</span>
          </div>
        </div>
      </Html>
    </group>
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
            <HotspotPin
              key={hotspot.id}
              hotspot={hotspot}
              isSelected={isSelected}
              onSelectHotspot={onSelectHotspot}
            />
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
  const { t, language } = useTranslation();
  /* ── Store selectors ───────────────────────────────────── */
  const exhibit = useExhibitStore((state) => state.activeExhibit);
  const isLoading = useExhibitStore((state) => state.isLoading);
  const scanError = useExhibitStore((state) => state.scanError);
  const loadExhibit = useExhibitStore((state) => state.loadExhibit);
  const persona = useSessionStore((state) => state.persona);
  const setPersona = useSessionStore((state) => state.setPersona);
  const markVisited = useSessionStore((state) => state.markVisited);
  const advanceStop = useSessionStore((state) => state.advanceStop);
  const currentStopIndex = useSessionStore((state) => state.currentStopIndex);
  const itinerary = useSessionStore((state) => state.itinerary);

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

  const TAYTU_INITIAL_NARRATION =
    "Empress Taytu Betul was the brilliant diplomat, strategist, and co-ruler of Ethiopia who played a pivotal role in the 1896 Battle of Adwa. Her monument showcases her iconic Albaso braided hairstyle—a traditional crown of braided rows representing royal dignity and leadership—and her heavy ceremonial royal Kaba cloak and dress, worn during imperial court and military council.";

  const exhibitTrivia = isTaytu
    ? TAYTU_INITIAL_NARRATION
    : exhibit?.persona_scripts?.usage ||
      exhibit?.persona_scripts?.craft ||
      "Explore the historic artifact from the Battle of Adwa.";

  const activeTabText =
    selectedHotspot?.description ||
    selectedHotspot?.content?.[activeTab] ||
    selectedHotspot?.[activeTab] ||
    exhibit?.persona_scripts?.[activeTab] ||
    exhibitTrivia;

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
    setHotspotAIExplanation("Consulting AI archives for spot analysis…");

    const prompt = `Explain the historical significance of ${hotspot.title} (${hotspot.description}) on Empress Taytu Monument in 2 short sentences.`;
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

  const handleFinishInspection = () => {
    if (exhibitId) {
      markVisited(exhibitId);
    }
    advanceStop();
    if (itinerary.length > 0 && currentStopIndex >= itinerary.length - 1) {
      navigate?.("memoryDeck");
    } else if (itinerary.length > 0) {
      navigate?.("navigation");
    } else {
      navigate?.("scanner");
    }
  };

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
          <p className="font-display text-lg">{t("inspection.preparing", "Preparing the artifact…")}</p>
        </div>
      </section>
    );
  }

  /* ── Error state ───────────────────────────────────────── */
  if (scanError) {
    return (
      <section className="grid min-h-screen place-items-center bg-obsidian bg-adwa-geometry px-6 text-center text-parchment">
        <div className="max-w-sm rounded-xl2 border border-adwa-crimson/60 bg-obsidian-raised p-6">
          <p className="mb-2 font-display text-xl text-imperial-gold">{t("inspection.unavailable", "Artifact unavailable")}</p>
          <p className="mb-5 text-sm text-parchment/75">{scanError}</p>
          <button className="adwa-btn-primary" onClick={() => navigate?.("scanner")}>
            {t("inspection.returnToScanner", "Return to scanner")}
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
          {getExhibitText(exhibitId, "title", language) || exhibit?.name || "Empress Taytu Monument"}
        </h3>
        <p className="text-xs text-parchment/80 mb-4">
          {t("inspection.webglFallback", "3D WebGL preview fallback active. You can still inspect historical hotspots and query the AI voice guide below.")}
        </p>
        <button
          type="button"
          className="adwa-btn-secondary text-xs"
          onClick={() => setGlbError(false)}
        >
          {t("inspection.retry3D", "Retry 3D Render")}
        </button>
      </div>
    </div>
  );

  const isAudioActive = isPlaying || status === "speaking";

  /* ── Main render ───────────────────────────────────────── */
  return (
    <section className="relative min-h-screen overflow-hidden bg-obsidian text-parchment">
      {/* ─ 3D Canvas Container ──────────────────── */}
      <div className="absolute inset-0 z-0">
        {!glbError ? (
          <CanvasErrorBoundary fallback={canvasFallbackUI}>
            <Canvas
              shadows
              camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
              className="h-full w-full bg-adwa-geometry"
              onPointerDown={handleModelInteraction}
              onError={() => setGlbError(true)}
            >
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

              <Suspense fallback={<CanvasLoader />}>
                <TaytuModelMesh
                  glbUrl={modelSource}
                  selectedHotspotId={selectedHotspotId}
                  onSelectHotspot={chooseHotspot}
                  isTaytu={isTaytu}
                />
              </Suspense>

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

      {/* ─ Exploded-View ModelViewer Fallback for Shotel ── */}
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

      {/* ─ Top Overlay Header Bar ─ z-50 ─── */}
      <header className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-3.5 py-2 text-xs text-parchment shadow-md backdrop-blur hover:border-imperial-gold/50 transition-all font-semibold"
            onClick={() => navigate?.(itinerary.length > 0 ? "navigation" : "scanner")}
          >
            <span>←</span>
            <span>{itinerary.length > 0 ? t("inspection.backToTourMap", "Back to Map") : t("inspection.backToScanner", "Back to Scanner")}</span>
          </button>

          {/* Universal Stop Narration Tiny Button */}
          {isAudioActive && (
            <button
              type="button"
              onClick={stopAudio}
              className="flex items-center gap-2 rounded-full border border-adwa-crimson/60 bg-slate-950/90 px-3.5 py-1.5 text-xs text-white shadow-lg backdrop-blur hover:bg-adwa-crimson transition-all font-semibold animate-pulse"
              title="Stop active AI voice narration"
            >
              <div className="flex items-end gap-0.5 h-3">
                <span className="waveform-bar waveform-bar-1 h-2" />
                <span className="waveform-bar waveform-bar-2 h-3" />
                <span className="waveform-bar waveform-bar-3 h-2" />
              </div>
              <span>{t("inspection.playingAudio", "AI Voice Playing")}</span>
              <span className="rounded bg-adwa-crimson px-2 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm">
                ⏹ Stop
              </span>
            </button>
          )}

          <button
            type="button"
            className="adwa-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-gold-glow"
            onClick={handleFinishInspection}
          >
            <span>{t("inspection.finishInspection", "Finish Inspection")}</span>
            <span className="text-sm">✓</span>
          </button>
        </div>

        {/* Title, Category & Persona Selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="max-w-[65%] glass-card rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-imperial-gold font-semibold">
                {t("inspection.title", "3D Inspection")}
              </p>
              <span className="rounded-full bg-imperial-gold/20 px-2 py-0.5 text-[0.65rem] text-imperial-gold border border-imperial-gold/30">
                {getExhibitText(exhibitId, "category", language) || exhibit?.category || "Monument"}
              </span>
            </div>
            <h1 className="font-display text-sm sm:text-base text-slate-100 truncate">
              {getExhibitText(exhibitId, "title", language) || exhibit?.name || "Empress Taytu Monument"}
            </h1>
          </div>

          <div className="flex glass-card rounded-xl p-1">
            {PERSONAS.map((personaOption) => (
              <button
                key={personaOption.id}
                type="button"
                className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                  persona === personaOption.id
                    ? "bg-imperial-gold text-obsidian shadow-gold-glow font-bold scale-105"
                    : "text-parchment hover:bg-white/10"
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
      </header>

      {/* ─ Transparent Glass AI Narrative Overlay ─ z-30 ─── */}
      <div className="pointer-events-none absolute inset-x-4 bottom-24 z-30 max-w-xl mx-auto">
        {selectedHotspot ? (
          <div className="pointer-events-auto rounded-2xl bg-slate-950/60 backdrop-blur-md border border-imperial-gold/40 p-4 shadow-2xl transition-all animate-fadeIn">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-imperial-gold">
                ✦ {t(`inspection.hotspots.${selectedHotspot.id}.title`, selectedHotspot.title)}
              </span>
              <button
                type="button"
                onClick={handleResetCamera}
                className="text-[11px] text-slate-300 hover:text-imperial-gold transition-colors font-semibold px-2 py-0.5 rounded-full bg-white/10"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mb-2">
              {hotspotAIExplanation || t(`inspection.hotspots.${selectedHotspot.id}.description`, selectedHotspot.description)}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
              <span className="text-imperial-gold font-medium">
                {isGeneratingExplanation ? "Consulting AI…" : "3D Focus View Active"}
              </span>
              <button
                type="button"
                onClick={isAudioActive ? stopAudio : () => speakText(hotspotAIExplanation || selectedHotspot.description)}
                className="px-3 py-1 rounded-full border border-imperial-gold/40 bg-imperial-gold/20 text-imperial-gold font-semibold hover:bg-imperial-gold hover:text-obsidian transition-all"
              >
                {isAudioActive ? "⏹ Stop Audio" : "🔊 Listen"}
              </button>
            </div>
          </div>
        ) : showTranscriptHUD ? (
          <div className="pointer-events-auto rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/10 p-4 shadow-2xl transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs">📜</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-imperial-gold">
                  {t("inspection.storyTranscript", "AI Narrative Stream")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(captions || exhibitTrivia)}
                  className="text-[11px] px-2.5 py-0.5 rounded-full border border-imperial-gold/40 bg-imperial-gold/20 text-imperial-gold font-semibold hover:bg-imperial-gold hover:text-obsidian transition-colors"
                >
                  🔊 Listen
                </button>
                <button
                  type="button"
                  onClick={() => setShowTranscriptHUD(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-200 italic max-h-24 overflow-y-auto custom-scrollbar pr-1">
              "{captions || exhibitTrivia}"
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTranscriptHUD(true)}
            className="pointer-events-auto mx-auto block rounded-full border border-imperial-gold/40 bg-slate-950/80 px-4 py-1.5 text-xs text-imperial-gold shadow-lg backdrop-blur hover:bg-imperial-gold hover:text-obsidian transition-all font-semibold"
          >
            📜 Show AI Story Transcript
          </button>
        )}
      </div>

      {/* ─ Sleek Minimal Bottom Controls Bar ─ z-40 ─── */}
      <aside className="absolute bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto pointer-events-auto">
        <div className="glass-card rounded-2xl p-2.5 border border-white/10 shadow-2xl flex flex-wrap items-center gap-2">
          {/* Quick Ask Form */}
          <form onSubmit={handleTextFormSubmit} className="flex flex-1 items-center gap-2 min-w-[220px]">
            <button
              type="button"
              onClick={handleMicToggle}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                isMicActive || status === "listening"
                  ? "border-adwa-crimson bg-adwa-crimson text-white animate-pulse shadow-lg"
                  : "border-white/10 bg-slate-900/80 text-imperial-gold hover:bg-imperial-gold/20"
              }`}
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
                  ? t("voiceGuide.status.listening", "Listening…")
                  : status === "thinking"
                  ? t("voiceGuide.status.thinking", "Thinking…")
                  : t("inspection.askQuestion", "Ask AI persona about Empress Taytu…")
              }
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:border-imperial-gold focus:outline-none"
            />

            <button
              type="submit"
              disabled={!textQuery.trim() || status === "thinking"}
              className="flex h-9 px-3 items-center justify-center rounded-xl border border-imperial-gold bg-imperial-gold text-obsidian font-bold text-xs shadow-gold-glow hover:bg-imperial-gold-light disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              ➔
            </button>
          </form>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-imperial-gold hover:border-imperial-gold/50 transition-all font-semibold"
              onClick={handleResetCamera}
              title="Reset 3D camera"
            >
              ↺ Reset
            </button>

            {isShotel && (
              <button
                type="button"
                className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  exploded
                    ? "border-imperial-gold bg-imperial-gold/20 text-imperial-gold"
                    : "border-white/10 bg-slate-900/90 text-slate-200"
                }`}
                onClick={toggleExploded}
              >
                {exploded ? "Assemble" : "Exploded"}
              </button>
            )}

            {isInstrument && (
              <button
                type="button"
                className="flex items-center gap-1 rounded-xl border border-adwa-emerald/50 bg-adwa-emerald/15 px-3 py-2 text-xs font-semibold text-adwa-emerald hover:bg-adwa-emerald/30 transition-all"
                onClick={openSensoryMode}
              >
                🎵 Play
              </button>
            )}

            <button
              type="button"
              className="flex items-center gap-1 rounded-xl border border-imperial-gold/40 bg-imperial-gold/15 px-3 py-2 text-xs font-semibold text-imperial-gold hover:bg-imperial-gold hover:text-obsidian transition-all shadow-gold-glow"
              onClick={openVoiceGuide}
            >
              🎙️ Voice Guide
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}