/**
 * Amharic locale — complete UI string catalog for Adwa Lens.
 * Mirrors the structure of en.js.
 */
export default {
  /* ── Common / shared ───────────────────────────────────── */
  common: {
    back: "ተመለስ",
    next: "ቀጣይ",
    send: "ላክ",
    copy: "ቅዳ",
    cancel: "ሰርዝ",
    close: "ዝጋ",
    retry: "ድገም",
    loading: "በመጫን ላይ…",
    error: "ስህተት",
    adwaLens: "አድዋ ሌንስ",
    yes: "አዎ",
    no: "አይ"
  },

  /* ── Screen 1 — Landing ────────────────────────────────── */
  landing: {
    badge: "የአድዋ ድል ምዕተ ዓመት መታሰቢያ",
    tagline: "ሙዚየምዎ፣ ሕያው ሆኖ ቀረበ።",
    startTour: "ጉብኝቴን ጀምር",
    ticketQR: "የትኬት QR አለኝ",
    selectLanguage: "ቋንቋ ይምረጡ / Select Language",
    modal: {
      title: "አነቃቂ ልምድ ይክፈቱ",
      description: "የ3D ቅርሶች ቅኝት እና የእውነተኛ ጊዜ ድምፅ መሪ መልሶችን ለማግኘት፣ አድዋ ሌንስ የመሣሪያ ፈቃዶችን ይፈልጋል።",
      cameraAccess: "የካሜራ ፈቃድ",
      cameraDesc: "ታሪካዊ ቅርሶችን ይቃኙ እና የ3D AR ምስሎችን ይመልከቱ",
      micAccess: "የማይክሮፎን ፈቃድ",
      micDesc: "የድምፅ AI መሪዎን ጥያቄዎችን በነፃነት ይጠይቁ",
      grantAccess: "ፈቃድ ስጥ እና ቀጥል",
      requestingAccess: "ፈቃድ በመጠየቅ ላይ...",
      skipPermissions: "ያለ ፈቃድ ቀጥል"
    }
  },

  /* ── Screen 2 — Itinerary Planner ──────────────────────── */
  planner: {
    title: "ጉብኝትዎን ያቅዱ",
    stepOf: "ደረጃ {step} ከ {total}",
    steps: {
      duration: { title: "ጊዜ ይምረጡ", subtitle: "ዛሬ ምን ያህል ጊዜ አለዎት?" },
      interests: { title: "ፍላጎቶችን ይምረጡ", subtitle: "ቢያንስ 1 ታሪካዊ ጭብጥ ይምረጡ" },
      party: { title: "የቡድን ዓይነት", subtitle: "የAI ድምፅ መሪውን ለቡድንዎ ያዘጋጁ" },
      accessibility: { title: "ተደራሽነት እና መጨናነቅ", subtitle: "የመንገድ ምርጫዎችን ያዘጋጁ" }
    },
    time: {
      "20min": "20 ደቂቃ", "20sub": "ፈጣን ጉብኝት",
      "45min": "45 ደቂቃ", "45sub": "መደበኛ ጉብኝት",
      "2hrs": "2 ሰዓት", "2sub": "ጥልቅ ጉብኝት",
      noLimit: "ወሰን የለውም", noLimitSub: "ሙሉ ቀን"
    },
    interests: {
      warStrategy: "የጦር ስትራቴጂ", warStrategyDesc: "የታክቲክ ካርታዎች፣ የጦር መስመሮች እና መሣሪያዎች",
      metallurgy: "የብረት ጥበብ", metallurgyDesc: "የሾተል ጎራዴዎች እና የጥስ የእጅ ጥበብ",
      royalHistory: "የንጉሣውያን ታሪክ", royalHistoryDesc: "ዳግማዊ አፄ ምኒልክ እና እቴጌ ጣይቱ",
      musicCulture: "ሙዚቃ እና ባህል", musicCultureDesc: "የነጋሪት ጦር ከበሮ፣ እምቢልታ እና መለከት"
    },
    party: {
      individual: "ነጠላ ጎብኝ", individualDesc: "የተመጣጠነ ታሪካዊ ጥልቀት እና በራስ ፍጥነት",
      family: "ቤተሰብ ከልጆች ጋር", familyDesc: "አስደሳች ታሪኮች፣ ለልጆች ተስማሚ AI እና ጥያቄዎች",
      scholar: "ታሪክ ተመራማሪ", scholarDesc: "ጥልቅ የሰነድ መረጃዎች፣ ዋና ምንጮች እና ታክቲካዊ ትንተና"
    },
    accessibleRoutes: "ተደራሽ መንገዶች ብቻ",
    accessibleRoutesDesc: "ለዊልቼር እና ሊፍት ተስማሚ መንገዶች",
    crowdFeed: "የቀጥታ የህዝብ ብዛት መረጃ",
    crowdFeedDesc: "አድዋ ሌንስ የተጨናነቁ አዳራሾችን ለማስቀረት እና ጊዜዎን በአግባቡ ለመጠቀም መንገድዎን በየጊዜው ይቀይራል።",
    crowdActive: "የእውነተኛ ጊዜ የህዝብ ቁጥጥር ንቁ ነው",
    selectAtLeast1: "እባክዎን ለመቀጠል ቢያንስ 1 ጭብጥ ይምረጡ።",
    nextStep: "ቀጣይ ደረጃ →",
    backBtn: "← ተመለስ",
    generateItinerary: "መንገድ ፍጠር",
    generatingRoute: "መንገድ በመፍጠር ላይ...",
    customTour: "የተዘጋጀልዎት ጉብኝት",
    editPreferences: "✏️ ምርጫዎችን አዘጋጅ",
    aiOptimized: "በጊዜዎ ({budget}) እና በሙዚየሙ የህዝብ ብዛት ላይ የተመሠረተ የAI መንገድ።",
    liveCrowdFeed: "የሙዚየሙ የቀጥታ ህዝብ ሁኔታ:",
    lowCongestion: "ዝቅተኛ ጭናቅ (18% አቅም)",
    minDwell: "~{min} ደቂቃ ቆይታ",
    startWalking: "የእግር ጉዞ ጀምር"
  },

  /* ── Screen 3 — Live Navigation ────────────────────────── */
  navigation: {
    title: "ቀጥታ መሪ",
    stopOf: "ማቆሚያ {current} ከ {total}",
    accessibleRoute: " · ተደራሽ መንገድ",
    checkpoint: "የፍተሻ ሁኔታ",
    noRoute: "ገና ምንም መንገድ የለም",
    noRouteDesc: "በቅድሚያ ጉብኝትዎን ያቅዱ እና አድዋ ሌንስ በሙዚየሙ ውስጥ የእግር ጉዞ መንገድ ያዘጋጃል።",
    planMyTour: "ጉብኝቴን ላቅድ",
    youAreHere: "እርስዎ እዚህ አሉ።",
    finalStop: "መጨረሻ ማቆሚያ",
    thenWalkTo: "ከዚያ ወደዚህ ይሂዱ",
    viaElevator: " በሊፍቱ በኩል",
    scanExhibit: "ይህን ቅርፅ ይቃኙ",
    finishTour: "እዚህ ደርሻለሁ — ጉብኝት ጨርስ",
    checkIn: "እዚህ ደርሻለሁ — መዝግብ እና ቀጥል",
    checkedIn: "በ{name} ተመዝግበዋል። ቀጣይ: {next}።",
    checkedInFinal: "በ{name} ተመዝግበዋል። ይህ የመጨረሻ ማቆሚያዎ ነበር።",
    reroute: "በ{name} ያለውን ጭናቅ ለማስቀረት መንገድ ቀይር",
    rerouted: "መንገድ ተቀይሯል — {name} ወደ መጨረሻ ተዛውሯል።",
    density: {
      clear: "ነፃ",
      busy: "መካከለኛ",
      congested: "የተጨናነቀ"
    }
  },

  /* ── Screen 4 — Camera Scanner ─────────────────────────── */
  scanner: {
    title: "አድዋ ሌንስ AI ካሜራ ቅኝት",
    positionExhibit: "ቅርሱን በክፈፉ ውስጥ ያድርጉት",
    alignAndTap: "ቅርሱን በክፈፉ ውስጥ አስተካክለው ቅኝት ይጫኑ",
    analyzing: "በGemini AI ቅርሱን በመመርመር ላይ...",
    tapToScan: "ፎቶ ለማንሳት እና ለመቃኘት ቁልፉን ይጫኑ",
    scanQR: "በምትኩ QR ኮድ ይቃኙ →",
    matchFound: "ተገኝቷል ({confidence}%)",
    explore3D: "ቅርሱን በ3D ይመልከቱ →",
    rescan: "እንደገና ቃኝ",
    hints: {
      more_light: "ተጨማሪ ብርሃን ይጠቀሙ",
      move_closer: "ወደ ቅርሱ ቀረብ ይበሉ",
      hold_steady: "ካሜራውን አረጋግተው ይያዙ"
    },
    errors: {
      NotAllowedError: "ለዚህ ድረ-ገፅ የካሜራ ፈቃድ ተከልክሏል። በአሳሽዎ መቼት ፈቃድ ይስጡ እና ገጹን ያድሱ።",
      SecurityError: "የካሜራ ፈቃድ ደህንነቱ የተጠበቀ (https) ግንኙነት ይፈልጋል።",
      NotFoundError: "በዚህ መሣሪያ ላይ ምንም ካሜራ አልተገኘም።",
      NotReadableError: "ሌላ መተግበሪያ ካሜራውን በመጠቀም ላይ ነው። እባክዎን ዘግተው ድገሙ።",
      OverconstrainedError: "በዚህ መሣሪያ ላይ የኋላ ካሜራ የለም።",
      AbortError: "ካሜራው ባልተጠበቀ ሁኔታ ቆሟል። እንደገና ለመሞከር ገጹን ያድሱ።",
      fallback: "የካሜራ ምስል ማግኘት አልተቻለም። እባክዎን ፈቃዶችን ያረጋግጡ።",
      darkFrame: "የተነሳው ምስል በጣም ጨለማ ነው። እባክዎን ቅርሱን በግልፅ ያሳይ።",
      rateLimit: "የGemini API ገደብ ደርሷል። በጥቂት አፍታዎች ውስጥ እንደገና ይሞክራል።",
      analyzeFailed: "ምስሉን መመርመር አልተቻለም።",
      lowConfidence: "ቅርሱ በከፍተኛ እርግጠኝነት አልተለየም። እባክዎን ቦታውን አስተካክለው ይሞክሩ።",
      network: "ከቪዥን አገልጋዩ ጋር የመገናኘት አውታረ መረብ ስህተት።"
    }
  },

  /* ── Screen 5 — Inspection Hub ─────────────────────────── */
  inspection: {
    title: "የ3D ምርመራ",
    tabs: {
      material: "ቁሳቁስ",
      craft: "የእጅ ጥበብ እና ዘዴ",
      usage: "አጠቃቀም እና ታሪካዊ ቦታ"
    },
    backToTourMap: "ወደ ጉብኝት ካርታ ተመለስ",
    backToScanner: "ወደ ካሜራ ቅኝት ተመለስ",
    finishInspection: "ምርመራ ጨርስ",
    preparing: "ቅርሱን በማዘጋጀት ላይ…",
    unavailable: "ቅርሱ አይገኝም",
    returnToScanner: "ወደ ካሜራ ቅኝት ተመለስ",
    loading3D: "የ3D ቅርፅ ሞዴል በመጫን ላይ…",
    selectHotspot: "ታሪካዊ ዝርዝሮችን ለመመርመር በቅርሱ ላይ የሚያበራውን ነጥብ ይጫኑ።",
    explodedView: "የተነጣጣለ እይታ (Exploded View)",
    resetCamera: "ካሜራ ቦታ መልስ",
    storyTranscript: "የታሪክ ጽሑፍ",
    hideTranscript: "ጽሑፍ ደብቅ ▲",
    showTranscript: "ጽሑፍ አሳይ ▼",
    generateExplanation: "ጥልቅ የAI ታሪካዊ ትንተና በማፍለቅ ላይ…",
    pauseVoice: "⏸️ ድምፅ አቁም",
    replayAudio: "🔊 ድምፅ ድገም",
    askQuestion: "ስለዚህ ነጥብ ጥያቄ ጠይቅ…",
    webglFallback: "የ3D WebGL ቅድመ-እይታ ተተኪ ንቁ ነው። አሁንም ታሪካዊ ነጥቦችን መመርመር እና የAI ድምፅ መሪውን መጠየቅ ይችላሉ።",
    retry3D: "የ3D ምስል ድገም",
    voiceGuide: "የድምፅ መሪ",
    sensoryMode: "የስሜት ሁኔታ (Sensory Mode)",
    hotspots: {
      albaso_braids: {
        title: "የአልባሶ የንጉሣውያን የቁንጥር አሰራር",
        tag: "የእጅ ጥበብ እና ባህል",
        description: "የኢትዮጵያ ንጉሣውያን ክብር እና መሪነትን የሚያሳይ ባህላዊ የቁንጥር አሰራር።"
      },
      kaba_dress: {
        title: "የሥርዓት ካባ እና ቀሚስ",
        tag: "ቁሳቁስ እና ጥበብ",
        description: "ከባድ የንጉሣውያን ካባ ከደረት ቁልፍ እና ያጌጠ የጨርቅ ሜዳሊያ ጋር።"
      },
      royal_sword: {
        title: "የንጉሥ የታጠቀ ጎራዴ",
        tag: "ወታደራዊ መሪነት",
        description: "እቴጌ ጣይቱ በአድዋ ጦርነት ያሳዩትን ወታደራዊ አዛዥነት እና የሰራዊት ስምሪት ያሳያል።"
      },
      command_gesture: {
        title: "የስትራቴጂያዊ መሪነት ምልክት",
        tag: "የስትራቴጂ ሊቅ",
        description: "በአድዋ ጦርነት ወቅት የነበራቸውን የስትራቴጂክ የበላይነት የሚያሳይ የዘረጋ እጅ።"
      }
    },
    explodedParts: {
      curvedBlade: "ጎበጥ ያለ ስለት",
      curvedBladeDesc: "ለፈረሰኛ ውጊያ የተሰራ ከፍተኛ ካርቦን ያለው ስለት።",
      hiltGuard: "የእጅ መያዣ እና ጥበቃ",
      hiltGuardDesc: "በወርቅ ያጌጠ ከቀንድ የተሰራ የእጅ መያዣ።",
      leatherSheath: "የቆዳ አፎት",
      leatherSheathDesc: "በናስ ያጌጠ ባህላዊ የቆዳ አፎት።"
    }
  },

  /* ── Screen 6 — Sensory Hub ────────────────────────────── */
  sensory: {
    header: "የስሜት ተሳትፎ",
    back: "ተመለስ",
    blowToPlay: "እምቢልታውን ንፋ",
    stopMic: "ማይክ አቁም",
    blow: "ንፋ",
    rimTap: "ጠርዙን ምታ",
    strikeDrum: "ከበሮውን ምታ",
    breathIntensity: "የእንፋሎት ኃይል",
    micLive: "ማይክ ንቁ ነው",
    micOff: "ማይክ አጥፍቷል",
    blowholeEnabled: "የመነፊያ ነጥብ ክፍት ነው",
    loadingMesh: "የመሣሪያውን 3D ሞዴል በመጫን ላይ…",
    meshTapEnabled: "በቀጥታ ሞዴሉን መታት ይቻላል",
    negarit: {
      title: "ነጋሪት የንጉሥ ከበሮ",
      hint: "የ3D ከበሮውን ቆዳ ይጫኑ ወይም በምናባዊ መዶሻው ይመቱ።",
      deepBass: "ጥልቅ የሥርዓት ድምፅ",
      brightRim: "ቀልጣፋ የጠርዝ ድምፅ",
      chooseStrike: "ለመጀመር ምት ይምረጡ"
    },
    embilta: {
      title: "እምቢልታ የሥርዓት ዋሽንት",
      hint: "ዋሽንቱን ለማሰማት ወደ ማይክሮፎኑ ይንፉ ወይም ነጥቡን ይጫኑ።",
      callLabel: "የቀርከሃ ድምፅ"
    },
    meleket: {
      title: "መለከት የንጉሥ ጥሩምባ",
      hint: "ጥሩምባውን ለማሰማት ወደ ማይክሮፎኑ ይንፉ ወይም አፉን ይጫኑ።",
      callLabel: "የሦስት ድምፅ ጥሪ"
    },
    mic: {
      audioUnavailable: "ድምፅ በዚህ አሳሽ አይገኝም፤ የእንፋሎት ምስሉ ግን ይሰራል።",
      denied: "ማይክሮፎን ተከለከለ — መሣሪያውን ለማሰማት 'ንፋ' የሚለውን ቁልፍ ይጠቀሙ።",
      unsupported: "የማይክ እንፋሎት ቅኝት በዚህ መሳሪያ አይገኝም፤ 'ንፋ' የሚለውን ቁልፍ ይጠቀሙ።",
      requesting: "የማይክሮፎን ፈቃድ በመጠበቅ ላይ…",
      blowing: "እንፋሎት ተገኝቷል — አየር በመሣሪያው ውስጥ ያልፋል።",
      listening: "በማዳመጥ ላይ — በቋሚነት ወደ ማይክሮፎኑ ይንፉ።",
      audioUnavailableDrum: "ድምፅ በዚህ አሳሽ አይገኝም፤ የሞገድ ምስሉ ግን ይሰራል።"
    }
  },

  /* ── Screen 7 — Voice Guide ────────────────────────────── */
  voiceGuide: {
    header: "የAI ድምፅ መሪ እና RAG",
    selectPersona: "የመሪ ገፀ-ባህሪ ይምረጡ",
    status: {
      listening: "🎙️ በማዳመጥ ላይ…",
      thinking: "🧠 በማሰብ ላይ…",
      speaking: "🔊 በመናገር ላይ…",
      ready: "✦ ዝግጁ"
    },
    defaultPrompt: "ስለ እቴጌ ጣይቱ ወይም ስለ አድዋ ጦርነት ማናቸውንም ጥያቄ ይጠይቁኝ።",
    holdToSpeak: "ለመናገር ተጭነው ይያዙ • ለመላክ ይልቀቁ",
    typePlaceholder: "ጥያቄዎን እዚህ ይጻፉ...",
    backToInspection: "ወደ 3D ምርመራ ተመለስ"
  },

  /* ── Screen 8 — Memory Deck ────────────────────────────── */
  memoryDeck: {
    screenLabel: "ስክሪን 8 — የጉብኝት ማስታወሻ",
    title: "የአድዋ ጉብኝት ማጠቃለያዎ",
    subtitle: "የጎበኟቸውን ቅርሶች፣ ያገኙትን ባጆች እና የማስታወሻ ካርድዎን ይመልከቱ።",
    quizLabel: "FEAT-018 የፈተና ሞተር",
    quizTitle: "አነቃቂ የሙዚየም ጥያቄዎች",
    quizDesc: "ልዩ ባጆችን ለመክፈት ስለጎበኟቸው ቅርሶች እውቀትዎን ይፈትኑ!",
    takeQuiz: "ጥያቄዎችን መልስ 🏆",
    continueDevice: "በሌላ መሣሪያ ቀጥል",
    continueDeviceDesc: "ለመንገድዎ፣ ለጎበኟቸው ቅርሶች እና ለተቀበሏቸው ባጆች የግል መልሶ ማግኛ ሊንክ ይፍጠሩ።",
    saveTour: "የጉብኝት ሊንኬን አስቀምጥ",
    savingTour: "ጉብኝትዎን በማስቀመጥ ላይ…",
    recoveryReady: "የግል መልሶ ማግኛ ሊንክዎ ዝግጁ ነው። በጥንቃቄ ያስቀምጡት።",
    linkCopied: "መልሶ ማግኛ ሊንኩ ተቀድቷል።",
    copyManual: "ከታች ካለው ሳጥን ሊንኩን በቀጥታ ይቅዱ።",
    saveSouvenir: "📜 የማስታወሻ ካርዴን አስቀምጥ",
    emailRecap: "✉️ ማጠቃለያውን በኢሜይል ላክልኝ",
    resetConfirm: "እርግጠኛ ነዎት? አዲስ ጉብኝት መጀመር የአሁኑን መንገድ እና የጎበኟቸውን ቅርሶች ታሪክ ያጠፋዋል።",
    resetYes: "አዎ፣ አጥፋ እና አዲስ ጉብኝት ጀምር",
    startNewTour: "አዲስ ጉብኝት ጀምር",
    noExhibits: "ገና ምንም ቅርሶች አልተጎበኙም",
    noExhibitsDesc: "የማስታወሻ ካርዶችን ለመክፈት የQR ኮዶችን ይቃኙ ወይም በ3D ምርመራ ማዕከል ውስጥ ቅርሶችን ይመልከቱ!",
    visitedRecap: "የጎበኟቸው ቅርሶች ማጠቃለያ ({count})",
    keyInsight: "ዋና መረጃ:",
    heritage: "ቅርሶች"
  },

  /* ── Quiz ──────────────────────────────────────────────── */
  quiz: {
    header: "አነቃቂ የሙዚየም ጥያቄዎች",
    title: "አነቃቂ የሙዚየም ጥያቄዎች",
    questionOf: "ጥያቄ {current} ከ {total}",
    exhibit: "ቅርፅ: {name}",
    exhibitLabel: "ቅርፅ",
    correct: "🎉 ትክክል!",
    incorrect: "💡 ታሪካዊ እውነታ:",
    historicalFact: "💡 ታሪካዊ እውነታ:",
    nextQuestion: "ቀጣይ ጥያቄ ➔",
    viewResults: "የፈተና ውጤት ይመልከቱ 🏆",
    completed: "ፈተናው ተጠናቋል!",
    scoreText: "ከ {total} ውስጥ {correct} አግኝተዋል ({percent}% ስኬት)",
    scoreMsg: "ከ {total} ውስጥ {correct} አግኝተዋል ({percent}% ስኬት)",
    scholarTitle: "🎖️ የተከፈተ ማዕረግ: የአድዋ ተመራማሪ እና የታሪክ ባለሙያ",
    quizComplete: "📜 ፈተናው ተጠናቋል — ባጆችን በማስታወሻ ገጽ ላይ ይመልከቱ",
    completeTitle: "📜 ፈተናው ተጠናቋል — ባጆችን በማስታወሻ ገጽ ላይ ይመልከቱ",
    performanceNote: "ውጤትዎ ተገምግሟል። በማስታወሻ ገጽዎ ላይ ያሉት ዲጂታል ባጆች ተዘምነዋል!",
    badgesUpdated: "ውጤትዎ ተገምግሟል። በማስታወሻ ገጽዎ ላይ ያሉት ዲጂታል ባጆች ተዘምነዋል!",
    retake: "እንደገና ፈተን",
    backToMemory: "ወደ ማስታወሻ ገፅ ተመለስ",
    backToMemoryDeck: "ወደ ማስታወሻ ገፅ ተመለስ",
    questions: {
      shotel_sword: {
        exhibitName: "ሾተል ጎራዴ",
        question: "የሾተል ጎራዴ በአድዋ ጦርነት ወቅት ውጤታማ እንዲሆን ያደረገው ልዩ ታክቲካዊ ቅርጹ ምንድን ነው?",
        options: [
          "ከፊል ክብ ቅርፁ የአውሮፓውያንን መከታ ዙሪያ አልፎ የመውጋት አቅሙ",
          "ለሩቅ ውርወራ የተሰራ ሁለት ቀዳዳ ያለው ስለት በመሆኑ",
          "የፈረሰኞችን ጦር ለመስበር በኢየሩሳሌም ብረት በመሰራቱ"
        ],
        explanation: "የሀበሻ አንጥረኞች የሾተልን ጎበጥ ያለ ቅርፅ ያዘጋጁት በቅርብ ውጊያ የጠላትን መከታ ዞሮ እንዲወጋ በማሰብ ነበር።"
      },
      negarit_drum: {
        exhibitName: "ነጋሪት የንጉሥ ከበሮ",
        question: "ከጦርነት በፊት የነጋሪት ከበሮ ዋና ንጉሣዊ አገልግሎት ምን ነበር?",
        options: [
          "በመድፍ ድብደባ ወቅት ማቅማማትን ለማሳወቅ",
          "የንጉሠ ነገሥቱን የክተት አዋጅ ለማወጅ እና የየአካባቢውን ተዋጊዎች ለመጥራት",
          "በንጉሣውያን ድንኳን ውስጥ ሰዓት ለመቁጠር"
        ],
        explanation: "ነጋሪት የንጉሠ ነገሥቱን ክተት አዋጅ በተራሮች እና ሸለቆዎች መካከል የሚያስተጋባ የተቀደሰ የሥርዓት ከበሮ ነበር።"
      },
      taytu_statue: {
        exhibitName: "እቴጌ ጣይቱ ብጡል ሀውልት",
        question: "እቴጌ ጣይቱ ብጡል በዘመቻው ወቅት የፈጸሙት ዋና ስትራቴጂያዊ ወታደራዊ እርምጃ የትኛው ነው?",
        options: [
          "ሸዋ ቀርተው እርሻና ስንቅ ማዘጋጀት",
          "6,000 ተዋጊዎችን በመምራት በመቀሌ የሚገኘውን የጠላት የውሃ ምንጭ መዝጋት",
          "የውቻሌ ውልን በሮም መፈረም"
        ],
        explanation: "እቴጌ ጣይቱ በራሳቸው ጦር በመምራት የመቀሌን የውሃ ምንጭ በመከበብ ጠላት ከአድዋ ጦርነት በፊት እጁን እንዲሰጥ አድርገዋል።"
      },
      embilta: {
        exhibitName: "እምቢልታ የሥርዓት ዋሽንት",
        question: "ባህላዊው የሥርዓት እምቢልታ መሣሪያ እንዴት ይሰራሉ እንዲሁም ይነፋሉ?",
        options: [
          "ከቀርከሃ የሚሰሩ ነጠላ-ድምፅ ያላቸው በሦስት ቡድን ተቀናጅተው የሚነፉ ዋሽንቶች",
          "ከጽድ እንጨት ተቀርፀው የናስ ቁልፍ የተገጠመላቸው ዋሽንቶች",
          "ከሳር ተጎንጉነው በቆዳ የሚያበሩ ዋሽንቶች"
        ],
        explanation: "እምቢልታ በሦስት የተለያዩ ድምፆች ተቀናጅተው በአንድ ላይ የሚነፉ ቁልፍ የሌላቸው ባህላዊ ዋሽንቶች ናቸው።"
      },
      meleket: {
        exhibitName: "መለከት የንጉሥ ጥሩምባ",
        question: "ረጅሙ የናስ መለከት ጥሩምባ በንጉሣውያን ዘመቻ ወቅት መቼ ይነፋ ነበር?",
        options: [
          "የንጉሠ ነገሥቱን አዋጅ ለማወጅ እና የጦር ሜዳ ትእዛዝ ለማስተላለፍ",
          "በመከር ወቅት በበዓላት ጊዜ ብቻ",
          "የዕለት ተዕለት ልምምድ ማጠናቀቂያን ለማሳወቅ"
        ],
        explanation: "ረጅሙ መለከት የንጉሠ ነገሥቱን መምጣት ለማበሰር እና በጦር ሜዳ የሩቅ መልእክቶችን ለማስተላለፍ ያገለግል ነበር።"
      }
    }
  },

  /* ── Screen 9 — Resume Tour ────────────────────────────── */
  resumeTour: {
    savedTour: "የተቀመጠ ጉብኝት",
    welcomeBack: "እንኳን ደህና መጡ",
    resumeVisit: "ጉብኝትዎን ይቀጥሉ",
    restoring: "የተቀመጠውን የአድዋ ጉብኝትዎን በመመለስ ላይ…",
    restored: "መንገድዎ፣ ምርጫዎችዎ እና የጉብኝት ሂደትዎ ዝግጁ ናቸው።",
    invalidLink: "ይህ መልሶ ማግኛ ሊንክ የተሟላ አይደለም። አዲስ ሊንክ ይጠይቁ።",
    continueTour: "ጉብኝቴን ልቀጥል",
    startNew: "አዲስ ጉብኝት ጀምር"
  },

  /* ── Personas ──────────────────────────────────────────── */
  personas: {
    kids: {
      label: "ተመራማሪ ልጆች",
      greeting: "ሰላም ተመራማሪ! 🎒 በጣም አስደናቂ ነገር ለማወቅ ዝግጁ ነህ? ና አብረን ጉዞ እንጀምር!"
    },
    scholar: {
      label: "ታሪክ ተመራማሪ",
      greeting: "ይህንን ቅርፅ በጽሑፍ በሰፈሩ ታሪካዊ መረጃዎች መነፅር እንመርምረው። ከዋና ምንጮች እና ከቁሳቁስ ትንተና የተወሰደ ጥልቅ ታሪካዊ መረጃ እሰጥዎታለሁ።"
    },
    royal: {
      label: "የንጉሣውያን መሪ",
      greeting: "የተከበሩ እንግዳ፣ እንኳን ደህና መጡ። የዓለማችንን ታላቅ መንግሥት ሀብቶች እና ይህችን የተቀደሰች ምድር የጠበቁትን ጀግኖች ታሪክ እንዳካፍልዎ ይፍቀዱልኝ።"
    }
  }
};
