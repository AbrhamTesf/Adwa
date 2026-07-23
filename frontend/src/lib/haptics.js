/**
 * navigator.vibrate() wrapper with a visual-pulse fallback for
 * platforms without haptics support (iOS Safari).
 */
export function pulse(patternMs = 40, onNoSupport) {
  if (navigator.vibrate) {
    navigator.vibrate(patternMs);
  } else if (onNoSupport) {
    onNoSupport(); // caller triggers a CSS pulse animation instead
  }
}
