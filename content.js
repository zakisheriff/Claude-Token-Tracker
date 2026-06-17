// Isolated-world bridge: relays real usage payloads captured by inject.js
// into extension storage, tracks a context-token estimate from visible page
// text, and mounts a small on-page widget under the chat composer showing
// live context/session/weekly usage — sourced from the same real data as
// the popup (see shared.js).

const CHARS_PER_TOKEN = 4;

window.addEventListener("__claude_token_tracker_usage__", (event) => {
  const { url, payload, capturedAt } = event.detail || {};
  if (!payload) return;
  chrome.storage.local.set({
    usagePayload: { url, payload, capturedAt },
  });
});

function estimateContextTokens() {
  const root =
    document.querySelector('[role="main"]') ||
    document.querySelector("main") ||
    document.body;
  const text = root ? root.innerText || "" : "";
  return Math.round(text.length / CHARS_PER_TOKEN);
}

function publishTokenEstimate() {
  chrome.storage.local.set({
    tokenEstimate: {
      tokens: estimateContextTokens(),
      updatedAt: Date.now(),
    },
  });
}

function markActivity() {
  chrome.storage.local.set({ lastMessageTime: Date.now() });
}

// --- On-page widget -------------------------------------------------------
// claude.ai's DOM isn't a stable contract, so the composer is located with a
// best-effort heuristic (last visible editable/textarea on the page) rather
// than a fixed selector. If claude.ai changes its markup, this just fails to
// mount instead of breaking the page.

let widgetHost = null;
let widgetEls = null;

function findComposerContainer() {
  const candidates = Array.from(
    document.querySelectorAll('div[contenteditable="true"], textarea')
  ).filter((el) => el.offsetParent !== null);
  const editable = candidates[candidates.length - 1];
  if (!editable) return null;

  let el = editable;
  for (let i = 0; i < 8 && el; i++) {
    if (el.tagName === "FORM") return el;
    el = el.parentElement;
  }
  return editable.parentElement;
}

function createWidgetHost() {
  const host = document.createElement("div");
  host.id = "claude-token-tracker-widget-host";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .ctt-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
        padding: 6px 12px;
        background: #faf9f5;
        border: 1px solid #e8e6dc;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 11px;
        color: #b0aea5;
        line-height: 1.4;
        flex-wrap: wrap;
      }
      .ctt-item { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
      .ctt-label { color: #b0aea5; }
      .ctt-value { font-weight: 600; color: #141413; }
      .ctt-value.warning { color: #b45309; }
      .ctt-value.critical { color: #dc2626; }
      .ctt-sep { color: #e8e6dc; }
      .ctt-reset { color: #b0aea5; font-size: 10px; }
    </style>
    <div class="ctt-bar">
      <span class="ctt-item">
        <span class="ctt-label">context</span>
        <span class="ctt-value" id="ctt-context">—</span>
      </span>
      <span class="ctt-sep">·</span>
      <span class="ctt-item">
        <span class="ctt-label">5h</span>
        <span class="ctt-value" id="ctt-session">—</span>
        <span class="ctt-reset" id="ctt-session-reset"></span>
      </span>
      <span class="ctt-sep">·</span>
      <span class="ctt-item">
        <span class="ctt-label">7d</span>
        <span class="ctt-value" id="ctt-weekly">—</span>
        <span class="ctt-reset" id="ctt-weekly-reset"></span>
      </span>
    </div>
  `;
  return {
    host,
    els: {
      context: shadow.getElementById("ctt-context"),
      session: shadow.getElementById("ctt-session"),
      sessionReset: shadow.getElementById("ctt-session-reset"),
      weekly: shadow.getElementById("ctt-weekly"),
      weeklyReset: shadow.getElementById("ctt-weekly-reset"),
    },
  };
}

function classifyValue(el, percent) {
  el.classList.remove("warning", "critical");
  if (percent === null) return;
  if (percent >= 90) el.classList.add("critical");
  else if (percent >= 75) el.classList.add("warning");
}

function refreshWidget() {
  if (!widgetEls) return;
  chrome.storage.local.get(
    ["tokenEstimate", "usagePayload", "lastMessageTime"],
    (result) => {
      if (!widgetEls) return;
      const usage = cttReadUsage(result);

      widgetEls.context.textContent = `${usage.tokens.toLocaleString()} (${usage.tokenPct}%)`;
      classifyValue(widgetEls.context, usage.tokenPct);

      widgetEls.session.textContent = usage.sessionPct !== null ? usage.sessionPct + "%" : "—";
      widgetEls.sessionReset.textContent = usage.sessionReset || "";
      classifyValue(widgetEls.session, usage.sessionPct);

      widgetEls.weekly.textContent = usage.weeklyPct !== null ? usage.weeklyPct + "%" : "—";
      widgetEls.weeklyReset.textContent = usage.weeklyReset || "";
      classifyValue(widgetEls.weekly, usage.weeklyPct);
    }
  );
}

function ensureWidgetMounted() {
  if (widgetHost && widgetHost.isConnected) return;
  const container = findComposerContainer();
  if (!container || !container.parentElement) return;

  if (!widgetHost) {
    const created = createWidgetHost();
    widgetHost = created.host;
    widgetEls = created.els;
  }
  container.insertAdjacentElement("afterend", widgetHost);
  refreshWidget();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") refreshWidget();
});

let debounceHandle = null;
function scheduleUpdate() {
  clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => {
    publishTokenEstimate();
    ensureWidgetMounted();
  }, 500);
}

function startObserving() {
  const observer = new MutationObserver(() => {
    scheduleUpdate();
    markActivity();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  publishTokenEstimate();
  ensureWidgetMounted();
  setInterval(ensureWidgetMounted, 2000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserving);
} else {
  startObserving();
}
