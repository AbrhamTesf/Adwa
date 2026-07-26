/**
 * English locale — complete UI string catalog for Adwa Lens.
 *
 * Keys are organized by screen namespace. Every key referenced
 * via t() in any component MUST exist here as the authoritative
 * English source. The Amharic locale (am.js) mirrors this structure.
 */
export default {
  /* ── Common / shared ───────────────────────────────────── */
  common: {
    back: "Back",
    next: "Next",
    send: "Send",
    copy: "Copy",
    cancel: "Cancel",
    close: "Close",
    retry: "Retry",
    loading: "Loading…",
    error: "Error",
    adwaLens: "Adwa Lens",
    yes: "Yes",
    no: "No"
  },

  /* ── Screen 1 — Landing ────────────────────────────────── */
  landing: {
    badge: "Victory of Adwa Centenary Companion",
    tagline: "Your museum, brought to life.",
    startTour: "Start My Tour",
    ticketQR: "I have a ticket QR",
    selectLanguage: "Select Language / ቋንቋ ይምረጡ",
    modal: {
      title: "Unlock Interactive Experience",
      description: "To experience WebAR 3D exhibit scanning and real-time Voice AI guide answers, Adwa Lens requires device permissions.",
      cameraAccess: "Camera Access",
      cameraDesc: "Scan historical exhibits and view 3D AR overlays",
      micAccess: "Microphone Access",
      micDesc: "Ask your AI voice guide questions hands-free",
      grantAccess: "Grant Access & Continue",
      requestingAccess: "Requesting Access...",
      skipPermissions: "Continue without media permissions"
    }
  },

  /* ── Screen 2 — Itinerary Planner ──────────────────────── */
  planner: {
    title: "Plan Your Tour",
    stepOf: "Step {step} of {total}",
    steps: {
      duration: { title: "Select Duration", subtitle: "How much time do you have today?" },
      interests: { title: "Choose Interests", subtitle: "Select at least 1 historical theme" },
      party: { title: "Party Type", subtitle: "Tailor the AI voice guide to your group" },
      accessibility: { title: "Accessibility & Crowd", subtitle: "Personalize route preferences" }
    },
    time: {
      "20min": "20 min", "20sub": "Express Tour",
      "45min": "45 min", "45sub": "Standard Tour",
      "2hrs": "2 hrs", "2sub": "Deep Dive",
      noLimit: "No Limit", noLimitSub: "Full Day Pass"
    },
    interests: {
      warStrategy: "War Strategy", warStrategyDesc: "Tactical maps, battle lines & weapons",
      metallurgy: "Metallurgy", metallurgyDesc: "Craftsmanship of Shotel swords & armor",
      royalHistory: "Royal History", royalHistoryDesc: "Emperor Menelik II & Empress Taytu regalia",
      musicCulture: "Music & Culture", musicCultureDesc: "Negarit War Drums, Embilta & Meleket"
    },
    party: {
      individual: "Individual Explorer", individualDesc: "Balanced historical depth & self-paced tour",
      family: "Family with Kids", familyDesc: "Fun stories, kid-friendly AI guide & interactive quizzes",
      scholar: "History Scholar", scholarDesc: "Deep archival citations, primary sources & tactical analysis"
    },
    accessibleRoutes: "Accessible Routes Only",
    accessibleRoutesDesc: "Wheelchair & elevator accessible paths",
    crowdFeed: "Live Crowd Density Feed",
    crowdFeedDesc: "Adwa Lens dynamically reroutes your tour to skip congested halls and optimize your dwell time at peak exhibits.",
    crowdActive: "Real-time IoT crowd monitoring active",
    selectAtLeast1: "Please select at least 1 theme to continue.",
    nextStep: "Next Step →",
    backBtn: "← Back",
    generateItinerary: "Generate Itinerary",
    generatingRoute: "Generating Route...",
    customTour: "Your Customized Tour",
    editPreferences: "✏️ Edit Preferences",
    aiOptimized: "AI-optimized route based on your {budget} & live museum crowd density.",
    liveCrowdFeed: "Live Museum Crowd Feed:",
    lowCongestion: "Low Congestion (18% Capacity)",
    minDwell: "~{min} min dwell",
    startWalking: "Start Walking Tour"
  },

  /* ── Screen 3 — Live Navigation ────────────────────────── */
  navigation: {
    title: "Live Navigation",
    stopOf: "Stop {current} of {total}",
    accessibleRoute: " · Accessible route",
    checkpoint: "Checkpoint mode",
    noRoute: "No Route Yet",
    noRouteDesc: "Plan your tour first and Adwa Lens will draw a walking route across the museum floor.",
    planMyTour: "Plan My Tour",
    youAreHere: "You are here",
    finalStop: "Final stop",
    thenWalkTo: "Then walk to",
    viaElevator: " via the elevator corridor",
    scanExhibit: "Scan This Exhibit",
    finishTour: "I'm here — Finish Tour",
    checkIn: "I'm here — Check In & Continue",
    checkedIn: "Checked in at {name}. Next: {next}.",
    checkedInFinal: "Checked in at {name}. That was your final stop.",
    reroute: "Reroute to avoid crowd in {name}",
    rerouted: "Rerouted — {name} moved to the end of your route.",
    density: {
      clear: "Clear",
      busy: "Busy",
      congested: "Congested"
    }
  },

  /* ── Screen 4 — Camera Scanner ─────────────────────────── */
  scanner: {
    title: "Adwa Lens AI Scanner",
    positionExhibit: "Position exhibit inside reticle",
    alignAndTap: "Align exhibit inside reticle and tap scan",
    analyzing: "Analyzing exhibit with Gemini AI...",
    tapToScan: "Tap button to capture & scan",
    scanQR: "Scan QR code instead →",
    matchFound: "Match Found ({confidence}%)",
    explore3D: "Explore Exhibit in 3D →",
    rescan: "Rescan",
    hints: {
      more_light: "Try adding more light",
      move_closer: "Move closer to exhibit",
      hold_steady: "Hold camera steady"
    },
    errors: {
      NotAllowedError: "Camera access is blocked for this site. Allow it in your browser's site settings, then reload.",
      SecurityError: "Camera access needs a secure (https) connection.",
      NotFoundError: "No camera was found on this device.",
      NotReadableError: "Another app or browser tab is already using the camera. Close it and retry.",
      OverconstrainedError: "No rear-facing camera is available on this device.",
      AbortError: "The camera stopped unexpectedly. Reload the page to try again.",
      fallback: "Unable to access camera feed. Please check permissions.",
      darkFrame: "Frame captured was too dark. Please align exhibit clearly.",
      rateLimit: "Gemini API rate limit reached. Retrying in a few moments...",
      analyzeFailed: "Failed to analyze frame.",
      lowConfidence: "Exhibit not recognized with high confidence. Try repositioning.",
      network: "Network error contacting vision proxy."
    }
  },

  /* ── Screen 5 — Inspection Hub ─────────────────────────── */
  inspection: {
    title: "3D Inspection",
    tabs: {
      material: "Material",
      craft: "Craft & Method",
      usage: "Usage & Significance"
    },
    backToTourMap: "Back to Tour Map",
    backToScanner: "Back to Scanner",
    finishInspection: "Finish Inspection",
    preparing: "Preparing the artifact…",
    unavailable: "Artifact unavailable",
    returnToScanner: "Return to scanner",
    loading3D: "Loading 3D Statue Mesh…",
    selectHotspot: "Select a glowing hotspot on the monument to inspect historical details.",
    explodedView: "Exploded View",
    resetCamera: "Reset Camera",
    storyTranscript: "Story Transcript",
    hideTranscript: "Hide ▲",
    showTranscript: "Show ▼",
    generateExplanation: "Generating deep AI historical analysis…",
    pauseVoice: "⏸️ Pause Voice",
    replayAudio: "🔊 Replay Audio",
    askQuestion: "Ask about this hotspot…",
    webglFallback: "3D WebGL preview fallback active. You can still inspect historical hotspots and query the AI voice guide below.",
    retry3D: "Retry 3D Render",
    voiceGuide: "Voice Guide",
    sensoryMode: "Sensory Mode",
    hotspots: {
      albaso_braids: {
        title: "Royal Braided Hairstyle (Albaso)",
        tag: "Craft & Tradition",
        description: "Traditional Ethiopian royal braiding symbolizing dignity and leadership."
      },
      kaba_dress: {
        title: "Ceremonial Kaba & Dress",
        tag: "Material & Craft",
        description: "Heavy royal cloak with chest clasp and detailed belt medallion."
      },
      royal_sword: {
        title: "Sheathed Royal Sword",
        tag: "Military Command",
        description: "Represents Empress Taytu's personal military command and troop deployment at Adwa."
      },
      command_gesture: {
        title: "Strategic Command Gesture",
        tag: "Strategic Mastermind",
        description: "Outstretched pointing hand highlighting her strategic mastermind during the Battle of Adwa."
      }
    },
    explodedParts: {
      curvedBlade: "Curved Blade",
      curvedBladeDesc: "Damascus-forged high-carbon steel optimized for cavalry combat.",
      hiltGuard: "Hilt Guard",
      hiltGuardDesc: "Hand-carved horn grip with imperial gold inlay.",
      leatherSheath: "Leather Sheath",
      leatherSheathDesc: "Embossed leather scabbard with brass fittings."
    }
  },

  /* ── Screen 6 — Sensory Hub ────────────────────────────── */
  sensory: {
    header: "Sensory interaction",
    back: "Back",
    blowToPlay: "Blow to Play",
    stopMic: "Stop mic",
    blow: "Blow",
    rimTap: "Rim tap",
    strikeDrum: "Strike drum",
    breathIntensity: "Breath intensity",
    micLive: "Mic live",
    micOff: "Mic off",
    blowholeEnabled: "Blowhole tap enabled",
    loadingMesh: "Loading instrument mesh…",
    meshTapEnabled: "Direct mesh tap enabled",
    negarit: {
      title: "Negarit Royal Drum",
      hint: "Tap the 3D drum skin or strike the virtual mallet.",
      deepBass: "Deep ceremonial bass tone",
      brightRim: "Bright rim tone",
      chooseStrike: "Choose a strike to begin"
    },
    embilta: {
      title: "Embilta Ceremonial Flute",
      hint: "Blow into your mic or tap the blowhole to sound the flute.",
      callLabel: "Sustained bamboo tone"
    },
    meleket: {
      title: "Meleket Royal Trumpet",
      hint: "Blow into your mic or tap the mouthpiece to sound the herald call.",
      callLabel: "Three-note herald call"
    },
    mic: {
      audioUnavailable: "Audio is unavailable in this browser; the airflow overlay remains active.",
      denied: "Microphone blocked — use the Blow button to sound the instrument.",
      unsupported: "Mic breath input is unavailable here; use the Blow button instead.",
      requesting: "Waiting for microphone permission…",
      blowing: "Breath detected — air is flowing through the instrument.",
      listening: "Listening — blow steadily into your microphone.",
      audioUnavailableDrum: "Audio is unavailable in this browser; visual feedback remains active."
    }
  },

  /* ── Screen 7 — Voice Guide ────────────────────────────── */
  voiceGuide: {
    header: "AI Voice Guide & RAG",
    selectPersona: "SELECT GUIDE PERSONA",
    status: {
      listening: "🎙️ Listening…",
      thinking: "🧠 Thinking…",
      speaking: "🔊 Speaking…",
      ready: "✦ Ready"
    },
    defaultPrompt: "Ask me anything about Empress Taytu or the Battle of Adwa.",
    holdToSpeak: "Hold button to speak • Release to send",
    typePlaceholder: "Type your question here...",
    backToInspection: "Back to 3D Inspection"
  },

  /* ── Screen 8 — Memory Deck ────────────────────────────── */
  memoryDeck: {
    screenLabel: "Screen 8 — Post-Tour Souvenir",
    title: "Your Adwa Recap",
    subtitle: "Review your discoveries, earned badges, and memorial souvenir card.",
    quizLabel: "FEAT-018 Quiz Engine",
    quizTitle: "Interactive Museum Quiz",
    quizDesc: "Test your knowledge on visited exhibits to unlock special badges!",
    takeQuiz: "Take Quiz 🏆",
    continueDevice: "Continue on another device",
    continueDeviceDesc: "Create a private recovery link for your route, visited exhibits, preferences, and earned badges.",
    saveTour: "Save my tour link",
    savingTour: "Saving your tour…",
    recoveryReady: "Your private recovery link is ready. Keep it somewhere safe.",
    linkCopied: "Recovery link copied.",
    copyManual: "Copy the recovery link manually from the field below.",
    saveSouvenir: "📜 Save My Tour Souvenir",
    emailRecap: "✉️ Email Me My Recap",
    resetConfirm: "Are you sure? Starting a new tour will reset your current itinerary and visited exhibit history.",
    resetYes: "Yes, Reset & Start New Tour",
    startNewTour: "Start a new tour",
    noExhibits: "No Exhibits Visited Yet",
    noExhibitsDesc: "Scan exhibit QR codes or explore the 3D models in the Inspection Hub to unlock souvenir recap cards!",
    visitedRecap: "Visited Exhibits Recap ({count})",
    keyInsight: "Key Insight:",
    heritage: "Heritage"
  },

  /* ── Quiz ──────────────────────────────────────────────── */
  quiz: {
    header: "Interactive Museum Quiz",
    title: "Interactive Museum Quiz",
    questionOf: "Question {current} of {total}",
    exhibit: "Exhibit: {name}",
    exhibitLabel: "Exhibit",
    correct: "🎉 Correct!",
    incorrect: "💡 Historical Fact:",
    historicalFact: "💡 Historical Fact:",
    nextQuestion: "Next Question ➔",
    viewResults: "View Quiz Results 🏆",
    completed: "Quiz Completed!",
    scoreText: "You scored {correct} out of {total} ({percent}% Mastery)",
    scoreMsg: "You scored {correct} out of {total} ({percent}% Mastery)",
    scholarTitle: "🎖️ Unlocked Title: Adwa Scholar & Heritage Master",
    quizComplete: "📜 Quiz Complete — Review Badges on Memory Deck",
    completeTitle: "📜 Quiz Complete — Review Badges on Memory Deck",
    performanceNote: "Your performance has been evaluated. Digital badges on your Memory Deck have been updated!",
    badgesUpdated: "Your performance has been evaluated. Digital badges on your Memory Deck have been updated!",
    retake: "Retake Quiz",
    backToMemory: "Back to Memory Deck",
    backToMemoryDeck: "Back to Memory Deck",
    questions: {
      shotel_sword: {
        exhibitName: "Shotel Curved Sword",
        question: "What unique tactical design feature made the Shotel sword so effective at Adwa?",
        options: [
          "Its semi-circular crescent curve reached around European shields",
          "It had a double hollow groove designed for long-range throwing",
          "It was weighted with lead to break cavalry lances"
        ],
        explanation: "Highland blacksmiths forged the Shotel's dramatic curve specifically to reach over or around enemy shields in close combat."
      },
      negarit_drum: {
        exhibitName: "Negarit Royal Kettledrum",
        question: "What was the chief imperial function of the Negarit drum before battle?",
        options: [
          "To signal tactical retreat during artillery bombardments",
          "To proclaim imperial mobilization edicts and rally regional defenders",
          "To mark royal time for court scribes in imperial tents"
        ],
        explanation: "The Negarit was a sacred ceremonial kettledrum whose deep reverberations proclaimed imperial edicts across mountain valleys."
      },
      taytu_statue: {
        exhibitName: "Empress Taytu Monument",
        question: "Which critical strategic maneuver did Empress Taytu Betul execute during the campaign?",
        options: [
          "She remained in Shewa directing agricultural logistics",
          "She led 6,000 warriors to cut off the vital water supply springs at Mekelle",
          "She signed the initial Treaty of Wuchale in Rome"
        ],
        explanation: "Empress Taytu personally commanded her troops and devised the water siege of Mekelle, forcing enemy surrender before Adwa."
      },
      embilta: {
        exhibitName: "Embilta Royal Flute",
        question: "How is the traditional ceremonial Embilta instrument constructed and sounded?",
        options: [
          "Single-pitch keyless tubes crafted from bamboo or hammered brass",
          "Carved cedar wood flutes featuring intricate brass valves",
          "Woven straw pipes with leather acoustic resonators"
        ],
        explanation: "The Embilta is a keyless royal instrument produced in sets of three single-pitch tubes played in hocketing rhythm."
      },
      meleket: {
        exhibitName: "Meleket Imperial Trumpet",
        question: "When was the long straight Meleket trumpet sounded during royal marches?",
        options: [
          "To herald imperial proclamations and coordinate battlefield maneuvers",
          "Only during autumn harvest celebration feasts",
          "To signal the end of daily military drills"
        ],
        explanation: "The long straight brass/reed Meleket trumpet sounded royal arrivals and communicated battlefield orders across distances."
      }
    }
  },

  /* ── Screen 9 — Resume Tour ────────────────────────────── */
  resumeTour: {
    savedTour: "Saved tour",
    welcomeBack: "Welcome back",
    resumeVisit: "Resume your visit",
    restoring: "Restoring your saved Adwa tour…",
    restored: "Your itinerary, preferences, and tour progress are ready.",
    invalidLink: "This recovery link is incomplete. Ask for a new saved-tour link.",
    continueTour: "Continue my tour",
    startNew: "Start a new tour"
  },

  /* ── Personas ──────────────────────────────────────────── */
  personas: {
    kids: {
      label: "Explorer Kids",
      greeting: "Hey there, explorer! 🎒 Ready to discover something seriously amazing? Let's go on an adventure!"
    },
    scholar: {
      label: "History Scholar",
      greeting: "Let us examine this artifact through the lens of documented historical record. I shall provide precise context drawn from primary sources and material analysis."
    },
    royal: {
      label: "Imperial Guide",
      greeting: "I am honored to receive you, esteemed visitor. Allow me to share with you the treasures of our great empire and the legacy of those who defended this sacred land."
    }
  }
};
