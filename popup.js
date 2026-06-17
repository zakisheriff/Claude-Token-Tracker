const els = {
  tokenCount: document.getElementById("tokenCount"),
  tokenProgress: document.getElementById("tokenProgress"),
  tokenPercentage: document.getElementById("tokenPercentage"),
  sessionUsage: document.getElementById("sessionUsage"),
  sessionProgress: document.getElementById("sessionProgress"),
  sessionReset: document.getElementById("sessionReset"),
  weeklyUsage: document.getElementById("weeklyUsage"),
  weeklyProgress: document.getElementById("weeklyProgress"),
  weeklyReset: document.getElementById("weeklyReset"),
  lastUpdated: document.getElementById("lastUpdated"),
  refreshBtn: document.getElementById("refreshBtn"),
};

document.addEventListener("DOMContentLoaded", render);
els.refreshBtn.addEventListener("click", render);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") render();
});

function setProgress(fillEl, percent) {
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  fillEl.style.width = clamped + "%";
  fillEl.classList.remove("warning", "critical");
  if (clamped >= 90) fillEl.classList.add("critical");
  else if (clamped >= 75) fillEl.classList.add("warning");
}

function render() {
  chrome.storage.local.get(
    ["tokenEstimate", "usagePayload", "lastMessageTime"],
    (result) => {
      const usage = cttReadUsage(result);

      els.tokenCount.textContent = usage.tokens.toLocaleString();
      els.tokenPercentage.textContent = usage.tokenPct + "%";
      setProgress(els.tokenProgress, usage.tokenPct);

      els.sessionUsage.textContent = usage.sessionPct !== null ? usage.sessionPct + "%" : "—";
      els.sessionReset.textContent = usage.sessionReset || "no data";
      els.weeklyUsage.textContent = usage.weeklyPct !== null ? usage.weeklyPct + "%" : "—";
      els.weeklyReset.textContent = usage.weeklyReset || "no data";

      setProgress(els.sessionProgress, usage.sessionPct);
      setProgress(els.weeklyProgress, usage.weeklyPct);

      els.lastUpdated.textContent = cttTimeAgo(usage.lastMessageTime);
    }
  );
}
