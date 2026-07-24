// Determines whether the app is running inside a Grid's iframe (a parent
// page context exists) or being visited directly (Handbook Step 4.2). This
// decides which wallet-connection path gets used.
export function isEmbeddedInGrid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin restrictions can throw when reading window.top - if we
    // can't read it, we're definitely inside a cross-origin frame.
    return true;
  }
}
