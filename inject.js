// Runs in the page's own JS context (MAIN world) on claude.ai.
// Anthropic does not publish a stable usage API for third parties, so instead
// of guessing an endpoint, this observes the real network responses the
// claude.ai app itself loads and picks out anything that looks like
// usage/rate-limit telemetry. If Anthropic changes their internal API shape,
// this degrades to "no data found" rather than breaking.

(function () {
  const USAGE_KEY_HINTS = [
    "five_hour", "seven_day", "utilization", "resets_at", "reset_at",
    "remaining", "rate_limit", "ratelimit", "usage", "quota", "message_limit",
  ];

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
    if (looksLikeUsagePayload(data)) emit(url, data);
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
