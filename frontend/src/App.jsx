import React, { useEffect, useState } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getRecoveryTokenFromHash, startSessionSync } from "./lib/sessionSync";
import Landing from "./components/screens/Landing.jsx";
import ItineraryPlanner from "./components/screens/ItineraryPlanner.jsx";
import LiveNavigation from "./components/screens/LiveNavigation.jsx";
import CameraScanner from "./components/screens/CameraScanner.jsx";
import InspectionHub from "./components/screens/InspectionHub.jsx";
import SensoryHub from "./components/screens/SensoryHub.jsx";
import VoiceGuideOverlay from "./components/screens/VoiceGuideOverlay.jsx";
import MemoryDeck from "./components/screens/MemoryDeck.jsx";
import ResumeTour from "./components/screens/ResumeTour.jsx";

const SCREENS = { landing: Landing, planner: ItineraryPlanner, navigation: LiveNavigation, scanner: CameraScanner, inspection: InspectionHub, sensory: SensoryHub, voiceGuide: VoiceGuideOverlay, memoryDeck: MemoryDeck, resumeTour: ResumeTour };

export default function App() {
  useNetworkStatus();
  const recoveryToken = getRecoveryTokenFromHash();
  const [screen, setScreen] = useState(recoveryToken ? "resumeTour" : "landing");
  const ScreenComponent = SCREENS[screen] || Landing;

  useEffect(() => startSessionSync(), []);
  return <div className="min-h-screen w-full"><ScreenComponent navigate={setScreen} recoveryToken={recoveryToken} /></div>;
}