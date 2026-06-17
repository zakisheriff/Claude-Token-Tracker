const MAX_TOKENS = 200000;

const els = {
  tokenCount: document.getElementById("tokenCount"),
  tokenProgress: document.getElementById("tokenProgress"),
  tokenPercentage: document.getElementById("tokenPercentage"),
  sessionUsage: document.getElementById("sessionUsage"),
  sessionProgress: document.getElementById("sessionProgress"),
  sessionHelper: document.getElementById("sessionHelper"),
  weeklyUsage: document.getElementById("weeklyUsage"),
  weeklyProgress: document.getElementById("weeklyProgress"),
  weeklyHelper: document.getElementById("weeklyHelper"),
  warningBanner: document.getElementById("warningBanner"),
  warningText: document.getElementById("warningText"),
  lastUpdated: document.getElementById("lastUpdated"),
  refreshBtn: document.getElementById("refreshBtn"),
};

document.addEventListener("DOMContentLoaded", render);
els.refreshBtn.addEventListener("click", () => {
  els.refreshBtn.style.transform = "rotate(180deg)";
  render();
});

function findSection(obj, hint, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase().includes(hint)) return obj[key];
  }
  for (const key of Object.keys(obj)) {
    const found = findSection(obj[key], hint, depth + 1);
    if (found) return found;
  }
  return null;
}

function pctFromSection(section) {
  if (!section || typeof section !== "object") return null;
  for (const key of ["utilization", "percent_used", "used_percent"]) {
    const val = section[key];
    if (typeof val === "number") return Math.round(val <= 1 ? val * 100 : val);
  }
  if (typeof section.used === "number" && typeof section.limit === "number" && section.limit > 0) {
    return Math.round((section.used / section.limit) * 100);
  }
  return null;
}

function resetLabel(section) {
  if (!section || typeof section !== "object") return null;
  const raw = section.resets_at || section.reset_at || section.resetsAt;
  if (!raw) return null;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "resets soon";
  const hours = Math.round(diffMs / 3600000);
  if (hours < 1) return "resets in <1h";
  if (hours < 48) return `resets in ${hours}h`;
  return `resets in ${Math.round(hours / 24)}d`;
}

function setProgress(fillEl, percent) {
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  fillEl.style.width = clamped + "%";
  fillEl.classList.remove("warning", "critical");
  if (clamped >= 90) fillEl.classList.add("critical");
  else if (clamped >= 75) fillEl.classList.add("warning");
}

function timeAgo(timestamp) {
  if (!timestamp) return "No activity yet";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Active just now";
  if (diffSec < 3600) return `Active ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Active ${Math.floor(diffSec / 3600)}h ago`;
  return "Inactive";
}

function render() {
  chrome.storage.local.get(
    ["tokenEstimate", "usagePayload", "lastMessageTime"],
    (result) => {
      const tokens = result.tokenEstimate?.tokens ?? 0;
      const tokenPct = Math.min(100, Math.round((tokens / MAX_TOKENS) * 100));
      els.tokenCount.textContent = tokens.toLocaleString();
      els.tokenPercentage.textContent = tokenPct + "%";
      setProgress(els.tokenProgress, tokenPct);

      let sessionPct = null;
      let weeklyPct = null;

      const payload = result.usagePayload?.payload;
      if (payload) {
        const sessionSection = findSection(payload, "five_hour");
        const weeklySection = findSection(payload, "seven_day");
        sessionPct = pctFromSection(sessionSection);
        weeklyPct = pctFromSection(weeklySection);

        els.sessionUsage.textContent = sessionPct !== null ? sessionPct + "%" : "—";
        els.sessionHelper.textContent =
          resetLabel(sessionSection) || (sessionPct !== null ? "" : "No data observed yet");
        els.weeklyUsage.textContent = weeklyPct !== null ? weeklyPct + "%" : "—";
        els.weeklyHelper.textContent =
          resetLabel(weeklySection) || (weeklyPct !== null ? "" : "No data observed yet");
      } else {
        els.sessionUsage.textContent = "—";
        els.sessionHelper.textContent = "Open claude.ai and send a message to detect usage";
        els.weeklyUsage.textContent = "—";
        els.weeklyHelper.textContent = "Open claude.ai and send a message to detect usage";
      }

      setProgress(els.sessionProgress, sessionPct);
      setProgress(els.weeklyProgress, weeklyPct);

      const high = [tokenPct, sessionPct, weeklyPct].some((p) => p !== null && p >= 85);
      els.warningBanner.style.display = high ? "flex" : "none";
      if (high) {
        if (tokenPct >= 85) els.warningText.textContent = "Context window usage is high";
        else if (sessionPct >= 85) els.warningText.textContent = "Session usage is high";
        else els.warningText.textContent = "Weekly usage is high";
      }

      els.lastUpdated.textContent = timeAgo(result.lastMessageTime);
    }
  );
}
