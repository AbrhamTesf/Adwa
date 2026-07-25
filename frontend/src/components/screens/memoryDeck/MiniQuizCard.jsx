import React, { useState } from "react";

const QUIZ_BANK = {
  shotel_sword: {
    question: "What unique tactical advantage did the curved Shotel offer at Adwa?",
    options: [
      "It allowed warriors to strike around enemy shields",
      "It was balanced primarily for long-distance throwing",
      "It served as a defensive shield-wall spike"
    ],
    correctIndex: 0,
    explanation: "Its semi-circular crescent curve enabled Ethiopian warriors to bypass enemy shields during close combat."
  },
  negarit_drum: {
    question: "What was the chief purpose of the royal Negarit drum?",
    options: [
      "To signal retreat during heavy artillery fire",
      "To proclaim imperial edicts and rally armies across valleys",
      "To measure time during royal court proceedings"
    ],
    correctIndex: 1,
    explanation: "The Negarit was a sacred imperial kettledrum sounded to announce royal edicts and summon defenders."
  },
  menelik_taytu_statue: {
    question: "What crucial tactical contribution did Empress Taytu Betul make at Adwa?",
    options: [
      "She remained in Addis Ababa directing supply lines",
      "She commanded her own troops and cut off enemy water access at Mekelle",
      "She negotiated a temporary armistice before the main battle"
    ],
    correctIndex: 1,
    explanation: "Empress Taytu commanded her own force of 6,000 warriors and strategically seized the vital water supply."
  },
  embilta: {
    question: "How is the ceremonial Embilta flute constructed and played?",
    options: [
      "Hand-crafted bamboo or hammered metal tubes tuned to single pitches",
      "Carved ivory with double reeds and rotary valves",
      "Woven reed pipes with leather bellows"
    ],
    correctIndex: 0,
    explanation: "The Embilta is a traditional keyless ceremonial wind instrument built from bamboo or metal tubes."
  },
  meleket: {
    question: "When was the royal Meleket trumpet sounded during campaign?",
    options: [
      "To announce royal proclamations and battlefield maneuvers",
      "Exclusively during evening meal preparations",
      "To signal agricultural planting seasons"
    ],
    correctIndex: 0,
    explanation: "The long straight Meleket trumpet heralded imperial announcements and coordinated troop movements."
  }
};

export default function MiniQuizCard({ exhibit, onAnswer }) {
  const quiz = QUIZ_BANK[exhibit?.exhibit_id] || {
    question: `What key lesson is commemorated by the ${exhibit?.name || "artifact"}?`,
    options: [
      "National unity and sovereign defense",
      "Modern industrial automation",
      "Naval maritime exploration"
    ],
    correctIndex: 0,
    explanation: "Adwa artifacts represent the unity, courage, and sovereign dignity of the nation."
  };

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelectedIndex(idx);
    setSubmitted(true);
    const isCorrect = idx === quiz.correctIndex;
    if (onAnswer) onAnswer(exhibit.exhibit_id, isCorrect);
  };

  return (
    <div className="mt-3 p-3 bg-obsidian/60 border border-imperial-gold/20 rounded-xl text-left">
      <p className="text-xs font-semibold text-imperial-gold-light mb-2 flex items-center gap-1.5">
        <span>❓</span> Quick Trivia Challenge
      </p>
      <p className="text-sm font-medium text-parchment/90 mb-3">{quiz.question}</p>

      <div className="flex flex-col gap-2">
        {quiz.options.map((option, idx) => {
          let btnStyle = "bg-obsidian-overlay border-anza-wood/40 text-parchment/80 hover:border-imperial-gold/40";
          if (submitted) {
            if (idx === quiz.correctIndex) {
              btnStyle = "bg-adwa-emerald/20 border-adwa-emerald text-parchment font-semibold shadow-gold-glow";
            } else if (idx === selectedIndex) {
              btnStyle = "bg-adwa-crimson/20 border-adwa-crimson text-parchment/70";
            } else {
              btnStyle = "bg-obsidian-overlay/40 border-transparent text-parchment/40 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-between ${btnStyle}`}
              onClick={() => handleSelect(idx)}
              disabled={submitted}
            >
              <span>{option}</span>
              {submitted && idx === quiz.correctIndex && <span>✅</span>}
              {submitted && idx === selectedIndex && idx !== quiz.correctIndex && <span>❌</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className="mt-2 text-[11px] leading-relaxed text-parchment/70 italic bg-imperial-gold/10 p-2 rounded border border-imperial-gold/20">
          💡 {quiz.explanation}
        </p>
      )}
    </div>
  );
}
