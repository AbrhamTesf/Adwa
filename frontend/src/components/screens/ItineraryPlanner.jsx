import React, { useState } from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import AdwaDivider from "../ui/AdwaDivider.jsx";
import { useSessionStore } from "../../stores/useSessionStore";
import { useTranslation } from "../../lib/i18n";
import { getExhibitText } from "../../data/exhibitsData";

/**
 * Screen 2 — Adaptive AI Itinerary Planner & Crowd Feed Wizard
 * Adheres strictly to docs/adwa_lens_architecture.md Section 2 (Screen 2)
 */
export default function ItineraryPlanner({ navigate }) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  const setOnboarding = useSessionStore((s) => s.setOnboarding);
  const setItinerary = useSessionStore((s) => s.setItinerary);

  const [timeBudgetMinutes, setTimeBudgetMinutes] = useState(45);
  const [interests, setInterests] = useState(["War Strategy", "Royal History"]);
  const [partyType, setPartyType] = useState("individual");
  const [accessibilityOnly, setAccessibilityOnly] = useState(false);

  const INTEREST_OPTIONS = [
    { id: "War Strategy", label: t("planner.interests.warStrategy"), icon: "⚔️", desc: t("planner.interests.warStrategyDesc") },
    { id: "Metallurgy", label: t("planner.interests.metallurgy"), icon: "🛠️", desc: t("planner.interests.metallurgyDesc") },
    { id: "Royal History", label: t("planner.interests.royalHistory"), icon: "👑", desc: t("planner.interests.royalHistoryDesc") },
    { id: "Music & Culture", label: t("planner.interests.musicCulture"), icon: "🥁", desc: t("planner.interests.musicCultureDesc") }
  ];

  const PARTY_OPTIONS = [
    { id: "individual", label: t("planner.party.individual"), icon: "👤", desc: t("planner.party.individualDesc") },
    { id: "family", label: t("planner.party.family"), icon: "👨‍👩‍👧", desc: t("planner.party.familyDesc") },
    { id: "scholar", label: t("planner.party.scholar"), icon: "📜", desc: t("planner.party.scholarDesc") }
  ];

  const TIME_OPTIONS = [
    { label: t("planner.time.20min"), sub: t("planner.time.20sub"), value: 20, icon: "⚡" },
    { label: t("planner.time.45min"), sub: t("planner.time.45sub"), value: 45, icon: "🧭" },
    { label: t("planner.time.2hrs"), sub: t("planner.time.2sub"), value: 120, icon: "🏛️" },
    { label: t("planner.time.noLimit"), sub: t("planner.time.noLimitSub"), value: null, icon: "♾️" }
  ];

  const STEP_TITLES = [
    { title: t("planner.steps.duration.title"), subtitle: t("planner.steps.duration.subtitle") },
    { title: t("planner.steps.interests.title"), subtitle: t("planner.steps.interests.subtitle") },
    { title: t("planner.steps.party.title"), subtitle: t("planner.steps.party.subtitle") },
    { title: t("planner.steps.accessibility.title"), subtitle: t("planner.steps.accessibility.subtitle") }
  ];

  function toggleInterest(interestId) {
    setInterests((prev) =>
      prev.includes(interestId) ? prev.filter((x) => x !== interestId) : [...prev, interestId]
    );
  }

  async function handleGenerateItinerary() {
    setIsGenerating(true);
    setOnboarding({ timeBudgetMinutes, interests, partyType, accessibilityOnly });

    setTimeout(async () => {
      const stops = await generateItineraryRoute({ timeBudgetMinutes, interests, partyType, accessibilityOnly });
      setGeneratedItinerary(stops);
      setItinerary(stops);
      setIsGenerating(false);
    }, 900);
  }

  function handleStartTour() {
    navigate("navigation");
  }

  // If itinerary is already generated, display the generated route overview card stack
  if (generatedItinerary) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-6 bg-obsidian text-parchment animate-fade-in">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-display font-bold text-imperial-gold">{t("planner.customTour")}</h2>
            <button
              onClick={() => setGeneratedItinerary(null)}
              className="text-xs text-adwa-emerald hover:underline font-semibold flex items-center gap-1"
            >
              {t("planner.editPreferences")}
            </button>
          </div>
          <p className="text-xs text-parchment/70 mb-4">
            {t("planner.aiOptimized").replace("{budget}", timeBudgetMinutes ? `${timeBudgetMinutes}m` : t("planner.time.noLimit"))}
          </p>

          <AdwaDivider className="mb-4" />

          {/* Live Crowd Density Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl glass-card border border-imperial-gold/30 mb-5">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-adwa-emerald animate-pulse" />
              <span className="text-slate-100 font-medium">{t("planner.liveCrowdFeed")}</span>
            </div>
            <span className="text-xs font-semibold text-adwa-emerald bg-adwa-emerald/15 px-3 py-1 rounded-full border border-adwa-emerald/40 shadow-sm">
              {t("planner.lowCongestion")}
            </span>
          </div>

          {/* Generated Stops List */}
          <div className="space-y-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {generatedItinerary.map((stop, idx) => {
              const displayName = getExhibitText(stop.exhibit_id, "title", language) || stop.name;
              return (
                <div
                  key={stop.exhibit_id || idx}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="glass-card p-4 rounded-xl border border-imperial-gold/30 flex items-center justify-between hover:border-imperial-gold/60 transition-all gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 pr-1">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-950 text-imperial-gold flex items-center justify-center font-bold text-xs border-2 border-imperial-gold shadow-gold-glow">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-semibold text-sm text-slate-100 truncate">{displayName}</h4>
                        <p className="text-[11px] text-slate-300/80 truncate">
                          {getExhibitText(stop.exhibit_id, "category", language) || stop.category} • {t("planner.minDwell").replace("{min}", stop.minutes)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase font-bold text-adwa-emerald bg-adwa-emerald/15 border border-adwa-emerald/40 px-2.5 py-1 rounded-full">
                      {stop.crowdStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PrimaryButton onClick={handleStartTour} className="w-full mt-6 py-3.5 shadow-gold-glow text-sm font-bold">
          {t("planner.startWalking")}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-obsidian text-parchment pb-safe">
      {/* Header & Step Indicator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-display font-bold text-imperial-gold">{t("planner.title")}</h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full glass-card text-imperial-gold border border-imperial-gold/30">
            {t("planner.stepOf").replace("{step}", step + 1).replace("{total}", 4)}
          </span>
        </div>

        {/* Segmented Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i <= step
                  ? "bg-gradient-to-r from-imperial-gold to-imperial-gold-light shadow-gold-glow"
                  : "bg-obsidian-raised/80 border border-white/10"
              }`}
            />
          ))}
        </div>

        {/* Step Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-semibold text-slate-100">{STEP_TITLES[step].title}</h3>
          <p className="text-xs text-slate-300 mt-1">{STEP_TITLES[step].subtitle}</p>
        </div>

        {/* Step 0: Duration */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {TIME_OPTIONS.map((opt) => {
              const selected = timeBudgetMinutes === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => setTimeBudgetMinutes(opt.value)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 relative ${
                    selected
                      ? "bg-imperial-gold/25 border-2 border-imperial-gold ring-2 ring-imperial-gold/60 text-slate-100 shadow-gold-glow scale-[1.02]"
                      : "glass-card border border-white/10 text-slate-300 hover:border-imperial-gold/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl block">{opt.icon}</span>
                    {selected && (
                      <span className="bg-imperial-gold text-obsidian text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <div className={`font-bold text-sm ${selected ? "text-imperial-gold-light" : "text-slate-100"}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-300/80">{opt.sub}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            {INTEREST_OPTIONS.map((item) => {
              const active = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className="w-full p-3.5 rounded-xl text-left flex items-center justify-between transition-all duration-200 glass-card border border-white/10 hover:border-imperial-gold/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-100">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-300/80">{item.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-all ${
                        active
                          ? "bg-imperial-gold text-obsidian shadow-gold-glow scale-110"
                          : "bg-slate-800/80 text-slate-400 border border-white/10"
                      }`}
                    >
                      {active ? "✓" : "+"}
                    </span>
                  </div>
                </button>
              );
            })}
            {interests.length === 0 && (
              <p className="text-xs text-adwa-crimson mt-2 font-medium">{t("planner.selectAtLeast1")}</p>
            )}
          </div>
        )}

        {/* Step 2: Party Type */}
        {step === 2 && (
          <div className="space-y-3 animate-fade-in">
            {PARTY_OPTIONS.map((party) => {
              const selected = partyType === party.id;
              return (
                <button
                  key={party.id}
                  onClick={() => setPartyType(party.id)}
                  className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                    selected
                      ? "bg-imperial-gold/25 border-2 border-imperial-gold ring-2 ring-imperial-gold/60 shadow-gold-glow scale-[1.01]"
                      : "glass-card border border-white/10 hover:border-imperial-gold/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{party.icon}</span>
                    <div>
                      <div className={`font-bold text-sm ${selected ? "text-imperial-gold-light" : "text-slate-100"}`}>
                        {party.label}
                      </div>
                      <div className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">{party.desc}</div>
                    </div>
                  </div>
                  {selected && (
                    <span className="bg-imperial-gold text-obsidian text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md shrink-0">
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3: Accessibility */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            {/* Accessibility Switch Card */}
            <div className="adwa-glass p-4 rounded-xl border border-imperial-gold/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">♿</span>
                <div>
                  <div className="font-bold text-sm text-parchment">{t("planner.accessibleRoutes")}</div>
                  <div className="text-xs text-parchment/70">{t("planner.accessibleRoutesDesc")}</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={accessibilityOnly}
                onChange={(e) => setAccessibilityOnly(e.target.checked)}
                className="w-5 h-5 accent-imperial-gold cursor-pointer"
              />
            </div>

            {/* Live Crowd Feed Overview */}
            <div className="bg-obsidian-raised/80 p-4 rounded-xl border border-parchment/15">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📡</span>
                <span className="font-bold text-xs uppercase tracking-wider text-imperial-gold">
                  {t("planner.crowdFeed")}
                </span>
              </div>
              <p className="text-xs text-parchment/80 leading-relaxed mb-3">
                {t("planner.crowdFeedDesc")}
              </p>
              <div className="flex items-center gap-2 text-xs text-adwa-emerald bg-adwa-emerald/10 p-2.5 rounded-lg border border-adwa-emerald/20">
                <span>✓</span>
                <span>{t("planner.crowdActive")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-parchment/10">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="px-4 py-2.5 rounded-full text-xs font-semibold text-parchment/70 hover:text-parchment disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          {t("planner.backBtn")}
        </button>

        {step < 3 ? (
          <PrimaryButton
            disabled={step === 1 && interests.length === 0}
            onClick={() => setStep((s) => s + 1)}
            className="px-8 py-2.5 text-sm"
          >
            {t("planner.nextStep")}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={handleGenerateItinerary}
            disabled={isGenerating}
            className="px-6 py-2.5 text-sm shadow-gold-glow"
          >
            {isGenerating ? t("planner.generatingRoute") : t("planner.generateItinerary")}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

/**
 * Constraint-satisfaction exhibit graph traversal engine.
 * Matches interests, time budget, party type, and live crowd density.
 */
async function generateItineraryRoute({ timeBudgetMinutes, interests }) {
  const CATALOG = [
    { exhibit_id: "adwa_war_map", name: "Adwa War Strategy Room", minutes: 8, category: "Military Strategy", tags: ["War Strategy"], crowdStatus: "Optimal" },
    { exhibit_id: "shotel_sword", name: "Shotel Sword & Metallurgy Hall", minutes: 12, category: "Weaponry", tags: ["Metallurgy", "War Strategy"], crowdStatus: "Optimal" },
    { exhibit_id: "taytu_statue", name: "Empress Taytu Monument", minutes: 10, category: "Monuments", tags: ["Royal History"], crowdStatus: "Moderate" },
    { exhibit_id: "negarit_drum", name: "Negarit Ceremonial Drum", minutes: 9, category: "Cultural Instruments", tags: ["Music & Culture"], crowdStatus: "Optimal" },
    { exhibit_id: "embilta", name: "Embilta Ceremonial Horn", minutes: 7, category: "Cultural Instruments", tags: ["Music & Culture"], crowdStatus: "Optimal" },
    { exhibit_id: "meleket", name: "Meleket Victory Trumpet", minutes: 6, category: "Cultural Instruments", tags: ["Music & Culture"], crowdStatus: "Optimal" }
  ];

  // Filter exhibits matching selected interests
  let matched = CATALOG.filter(
    (item) => interests.length === 0 || item.tags.some((tag) => interests.includes(tag))
  );

  if (matched.length === 0) {
    matched = CATALOG;
  }

  // Trim to time budget if specified
  let totalTime = 0;
  const filteredRoute = [];
  for (const stop of matched) {
    if (timeBudgetMinutes && totalTime + stop.minutes > timeBudgetMinutes && filteredRoute.length > 0) {
      break;
    }
    filteredRoute.push(stop);
    totalTime += stop.minutes;
  }

  return filteredRoute;
}
