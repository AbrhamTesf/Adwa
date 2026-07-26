import React, { useState, useMemo } from "react";
import { useTranslation } from "../../../lib/i18n";
import { getExhibitText } from "../../../data/exhibitsData";

const MASTER_QUESTION_BANK = [
  {
    exhibitId: "shotel_sword",
    exhibitName: "Shotel Curved Sword",
    question: "What unique tactical design feature made the Shotel sword so effective at Adwa?",
    options: [
      "Its semi-circular crescent curve reached around European shields",
      "It had a double hollow groove designed for long-range throwing",
      "It was weighted with lead to break cavalry lances"
    ],
    correctIndex: 0,
    explanation: "Highland blacksmiths forged the Shotel's dramatic curve specifically to reach over or around enemy shields in close combat."
  },
  {
    exhibitId: "negarit_drum",
    exhibitName: "Negarit Royal Kettledrum",
    question: "What was the chief imperial function of the Negarit drum before battle?",
    options: [
      "To signal tactical retreat during artillery bombardments",
      "To proclaim imperial mobilization edicts and rally regional defenders",
      "To mark royal time for court scribes in imperial tents"
    ],
    correctIndex: 1,
    explanation: "The Negarit was a sacred ceremonial kettledrum whose deep reverberations proclaimed imperial edicts across mountain valleys."
  },
  {
    exhibitId: "taytu_statue",
    exhibitName: "Empress Taytu Monument",
    question: "Which critical strategic maneuver did Empress Taytu Betul execute during the campaign?",
    options: [
      "She remained in Shewa directing agricultural logistics",
      "She led 6,000 warriors to cut off the vital water supply springs at Mekelle",
      "She signed the initial Treaty of Wuchale in Rome"
    ],
    correctIndex: 1,
    explanation: "Empress Taytu personally commanded her troops and devised the water siege of Mekelle, forcing enemy surrender before Adwa."
  },
  {
    exhibitId: "embilta",
    exhibitName: "Embilta Royal Flute",
    question: "How is the traditional ceremonial Embilta instrument constructed and sounded?",
    options: [
      "Single-pitch keyless tubes crafted from bamboo or hammered brass",
      "Carved cedar wood flutes featuring intricate brass valves",
      "Woven straw pipes with leather acoustic resonators"
    ],
    correctIndex: 0,
    explanation: "The Embilta is a keyless royal instrument produced in sets of three single-pitch tubes played in hocketing rhythm."
  },
  {
    exhibitId: "meleket",
    exhibitName: "Meleket Imperial Trumpet",
    question: "When was the long straight Meleket trumpet sounded during royal marches?",
    options: [
      "To herald imperial proclamations and coordinate battlefield maneuvers",
      "Only during autumn harvest celebration feasts",
      "To signal the end of daily military drills"
    ],
    correctIndex: 0,
    explanation: "The long straight brass/reed Meleket trumpet sounded royal arrivals and communicated battlefield orders across distances."
  }
];

export default function QuizEngineModal({ isOpen, onClose, visitedExhibitIds = [], onCompleteQuiz }) {
  const { t, language } = useTranslation();

  // Dynamically select 3 to 5 questions based on visited exhibits
  const questions = useMemo(() => {
    const visitedSet = new Set(visitedExhibitIds || []);
    const visitedQuestions = MASTER_QUESTION_BANK.filter((q) => visitedSet.has(q.exhibitId));
    const unvisitedQuestions = MASTER_QUESTION_BANK.filter((q) => !visitedSet.has(q.exhibitId));

    const combined = [...visitedQuestions, ...unvisitedQuestions];
    return combined.slice(0, Math.max(3, Math.min(5, combined.length)));
  }, [JSON.stringify(visitedExhibitIds)]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState({}); // { exhibitId: boolean }
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const exhibitName = getExhibitText(currentQ.exhibitId, "title", language) || currentQ.exhibitName;
  const questionText = t(`quiz.questions.${currentQ.exhibitId}.question`, currentQ.question);
  const optionsText = currentQ.options.map((opt, i) =>
    t(`quiz.questions.${currentQ.exhibitId}.options.${i}`, opt)
  );
  const explanationText = t(`quiz.questions.${currentQ.exhibitId}.explanation`, currentQ.explanation);

  const handleSelectOption = (index) => {
    if (submitted) return;
    setSelectedOption(index);
    setSubmitted(true);
    const isCorrect = index === currentQ.correctIndex;
    const newScores = { ...scores, [currentQ.exhibitId]: isCorrect };
    setScores(newScores);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setIsCompleted(true);
      if (onCompleteQuiz) {
        onCompleteQuiz(scores);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScores({});
    setIsCompleted(false);
  };

  const totalCorrect = Object.values(scores).filter(Boolean).length;
  const scorePercent = Math.round((totalCorrect / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fadeIn text-parchment">
      <div className="adwa-glass max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto border border-imperial-gold/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-parchment/60 hover:text-parchment text-lg"
          aria-label="Close quiz modal"
        >
          ✕
        </button>

        {!isCompleted ? (
          <div>
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-imperial-gold-light/80">
                {t("quiz.title", "Interactive Museum Quiz")}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-imperial-gold/20 text-imperial-gold border border-imperial-gold/30">
                {t("quiz.questionOf", "Question {current} of {total}")
                  .replace("{current}", currentIndex + 1)
                  .replace("{total}", questions.length)}
              </span>
            </div>

            {/* ---- Progress Bar ---- */}
            <div className="w-full h-1.5 bg-obsidian-overlay rounded-full overflow-hidden mb-5 border border-anza-wood/30">
              <div
                className="h-full bg-gradient-to-r from-imperial-gold to-adwa-emerald transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* ---- Question ---- */}
            <span className="text-[10px] uppercase font-semibold text-adwa-emerald tracking-wider block mb-1">
              {t("quiz.exhibitLabel", "Exhibit")}: {exhibitName}
            </span>
            <h3 className="text-base font-display text-parchment leading-snug mb-4">
              {questionText}
            </h3>

            {/* ---- Options ---- */}
            <div className="flex flex-col gap-2.5 mb-4">
              {optionsText.map((option, idx) => {
                let style = "bg-obsidian-raised border-anza-wood/50 text-parchment/90 hover:border-imperial-gold/50";
                if (submitted) {
                  if (idx === currentQ.correctIndex) {
                    style = "bg-adwa-emerald/20 border-adwa-emerald text-parchment font-semibold shadow-gold-glow ring-1 ring-adwa-emerald/50";
                  } else if (idx === selectedOption) {
                    style = "bg-adwa-crimson/20 border-adwa-crimson text-parchment/70";
                  } else {
                    style = "bg-obsidian-overlay/40 border-transparent text-parchment/40 opacity-40";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={submitted}
                    className={`w-full text-left text-xs p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${style}`}
                  >
                    <span>{option}</span>
                    {submitted && idx === currentQ.correctIndex && <span>✅</span>}
                    {submitted && idx === selectedOption && idx !== currentQ.correctIndex && <span>❌</span>}
                  </button>
                );
              })}
            </div>

            {/* ---- Explanation Box ---- */}
            {submitted && (
              <div className="p-3 bg-imperial-gold/10 border border-imperial-gold/30 rounded-xl text-left mb-4 animate-fadeIn">
                <p className="text-xs text-imperial-gold font-semibold mb-1">
                  {selectedOption === currentQ.correctIndex ? t("quiz.correct", "🎉 Correct!") : t("quiz.incorrect", "💡 Historical Fact:")}
                </p>
                <p className="text-xs text-parchment/80 italic leading-relaxed">
                  {explanationText}
                </p>
              </div>
            )}

            {/* ---- Action Button ---- */}
            {submitted && (
              <button
                onClick={handleNext}
                className="w-full adwa-btn-primary py-3 text-xs font-semibold shadow-gold-glow flex items-center justify-center gap-2"
              >
                {currentIndex < questions.length - 1 ? (
                  t("quiz.nextQuestion", "Next Question ➔")
                ) : (
                  t("quiz.viewResults", "View Quiz Results 🏆")
                )}
              </button>
            )}
          </div>
        ) : (
          /* ---- Quiz Completion Summary ---- */
          <div className="text-center py-2 animate-fadeIn">
            <span className="text-4xl block mb-2">🏆</span>
            <h3 className="text-2xl font-display text-imperial-gold mb-1">
              {t("quiz.completed", "Quiz Completed!")}
            </h3>
            <p className="text-xs text-parchment/70 mb-4">
              {t("quiz.scoreMsg", "You scored {correct} out of {total} ({percent}% Mastery)")
                .replace("{correct}", totalCorrect)
                .replace("{total}", questions.length)
                .replace("{percent}", scorePercent)}
            </p>

            <div className="p-4 bg-obsidian-raised border border-imperial-gold/30 rounded-xl mb-6">
              <p className="text-xs font-semibold text-imperial-gold-light mb-2">
                {scorePercent >= 80
                  ? t("quiz.scholarTitle", "🎖️ Unlocked Title: Adwa Scholar & Heritage Master")
                  : t("quiz.completeTitle", "📜 Quiz Complete — Review Badges on Memory Deck")}
              </p>
              <div className="adwa-divider my-2" />
              <p className="text-xs text-parchment/80">
                {t("quiz.badgesUpdated", "Your performance has been evaluated. Digital badges on your Memory Deck have been updated!")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="adwa-btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                {t("quiz.retake", "Retake Quiz")}
              </button>
              <button
                onClick={onClose}
                className="adwa-btn-primary flex-1 py-2.5 text-xs font-semibold"
              >
                {t("quiz.backToMemoryDeck", "Back to Memory Deck")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
