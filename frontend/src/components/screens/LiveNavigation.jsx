import React, { useMemo, useState } from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import Chip from "../ui/Chip.jsx";
import { useSessionStore } from "../../stores/useSessionStore";
import { useTranslation } from "../../lib/i18n";
import { getExhibitText } from "../../data/exhibitsData";

/**
 * Venue floor plan — top-down gallery layout with a single spine corridor.
 * Hackathon MVP: a stylized static plan, not a surveyed venue SVG.
 */
const FLOOR_ROOMS = [
  { exhibitId: "adwa_war_map", label: "Strategy Room", x: 16, y: 24, w: 88, h: 64 },
  { exhibitId: "shotel_sword", label: "Metallurgy Hall", x: 116, y: 24, w: 88, h: 64 },
  { exhibitId: "taytu_statue", label: "Taytu Monument", x: 216, y: 24, w: 88, h: 64 },
  { exhibitId: "meleket", label: "Victory Hall", x: 16, y: 156, w: 88, h: 64 },
  { exhibitId: "embilta", label: "Wind Hall", x: 116, y: 156, w: 88, h: 64 },
  { exhibitId: "negarit_drum", label: "Drum Court", x: 216, y: 156, w: 88, h: 64 }
];

const CORRIDOR = { x: 16, y: 100, w: 288, h: 44 };
const CORRIDOR_Y = CORRIDOR.y + CORRIDOR.h / 2;

const ROOM_CENTERS = FLOOR_ROOMS.reduce((acc, room) => {
  acc[room.exhibitId] = { x: room.x + room.w / 2, y: room.y + room.h / 2 };
  return acc;
}, {});

export default function LiveNavigation({ navigate }) {
  const { t, language } = useTranslation();
  const itinerary = useSessionStore((s) => s.itinerary);
  const currentStopIndex = useSessionStore((s) => s.currentStopIndex);
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);
  const accessibilityOnly = useSessionStore((s) => s.accessibilityOnly);
  const advanceStop = useSessionStore((s) => s.advanceStop);
  const markVisited = useSessionStore((s) => s.markVisited);

  // Stops deferred by "Reroute to avoid crowd" — visual reorder only
  const [deferredIds, setDeferredIds] = useState([]);
  const [checkInNotice, setCheckInNotice] = useState(null);

  const route = useMemo(() => reorderDeferredLast(itinerary, deferredIds), [itinerary, deferredIds]);
  const segments = useMemo(
    () => buildRouteSegments(route, deferredIds, currentStopIndex),
    [route, deferredIds, currentStopIndex]
  );

  const currentStop = route[currentStopIndex];
  const currentStopName = currentStop
    ? getExhibitText(currentStop.exhibit_id, "title", language) || currentStop.name
    : "";
  const nextStop = route[currentStopIndex + 1];
  const nextStopName = nextStop
    ? getExhibitText(nextStop.exhibit_id, "title", language) || nextStop.name
    : "";

  const isLastStop = route.length > 0 && currentStopIndex >= route.length - 1;
  const congestedAhead = findCongestedStopAhead(route, currentStopIndex, deferredIds);
  const position = currentStop ? positionForStop(currentStop, currentStopIndex) : null;

  function handleCheckIn() {
    if (!currentStop) return;
    if (currentStop.exhibit_id) markVisited(currentStop.exhibit_id);
    setCheckInNotice(
      nextStop
        ? t("navigation.checkedIn").replace("{name}", currentStopName).replace("{next}", nextStopName)
        : t("navigation.checkedInFinal").replace("{name}", currentStopName)
    );
    advanceStop();
  }

  function handleReroute() {
    if (!congestedAhead) return;
    const targetId = congestedAhead.stop.exhibit_id;
    if (!targetId || deferredIds.includes(targetId)) return;
    const congestedName = getExhibitText(targetId, "title", language) || congestedAhead.stop.name;
    setDeferredIds((prev) => [...prev, targetId]);
    setCheckInNotice(t("navigation.rerouted").replace("{name}", congestedName));
  }

  const currentDensity = currentStop ? densityForStop(currentStop, deferredIds) : "low";

  if (!route || route.length === 0) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-obsidian bg-adwa-geometry px-5 pb-6 pt-5 text-parchment">
        <header className="flex items-center justify-between">
          <button type="button" className="adwa-btn-secondary px-3 py-1.5 text-xs" onClick={() => navigate("landing")}>
            ← {t("common.back")}
          </button>
          <h1 className="font-display text-lg text-imperial-gold">{t("navigation.title")}</h1>
          <div className="w-12" />
        </header>

        <div className="my-auto text-center adwa-card mx-auto max-w-sm border-imperial-gold/30">
          <span className="text-4xl block mb-2">🗺️</span>
          <h2 className="font-display text-xl text-imperial-gold mb-2">{t("navigation.noRoute")}</h2>
          <p className="text-xs text-parchment/70 mb-5 leading-relaxed">
            {t("navigation.noRouteDesc")}
          </p>
          <PrimaryButton className="w-full" onClick={() => navigate("planner")}>
            {t("navigation.planMyTour")}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-obsidian bg-adwa-geometry px-5 pb-6 pt-5 text-parchment">
      {/* Header */}
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="adwa-btn-secondary px-3 py-1.5 text-xs"
          onClick={() => navigate("planner")}
        >
          ← {t("common.back")}
        </button>
        <div className="text-center">
          <h1 className="font-display text-base text-imperial-gold">{t("navigation.title")}</h1>
          <p className="text-[11px] text-parchment/60">
            {t("navigation.stopOf").replace("{current}", currentStopIndex + 1).replace("{total}", route.length)}
            {accessibilityOnly ? t("navigation.accessibleRoute") : ""}
          </p>
        </div>
        <button type="button" className="adwa-btn-secondary px-3 py-1.5 text-xs" onClick={() => navigate("memoryDeck")}>
          {t("memoryDeck.title")}
        </button>
      </header>

      {/* SVG Map Canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl2 border border-imperial-gold/30 bg-obsidian-raised shadow-gold-glow">
        <svg viewBox="0 0 320 240" className="h-full w-full" aria-label="Museum floor plan">
          <defs>
            <filter id="gold-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Gallery rooms */}
          {FLOOR_ROOMS.map((room) => {
            const isCurrentRoom = currentStop?.exhibit_id === room.exhibitId;
            const isVisitedRoom = visitedExhibitIds.includes(room.exhibitId);
            const roomTitle = getExhibitText(room.exhibitId, "title", language) || room.label;
            const textX = room.x + room.w / 2;
            const textY = room.y + room.h / 2;
            return (
              <g key={room.exhibitId}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="8"
                  filter={isCurrentRoom ? "url(#gold-glow-filter)" : undefined}
                  className={
                    isCurrentRoom
                      ? "fill-slate-900/90 stroke-imperial-gold stroke-[2]"
                      : isVisitedRoom
                        ? "fill-adwa-emerald/15 stroke-adwa-emerald/60 stroke-1"
                        : "fill-slate-950/80 stroke-white/10 stroke-1"
                  }
                />
                {/* Native SVG Pill Badge for Room Label */}
                <rect
                  x={textX - 38}
                  y={textY - 9}
                  width="76"
                  height="18"
                  rx="9"
                  className={
                    isCurrentRoom
                      ? "fill-imperial-gold/25 stroke-imperial-gold/50 stroke-1"
                      : "fill-slate-900/70 stroke-white/10 stroke-1"
                  }
                />
                <text
                  x={textX}
                  y={textY + 3}
                  textAnchor="middle"
                  className={`font-sans text-[8.5px] font-semibold ${
                    isCurrentRoom ? "fill-imperial-gold" : isVisitedRoom ? "fill-adwa-emerald-light" : "fill-slate-300"
                  }`}
                >
                  {roomTitle.length > 13 ? `${roomTitle.substring(0, 11)}…` : roomTitle}
                </text>
              </g>
            );
          })}

          {/* Central spine corridor */}
          <rect
            x={CORRIDOR.x}
            y={CORRIDOR.y}
            width={CORRIDOR.w}
            height={CORRIDOR.h}
            rx="6"
            className="fill-slate-950/90 stroke-white/10 stroke-1"
          />

          {/* Route path segments */}
          {segments.map((seg) => (
            <polyline
              key={`${seg.fromId}-${seg.toId}`}
              points={seg.points}
              fill="none"
              strokeWidth={seg.walked ? "2" : "3"}
              strokeDasharray={seg.walked ? "3,3" : "6,4"}
              className={
                seg.walked
                  ? "stroke-slate-600"
                  : seg.density === "high"
                    ? "stroke-adwa-crimson animate-pulse"
                    : seg.density === "medium"
                      ? "stroke-imperial-gold animate-flow-path"
                      : "stroke-adwa-emerald animate-flow-path"
              }
            />
          ))}

          {accessibilityOnly && <AccessibilityMarkers />}

          {/* Stop Markers */}
          {route.map((stop, idx) => (
            <StopMarker
              key={stop.exhibit_id || idx}
              stop={stop}
              index={idx}
              isCurrent={idx === currentStopIndex}
              isVisited={visitedExhibitIds.includes(stop.exhibit_id)}
            />
          ))}

          {/* User Position Dot */}
          {position && <UserPositionDot x={position.x} y={position.y} />}
        </svg>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-slate-950/85 p-2.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-adwa-emerald" />
            <span className="text-slate-300">{t("navigation.density.clear")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-imperial-gold" />
            <span className="text-parchment/80">{t("navigation.density.busy")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-adwa-crimson" />
            <span className="text-parchment/80">{t("navigation.density.congested")}</span>
          </div>
        </div>
      </div>

      {/* Reroute Alert Banner */}
      {congestedAhead && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-adwa-crimson/40 bg-adwa-crimson/15 p-3 text-xs text-parchment">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              {t("navigation.reroute").replace("{name}", getExhibitText(congestedAhead.stop.exhibit_id, "title", language) || congestedAhead.stop.name)}
            </span>
          </div>
          <button
            type="button"
            className="adwa-btn-secondary py-1 px-2.5 text-[11px] whitespace-nowrap"
            onClick={handleReroute}
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* Notice Banner */}
      {checkInNotice && (
        <div className="mt-2 text-center text-xs font-medium text-adwa-emerald bg-adwa-emerald/10 p-2 rounded-lg border border-adwa-emerald/30">
          {checkInNotice}
        </div>
      )}

      {/* Bottom Sheet */}
      <div className="mt-3 adwa-card border-imperial-gold/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase font-semibold tracking-wider text-imperial-gold">
            {t("navigation.youAreHere")}
          </span>
          <CrowdBadge density={currentDensity} />
        </div>

        <h2 className="font-display text-lg text-parchment mb-1">{currentStopName}</h2>
        <div className="flex items-center gap-2 text-xs text-parchment/70 mb-3">
          <span>{getExhibitText(currentStop.exhibit_id, "category", language) || currentStop.category}</span>
        </div>

        {nextStopName && (
          <p className="text-xs text-parchment/60 mb-3">
            {t("navigation.thenWalkTo")} <span className="text-parchment/90">{nextStopName}</span>
            {accessibilityOnly ? t("navigation.viaElevator") : ""}.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button className="adwa-btn-primary w-full" onClick={() => navigate("scanner")}>
            {t("navigation.scanExhibit")}
          </button>
          {isLastStop ? (
            <button className="adwa-btn-secondary w-full" onClick={() => navigate("memoryDeck")}>
              {t("navigation.finishTour")}
            </button>
          ) : (
            <button className="adwa-btn-secondary w-full" onClick={handleCheckIn}>
              {t("navigation.checkIn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserPositionDot({ x, y }) {
  return (
    <g
      className="transition-transform duration-700 ease-out"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <circle
        r="10"
        className="fill-adwa-emerald/30 animate-ping"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      <circle r="5" className="fill-adwa-emerald stroke-parchment" strokeWidth="1.5" />
    </g>
  );
}

function StopMarker({ stop, index, isCurrent, isVisited }) {
  const { x, y } = positionForStop(stop, index);
  return (
    <g>
      <circle
        cx={x}
        cy={y - 16}
        r="8"
        className={
          isCurrent
            ? "fill-imperial-gold stroke-parchment"
            : isVisited
              ? "fill-adwa-emerald-dark stroke-adwa-emerald"
              : "fill-obsidian-overlay stroke-imperial-gold/60"
        }
        strokeWidth="1.2"
      />
      <text
        x={x}
        y={y - 13}
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        className={isCurrent ? "fill-obsidian" : "fill-parchment/90"}
      >
        {isVisited && !isCurrent ? "✓" : index + 1}
      </text>
    </g>
  );
}

function AccessibilityMarkers() {
  const markers = [
    { x: 30, y: CORRIDOR_Y, glyph: "🛗" },
    { x: 160, y: CORRIDOR_Y - 14, glyph: "♿" },
    { x: 290, y: CORRIDOR_Y, glyph: "🛗" }
  ];
  return (
    <g>
      {markers.map((marker) => (
        <text key={`${marker.x}-${marker.y}`} x={marker.x} y={marker.y} textAnchor="middle" fontSize="11">
          {marker.glyph}
        </text>
      ))}
    </g>
  );
}

function CrowdBadge({ density }) {
  const { t } = useTranslation();
  const DENSITY_DISPLAY = {
    low: { label: t("navigation.density.clear"), badge: "text-adwa-emerald border-adwa-emerald/30 bg-adwa-emerald/10" },
    medium: { label: t("navigation.density.busy"), badge: "text-imperial-gold border-imperial-gold/30 bg-imperial-gold/10" },
    high: { label: t("navigation.density.congested"), badge: "text-adwa-crimson border-adwa-crimson/30 bg-adwa-crimson/10" }
  };
  const style = DENSITY_DISPLAY[density] || DENSITY_DISPLAY.low;
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${style.badge}`}>
      {style.label}
    </span>
  );
}

function positionForStop(stop, index) {
  const known = ROOM_CENTERS[stop?.exhibit_id];
  if (known) return known;
  return { x: 48 + ((index * 64) % 224), y: CORRIDOR_Y };
}

function densityForStop(stop, deferredIds = []) {
  if (!stop) return "low";
  if (deferredIds.includes(stop.exhibit_id)) return "low";
  const mapped = CROWD_STATUS_TO_DENSITY[String(stop.crowdStatus ?? "").trim().toLowerCase()];
  if (mapped) return mapped;
  return simulatedDensity(stop.exhibit_id ?? "");
}

const DENSITY_WEIGHTS = { low: 0, medium: 1, high: 2 };
const CROWD_STATUS_TO_DENSITY = {
  optimal: "low", clear: "low", low: "low",
  moderate: "medium", busy: "medium",
  congested: "high", high: "high", packed: "high"
};

function simulatedDensity(exhibitId) {
  const hash = [...exhibitId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bucket = hash % 7;
  if (bucket === 0) return "high";
  if (bucket === 1 || bucket === 2) return "medium";
  return "low";
}

function worseDensity(a, b) {
  return DENSITY_WEIGHTS[a] >= DENSITY_WEIGHTS[b] ? a : b;
}

function buildRouteSegments(route, deferredIds, currentStopIndex) {
  const segments = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    const from = positionForStop(route[i], i);
    const to = positionForStop(route[i + 1], i + 1);
    const waypoints = [from, { x: from.x, y: CORRIDOR_Y }, { x: to.x, y: CORRIDOR_Y }, to];
    segments.push({
      fromId: route[i].exhibit_id ?? `stop-${i}`,
      toId: route[i + 1].exhibit_id ?? `stop-${i + 1}`,
      points: waypoints.map((point) => `${point.x},${point.y}`).join(" "),
      density: worseDensity(densityForStop(route[i], deferredIds), densityForStop(route[i + 1], deferredIds)),
      walked: i < currentStopIndex
    });
  }
  return segments;
}

function findCongestedStopAhead(route, currentStopIndex, deferredIds) {
  let worst = null;
  for (let i = currentStopIndex + 1; i < route.length; i += 1) {
    const density = densityForStop(route[i], deferredIds);
    if (DENSITY_WEIGHTS[density] === 0) continue;
    if (!worst || DENSITY_WEIGHTS[density] > DENSITY_WEIGHTS[worst.density]) {
      worst = { stop: route[i], index: i, density };
    }
  }
  return worst;
}

function reorderDeferredLast(itinerary, deferredIds) {
  if (deferredIds.length === 0) return itinerary;
  const kept = itinerary.filter((stop) => !deferredIds.includes(stop.exhibit_id));
  const deferred = itinerary.filter((stop) => deferredIds.includes(stop.exhibit_id));
  return [...kept, ...deferred];
}
