import React, { useMemo, useState } from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import Chip from "../ui/Chip.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Venue floor plan — top-down gallery layout with a single spine corridor.
 * Hackathon MVP: a stylized static plan, not a surveyed venue SVG.
 */
const FLOOR_ROOMS = [
  { exhibitId: "adwa_war_map", label: "Strategy Room", x: 16, y: 24, w: 88, h: 64 },
  { exhibitId: "shotel_sword", label: "Metallurgy Hall", x: 116, y: 24, w: 88, h: 64 },
  { exhibitId: "menelik_taytu_statue", label: "Royal Gallery", x: 216, y: 24, w: 88, h: 64 },
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

/** Crowd density presentation — green / amber / red per Screen 3 spec. */
const DENSITY = {
  low: {
    label: "Clear",
    stroke: "stroke-adwa-emerald",
    dot: "bg-adwa-emerald",
    badge: "text-adwa-emerald border-adwa-emerald/30 bg-adwa-emerald/10",
    weight: 0
  },
  medium: {
    label: "Busy",
    stroke: "stroke-imperial-gold",
    dot: "bg-imperial-gold",
    badge: "text-imperial-gold border-imperial-gold/30 bg-imperial-gold/10",
    weight: 1
  },
  high: {
    label: "Congested",
    stroke: "stroke-adwa-crimson",
    dot: "bg-adwa-crimson",
    badge: "text-adwa-crimson border-adwa-crimson/30 bg-adwa-crimson/10",
    weight: 2
  }
};

const CROWD_STATUS_TO_DENSITY = {
  optimal: "low",
  clear: "low",
  low: "low",
  moderate: "medium",
  busy: "medium",
  congested: "high",
  high: "high",
  packed: "high"
};

export default function LiveNavigation({ navigate }) {
  const itinerary = useSessionStore((s) => s.itinerary);
  const currentStopIndex = useSessionStore((s) => s.currentStopIndex);
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);
  const accessibilityOnly = useSessionStore((s) => s.accessibilityOnly);
  const advanceStop = useSessionStore((s) => s.advanceStop);
  const markVisited = useSessionStore((s) => s.markVisited);

  // Stops deferred by "Reroute to avoid crowd" — visual reorder only, the
  // planner's stored itinerary stays untouched so tour progress is preserved.
  const [deferredIds, setDeferredIds] = useState([]);
  const [checkInNotice, setCheckInNotice] = useState(null);

  const route = useMemo(() => reorderDeferredLast(itinerary, deferredIds), [itinerary, deferredIds]);
  const segments = useMemo(
    () => buildRouteSegments(route, deferredIds, currentStopIndex),
    [route, deferredIds, currentStopIndex]
  );

  const currentStop = route[currentStopIndex];
  const nextStop = route[currentStopIndex + 1];
  const isLastStop = route.length > 0 && currentStopIndex >= route.length - 1;
  const congestedAhead = findCongestedStopAhead(route, currentStopIndex, deferredIds);
  const position = currentStop ? positionForStop(currentStop, currentStopIndex) : null;

  function handleCheckIn() {
    if (!currentStop) return;
    if (currentStop.exhibit_id) markVisited(currentStop.exhibit_id);
    setCheckInNotice(
      nextStop
        ? `Checked in at ${currentStop.name}. Next: ${nextStop.name}.`
        : `Checked in at ${currentStop.name}. That was your final stop.`
    );
    advanceStop();
  }

  // Defers the busiest upcoming hall to the end of the walking order.
  function handleReroute() {
    if (!congestedAhead?.stop?.exhibit_id) return;
    setDeferredIds((prev) => [...prev, congestedAhead.stop.exhibit_id]);
    setCheckInNotice(`Rerouted — ${congestedAhead.stop.name} moved to the end of your route.`);
  }

  if (route.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-4xl">🗺️</span>
        <h2 className="text-2xl font-display font-bold text-imperial-gold">No Route Yet</h2>
        <p className="text-sm text-parchment/70 max-w-xs">
          Plan your tour first and Adwa Lens will draw a walking route across the museum floor.
        </p>
        <PrimaryButton onClick={() => navigate("planner")}>Plan My Tour</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-imperial-gold">Live Navigation</h2>
          <p className="text-xs text-parchment/70">
            Stop {Math.min(currentStopIndex + 1, route.length)} of {route.length}
            {accessibilityOnly ? " · Accessible route" : ""}
          </p>
        </div>
        <span className="text-[10px] font-semibold text-adwa-emerald bg-adwa-emerald/10 border border-adwa-emerald/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-adwa-emerald animate-pulse" />
          Checkpoint mode
        </span>
      </div>

      {/* [1] 2D top-down SVG floor map with density-coloured route line */}
      <div className="adwa-card mb-3">
        <svg
          viewBox="0 0 320 236"
          className="w-full max-h-[45vh]"
          role="img"
          aria-label={`Museum floor map showing your route. You are at ${currentStop?.name ?? "the entrance"}.`}
        >
          <rect
            x={CORRIDOR.x}
            y={CORRIDOR.y}
            width={CORRIDOR.w}
            height={CORRIDOR.h}
            rx="6"
            className="fill-obsidian-overlay stroke-imperial-gold/25"
            strokeWidth="1"
          />

          {FLOOR_ROOMS.map((room) => {
            const isRouteRoom = route.some((stop) => stop.exhibit_id === room.exhibitId);
            return (
              <g key={room.exhibitId}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="8"
                  className={
                    isRouteRoom
                      ? "fill-imperial-gold/10 stroke-imperial-gold/50"
                      : "fill-obsidian-raised/60 stroke-wanza-wood-light"
                  }
                  strokeWidth="1"
                />
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h - 8}
                  textAnchor="middle"
                  fontSize="7"
                  className={isRouteRoom ? "fill-parchment/80" : "fill-parchment/35"}
                >
                  {room.label}
                </text>
              </g>
            );
          })}

          {segments.map((segment) => (
            <polyline
              key={`${segment.fromId}-${segment.toId}`}
              points={segment.points}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 5"
              className={DENSITY[segment.density].stroke}
              opacity={segment.walked ? 0.35 : 1}
            />
          ))}

          {accessibilityOnly && <AccessibilityMarkers />}

          {route.map((stop, index) => (
            <StopMarker
              key={stop.exhibit_id ?? index}
              stop={stop}
              index={index}
              isCurrent={index === currentStopIndex}
              isVisited={visitedExhibitIds.includes(stop.exhibit_id)}
            />
          ))}

          {position && <UserPositionDot x={position.x} y={position.y} />}
        </svg>

        <div className="flex items-center justify-center gap-4 pt-3 shrink-0 text-[10px] text-parchment/60">
          {Object.entries(DENSITY).map(([key, style]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          ))}
        </div>
      </div>

      {congestedAhead && (
        <div className="mb-3">
          <Chip label={`Reroute to avoid crowd in ${congestedAhead.stop.name}`} icon="⚠️" onClick={handleReroute} />
        </div>
      )}

      {checkInNotice && (
        <p className="text-xs text-adwa-emerald bg-adwa-emerald/10 border border-adwa-emerald/25 rounded-xl px-3 py-2 mb-3">
          {checkInNotice}
        </p>
      )}

      {/* [2] Bottom sheet — current stop detail + manual checkpoint check-in */}
      <div className="adwa-glass p-4 mt-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-parchment/60 mb-0.5">
              {isLastStop ? "Final stop" : "You are here"}
            </p>
            <p className="text-lg font-display font-bold text-parchment">{currentStop?.name}</p>
          </div>
          <CrowdBadge density={densityForStop(currentStop, deferredIds)} />
        </div>

        <div className="flex items-center gap-2 text-xs text-parchment/70 mb-3">
          {currentStop?.minutes && <span>⏱️ ~{currentStop.minutes} min dwell</span>}
          {currentStop?.category && (
            <>
              <span>•</span>
              <span className="text-imperial-gold/90">{currentStop.category}</span>
            </>
          )}
        </div>

        {nextStop && (
          <p className="text-xs text-parchment/60 mb-3">
            Then walk to <span className="text-parchment/90">{nextStop.name}</span>
            {accessibilityOnly ? " via the elevator corridor" : ""}.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button className="adwa-btn-primary w-full" onClick={() => navigate("scanner")}>
            Scan This Exhibit
          </button>
          {isLastStop ? (
            <button className="adwa-btn-secondary w-full" onClick={() => navigate("memoryDeck")}>
              I&apos;m here — Finish Tour
            </button>
          ) : (
            <button className="adwa-btn-secondary w-full" onClick={handleCheckIn}>
              I&apos;m here — Check In &amp; Continue
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

/** Elevator / ramp affordances shown only when accessibility mode is on. */
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
  const style = DENSITY[density];
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${style.badge}`}>
      {style.label}
    </span>
  );
}

function positionForStop(stop, index) {
  const known = ROOM_CENTERS[stop?.exhibit_id];
  if (known) return known;
  // Unmapped exhibit — park it along the corridor spine so the route stays drawable.
  return { x: 48 + ((index * 64) % 224), y: CORRIDOR_Y };
}

function densityForStop(stop, deferredIds = []) {
  if (!stop) return "low";
  // A deferred hall is expected to have cleared by the time the visitor loops back.
  if (deferredIds.includes(stop.exhibit_id)) return "low";
  const mapped = CROWD_STATUS_TO_DENSITY[String(stop.crowdStatus ?? "").trim().toLowerCase()];
  if (mapped) return mapped;
  return simulatedDensity(stop.exhibit_id ?? "");
}

/** Deterministic stand-in for the venue's IoT people-counter feed. */
function simulatedDensity(exhibitId) {
  const hash = [...exhibitId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bucket = hash % 7;
  if (bucket === 0) return "high";
  if (bucket === 1 || bucket === 2) return "medium";
  return "low";
}

function worseDensity(a, b) {
  return DENSITY[a].weight >= DENSITY[b].weight ? a : b;
}

// Route legs walk stop -> corridor spine -> corridor spine -> next stop.
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
    if (DENSITY[density].weight === 0) continue;
    if (!worst || DENSITY[density].weight > DENSITY[worst.density].weight) {
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
