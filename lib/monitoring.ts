/**
 * Sentry / Error Monitoring Integration Wrapper for MusicFlow
 */

export function captureException(error: Error | unknown, context?: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    console.error("[MusicFlow Error Monitor]", error, context || "");

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("musicflow:error", {
          detail: { error: String(error), context },
        })
      );
    }
  } catch (err) {
    console.warn("Failed to capture exception:", err);
  }
}
