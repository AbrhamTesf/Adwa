import React, { useState } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import Landing from "./components/screens/Landing.jsx";
import ItineraryPlanner from "./components/screens/ItineraryPlanner.jsx";
import LiveNavigation from "./components/screens/LiveNavigation.jsx";
import CameraScanner from "./components/screens/CameraScanner.jsx";
import InspectionHub from "./components/screens/InspectionHub.jsx";
import SensoryHub from "./components/screens/SensoryHub.jsx";
import VoiceGuideOverlay from "./components/screens/VoiceGuideOverlay.jsx";
import MemoryDeck from "./components/screens/MemoryDeck.jsx";

/**
 * Screen router — deliberately simple (no external router dep) so the
 * hackathon build stays easy for 4 parallel streams to touch without
 * merge conflicts. Swap for react-router post-hackathon if needed.
 */
const SCREENS = {
  landing: Landing,
  planner: ItineraryPlanner,
  navigation: LiveNavigation,
  scanner: CameraScanner,
  inspection: InspectionHub,
  sensory: SensoryHub,
  voiceGuide: VoiceGuideOverlay,
  memoryDeck: MemoryDeck
};

export default function App() {
  useNetworkStatus();
  const [screen, setScreen] = useState("landing");
  const ScreenComponent = SCREENS[screen] || Landing;

  return (
    <div className="min-h-screen w-full">
      <ScreenComponent navigate={setScreen} />
    </div>
  );
}
