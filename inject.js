// Runs in the page's own JS context (MAIN world) on claude.ai.
// Captures real usage data from Anthropic API responses including token counts,
// rate limits, and quotas. Observes fetch/XHR to detect usage telemetry.

(function () {
  const USAGE_KEY_HINTS = [
    "five_hour", "seven_day", "utilization", "resets_at", "reset_at",
    "remaining", "rate_limit", "ratelimit", "usage", "quota", "message_limit",
    "input_tokens", "output_tokens", "cache", "tokens_used",
  ];

  function extractTokenCount(obj, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 5) return null;
    // Look for input/output token counts
    for (const key of ["input_tokens", "output_tokens", "tokens_used", "total_tokens"]) {
      if (typeof obj[key] === "number") return obj[key];
    }
    // Recursively search in nested objects
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === "object") {
        const found = extractTokenCount(val, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function looksLikeUsagePayload(obj, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 4) return false;
    for (const key of Object.keys(obj)) {
      const lower = key.toLowerCase();
      if (USAGE_KEY_HINTS.some((hint) => lower.includes(hint))) return true;
      const value = obj[key];
      if (value && typeof value === "object") {
        if (looksLikeUsagePayload(value, depth + 1)) return true;
      }
    }
    return false;
  }

  function emit(url, payload) {
    window.dispatchEvent(
      new CustomEvent("__claude_token_tracker_usage__", {
        detail: { url, payload, capturedAt: Date.now() },
      })
    );
  }

  function tryHandleJson(url, text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    if (looksLikeUsagePayload(data)) {
      emit(url, data);
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        response
          .clone()
          .text()
          .then((text) => tryHandleJson(url, text))
          .catch(() => {});
      }
    } catch {
      // never let observation break the page's real request
    }
    return response;
  };

  const OriginalXHR = window.XMLHttpRequest;
  function PatchedXHR() {
    const xhr = new OriginalXHR();
    let url = "";
    const originalOpen = xhr.open;
    xhr.open = function (method, openUrl, ...rest) {
      url = openUrl;
      return originalOpen.call(this, method, openUrl, ...rest);
    };
    xhr.addEventListener("load", () => {
      try {
        const contentType = xhr.getResponseHeader("content-type") || "";
        if (contentType.includes("application/json")) {
          tryHandleJson(url, xhr.responseText);
        }
      } catch {
        // ignore
      }
    });
    return xhr;
  }
  PatchedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;
})();
