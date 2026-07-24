/**
 * Trigger device haptics when available and always notify the caller so a
 * visual fallback can keep the interaction perceptible on unsupported devices.
 */
export function pulse(patternMs = 40, onPulse) {
  const supported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  if (supported) navigator.vibrate(patternMs);
  onPulse?.({ supported, patternMs });
  return supported;
}