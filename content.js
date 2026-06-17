// Isolated-world bridge: relays real usage payloads captured by inject.js
// into extension storage, and maintains a best-effort local token estimate
// from visible page text (claude.ai's DOM structure isn't a stable contract,
// so this is a heuristic, not a precise count).

const CHARS_PER_TOKEN = 4;

window.addEventListener("__claude_token_tracker_usage__", (event) => {
  const { url, payload, capturedAt } = event.detail || {};
  if (!payload) return;
  chrome.storage.local.set({
    usagePayload: { url, payload, capturedAt },
  });
});

function estimateVisibleTokens() {
  const root =
    document.querySelector('[role="main"]') ||
    document.querySelector("main") ||
    document.body;
  const text = root ? root.innerText || "" : "";
  return Math.round(text.length / CHARS_PER_TOKEN);
}

function publishEstimate() {
  chrome.storage.local.set({
    tokenEstimate: {
      tokens: estimateVisibleTokens(),
      updatedAt: Date.now(),
    },
  });
}

function markActivity() {
  chrome.storage.local.set({ lastMessageTime: Date.now() });
}

let debounceHandle = null;
function scheduleEstimate() {
  clearTimeout(debounceHandle);
  debounceHandle = setTimeout(publishEstimate, 500);
}

function startObserving() {
  const target = document.body;
  const observer = new MutationObserver(() => {
    scheduleEstimate();
    markActivity();
  });
  observer.observe(target, { childList: true, subtree: true, characterData: true });
  publishEstimate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserving);
} else {
  startObserving();
}
