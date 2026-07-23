import React, { useState } from "react";
import Chip from "../ui/Chip.jsx";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import AdwaDivider from "../ui/AdwaDivider.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

const INTEREST_OPTIONS = ["War Strategy", "Metallurgy", "Royal History", "Music & Culture"];
const PARTY_OPTIONS = [
  { id: "individual", label: "Individual" },
  { id: "family", label: "Family with Kids" },
  { id: "scholar", label: "Scholar" }
];
const TIME_OPTIONS = [
  { label: "20 min", value: 20 },
  { label: "45 min", value: 45 },
  { label: "2 hrs", value: 120 },
  { label: "No limit", value: null }
];

/** Screen 2 — Adaptive AI Itinerary Planner (card-stack wizard) */
export default function ItineraryPlanner({ navigate }) {
  const [step, setStep] = useState(0);
  const setOnboarding = useSessionStore((s) => s.setOnboarding);
  const setItinerary = useSessionStore((s) => s.setItinerary);

  const [timeBudgetMinutes, setTimeBudgetMinutes] = useState(45);
  const [interests, setInterests] = useState([]);
  const [partyType, setPartyType] = useState(null);
  const [accessibilityOnly, setAccessibilityOnly] = useState(false);

  function toggleInterest(i) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function submitPlanner() {
    setOnboarding({ timeBudgetMinutes, interests, partyType, accessibilityOnly });

    // Behind the scenes: constraint-satisfaction over exhibit graph +
    // estimated dwell times + live crowd-density feed. Simulated for demo.
    const generated = await generateItinerary({ timeBudgetMinutes, interests, partyType, accessibilityOnly });
    setItinerary(generated);
    navigate("navigation");
  }

  const steps = [
    <TimeBudgetStep key="time" value={timeBudgetMinutes} onChange={setTimeBudgetMinutes} />,
    <InterestsStep key="interests" selected={interests} onToggle={toggleInterest} />,
    <PartyStep key="party" value={partyType} onChange={setPartyType} />,
    <AccessibilityStep key="access" value={accessibilityOnly} onChange={setAccessibilityOnly} />
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col justify-between p-6">
      <div>
        <h2 className="text-2xl text-imperial-gold mb-2">Plan Your Visit</h2>
        <AdwaDivider className="mb-6" />
        {steps[step]}
      </div>

      <div className="flex justify-between mt-6">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="text-parchment/60 disabled:opacity-30"
        >
          Back
        </button>
        <PrimaryButton
          disabled={step === 1 && interests.length === 0}
          onClick={() => (isLast ? submitPlanner() : setStep((s) => s + 1))}
        >
          {isLast ? "Generate Itinerary" : "Next"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function TimeBudgetStep({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[20, 45, 120, null].map((v) => (
        <Chip key={v ?? "none"} label={v ? `${v} min` : "No limit"} active={value === v} onClick={() => onChange(v)} />
      ))}
    </div>
  );
}

function InterestsStep({ selected, onToggle }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {INTEREST_OPTIONS.map((i) => (
        <Chip key={i} label={i} active={selected.includes(i)} onClick={() => onToggle(i)} />
      ))}
    </div>
  );
}

function PartyStep({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {PARTY_OPTIONS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`adwa-card text-left ${value === p.id ? "border-imperial-gold" : ""}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function AccessibilityStep({ value, onChange }) {
  return (
    <label className="flex items-center gap-3 adwa-card">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      Wheelchair / Elevator routes only
    </label>
  );
}

/**
 * Constraint-satisfaction stub. Section 5.2: crowd-density is simulated
 * for the demo; swap this for a real weighted graph traversal + live
 * IoT people-counter feed post-hackathon (see PHASES_AND_ROLES.md, Stream C).
 */
async function generateItinerary({ interests }) {
  const CATALOG = [
    { exhibit_id: "adwa_war_map", name: "Adwa War Room", minutes: 8, tags: ["War Strategy"] },
    { exhibit_id: "shotel_sword", name: "Metallurgy Hall", minutes: 12, tags: ["Metallurgy", "War Strategy"] },
    { exhibit_id: "royal_regalia", name: "Royal History Wing", minutes: 10, tags: ["Royal History"] },
    { exhibit_id: "wanza_drum", name: "Music & Culture Gallery", minutes: 9, tags: ["Music & Culture"] }
  ];
  const matched = CATALOG.filter((c) => interests.length === 0 || c.tags.some((t) => interests.includes(t)));
  return (matched.length ? matched : CATALOG).map((c, i) => ({ ...c, stopNumber: i + 1 }));
}
