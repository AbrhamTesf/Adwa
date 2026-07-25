/**
 * Pure function utility for evaluating visitor digital badges based on visited exhibits.
 */
export const BADGE_CONFIG = [
  {
    id: "adwa_explorer",
    title: "Adwa Explorer",
    icon: "🏛️",
    description: "Began your journey through the historic Adwa Museum.",
    check: (ids) => ids.length >= 1
  },
  {
    id: "metallurgy_master",
    title: "Metallurgy Master",
    icon: "⚔️",
    description: "Inspected the hand-forged Shotel curved iron blade.",
    check: (ids) => ids.includes("shotel_sword")
  },
  {
    id: "rhythm_commander",
    title: "Rhythm Commander",
    icon: "🥁",
    description: "Sounded the royal Negarit ceremonial drum.",
    check: (ids) => ids.includes("negarit_drum")
  },
  {
    id: "royal_historian",
    title: "Royal Historian",
    icon: "👑",
    description: "Explored Emperor Menelik II & Empress Taytu monument.",
    check: (ids) => ids.includes("menelik_taytu_statue")
  },
  {
    id: "ceremonial_herald",
    title: "Ceremonial Herald",
    icon: "🎺",
    description: "Discovered the Embilta or Meleket royal instruments.",
    check: (ids) => ids.some((id) => ["embilta", "meleket"].includes(id))
  }
];

export const evaluateBadges = (visitedIds = []) => {
  const safeIds = Array.isArray(visitedIds) ? visitedIds : [];
  return BADGE_CONFIG.map((badge) => ({
    ...badge,
    unlocked: badge.check(safeIds)
  }));
};
