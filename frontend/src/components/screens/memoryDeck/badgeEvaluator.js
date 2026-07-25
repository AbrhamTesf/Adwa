/**
 * Pure function utility for evaluating visitor digital badges based on visited exhibits & quiz performance.
 */
export const BADGE_CONFIG = [
  {
    id: "adwa_explorer",
    title: "Adwa Explorer",
    icon: "🏛️",
    description: "Began your journey through the historic Adwa Museum.",
    check: (ids, quizScores) => ids.length >= 1 || Object.keys(quizScores).length >= 1
  },
  {
    id: "metallurgy_master",
    title: "Metallurgy Master",
    icon: "⚔️",
    description: "Inspected the hand-forged Shotel curved iron blade.",
    check: (ids, quizScores) => ids.includes("shotel_sword") || Boolean(quizScores.shotel_sword)
  },
  {
    id: "rhythm_commander",
    title: "Rhythm Commander",
    icon: "🥁",
    description: "Sounded the royal Negarit ceremonial drum.",
    check: (ids, quizScores) => ids.includes("negarit_drum") || Boolean(quizScores.negarit_drum)
  },
  {
    id: "royal_historian",
    title: "Royal Historian",
    icon: "👑",
    description: "Explored Emperor Menelik II & Empress Taytu monument.",
    check: (ids, quizScores) => ids.includes("menelik_taytu_statue") || Boolean(quizScores.menelik_taytu_statue)
  },
  {
    id: "ceremonial_herald",
    title: "Ceremonial Herald",
    icon: "🎺",
    description: "Discovered the Embilta or Meleket royal instruments.",
    check: (ids, quizScores) =>
      ids.some((id) => ["embilta", "meleket"].includes(id)) ||
      Boolean(quizScores.embilta) ||
      Boolean(quizScores.meleket)
  },
  {
    id: "adwa_scholar",
    title: "Adwa Scholar",
    icon: "🎓",
    description: "Achieved high mastery (≥80%) on the interactive museum quiz.",
    check: (ids, quizScores) => {
      const total = Object.keys(quizScores).length;
      if (total < 2) return false;
      const correct = Object.values(quizScores).filter(Boolean).length;
      return correct / total >= 0.8;
    }
  }
];

export const evaluateBadges = (visitedIds = [], quizScores = {}) => {
  const safeIds = Array.isArray(visitedIds) ? visitedIds : [];
  const safeScores = quizScores && typeof quizScores === "object" ? quizScores : {};
  return BADGE_CONFIG.map((badge) => ({
    ...badge,
    unlocked: badge.check(safeIds, safeScores)
  }));
};
