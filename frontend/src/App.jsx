import { useEffect, useState } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getRecoveryTokenFromHash, startSessionSync } from "./lib/sessionSync";
import { startAnalytics, trackEvent } from "./lib/analytics";
import Landing from "./components/screens/Landing.jsx";
import ItineraryPlanner from "./components/screens/ItineraryPlanner.jsx";
import LiveNavigation from "./components/screens/LiveNavigation.jsx";
import CameraScanner from "./components/screens/CameraScanner.jsx";
import InspectionHub from "./components/screens/InspectionHub.jsx";
import SensoryHub from "./components/screens/SensoryHub.jsx";
import VoiceGuideOverlay from "./components/screens/VoiceGuideOverlay.jsx";
import MemoryDeck from "./components/screens/MemoryDeck.jsx";
import ResumeTour from "./components/screens/ResumeTour.jsx";
import AuthProfileMenu from "./components/auth/AuthProfileMenu.jsx";
import ContentManager from "./components/admin/ContentManager.jsx";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard.jsx";
import StaffManager from "./components/admin/StaffManager.jsx";
import LanguageToggle from "./components/ui/LanguageToggle.jsx";

const SCREENS = {
  landing: Landing,
  planner: ItineraryPlanner,
  navigation: LiveNavigation,
  scanner: CameraScanner,
  inspection: InspectionHub,
  sensory: SensoryHub,
  voiceGuide: VoiceGuideOverlay,
  memoryDeck: MemoryDeck,
  resumeTour: ResumeTour,
  cms: ContentManager,
  analytics: AnalyticsDashboard,
  staff: StaffManager
};

export default function App() {
  useNetworkStatus();
  const recoveryToken = getRecoveryTokenFromHash();
  const [screen, setScreen] = useState(recoveryToken ? "resumeTour" : "landing");
  const ScreenComponent = SCREENS[screen] || Landing;

  const navigate = (nextScreen, options = {}) => {
    if (nextScreen === screen) return;
    if (!options.replace) {
      try {
        window.history.pushState({ screen: nextScreen }, "", `#${nextScreen}`);
      } catch {
        /* fallback for environments restricting pushState */
      }
    }
    setScreen(nextScreen);
  };

  useEffect(() => {
    try {
      window.history.replaceState({ screen }, "", `#${screen}`);
    } catch {
      /* fallback */
    }

    const handlePopState = (e) => {
      const targetScreen = e.state?.screen;
      if (targetScreen && SCREENS[targetScreen]) {
        setScreen(targetScreen);
      } else {
        // Requirement 2: Browser / Phone Back Button Guard for active tour screens
        if (["inspection", "sensory", "voiceGuide"].includes(screen)) {
          setScreen("scanner");
          try {
            window.history.pushState({ screen: "scanner" }, "", "#scanner");
          } catch {
            /* noop */
          }
        } else if (["scanner", "navigation", "planner"].includes(screen)) {
          const confirmExit = window.confirm("Exit active tour and return to main landing page?");
          if (confirmExit) {
            setScreen("landing");
          } else {
            try {
              window.history.pushState({ screen }, "", `#${screen}`);
            } catch {
              /* noop */
            }
          }
        } else {
          setScreen("landing");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen]);

  useEffect(() => {
    return startSessionSync();
  }, []);

  useEffect(() => startAnalytics(), []);

  useEffect(() => {
    trackEvent("screen_viewed", { exhibitId: screen });
  }, [screen]);

  return (
    <div className="min-h-screen w-full relative">
      <ScreenComponent navigate={navigate} recoveryToken={recoveryToken} />
      {screen === "landing" && <LanguageToggle />}
    </div>
  );
}