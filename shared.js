// Shared parsing helpers used by both the popup and the on-page widget,
// so the two surfaces never disagree about what a usage payload means.

const CTT_MAX_TOKENS = 200000;

function cttFindSection(obj, hint, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase().includes(hint)) return obj[key];
  }
  for (const key of Object.keys(obj)) {
    const found = cttFindSection(obj[key], hint, depth + 1);
    if (found) return found;
  }
  return null;
}

function cttPctFromSection(section) {
  if (!section || typeof section !== "object") return null;
  for (const key of ["utilization", "percent_used", "used_percent", "percentage_used"]) {
    const val = section[key];
    if (typeof val === "number") return Math.round(val <= 1 ? val * 100 : val);
  }
  if (typeof section.used === "number" && typeof section.limit === "number" && section.limit > 0) {
    return Math.round((section.used / section.limit) * 100);
  }
  if (typeof section.remaining === "number" && typeof section.limit === "number" && section.limit > 0) {
    return Math.round(((section.limit - section.remaining) / section.limit) * 100);
  }
  return null;
}

function cttResetLabel(section) {
  if (!section || typeof section !== "object") return null;
  const raw = section.resets_at || section.reset_at || section.resetsAt;
  if (!raw) return null;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "resets soon";
  const hours = Math.round(diffMs / 3600000);
  const mins = Math.round((diffMs % 3600000) / 60000);
  if (hours < 1) return `resets in ${mins}m`;
  if (hours < 24) return `resets in ${hours}h ${mins}m`;
  const days = Math.round(hours / 24);
  return `resets in ${days}d`;
}

function cttTimeAgo(timestamp) {
  if (!timestamp) return "no activity";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "active now";
  if (diffSec < 3600) return `active ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `active ${Math.floor(diffSec / 3600)}h ago`;
  return "inactive";
}

function cttReadUsage(result) {
  const tokens = result.tokenEstimate?.tokens ?? 0;
  const tokenPct = Math.min(100, Math.round((tokens / CTT_MAX_TOKENS) * 100));

  let sessionPct = null;
  let weeklyPct = null;
  let sessionReset = null;
  let weeklyReset = null;

  const payload = result.usagePayload?.payload;
  if (payload) {
    const sessionSection = cttFindSection(payload, "five_hour");
    const weeklySection = cttFindSection(payload, "seven_day");
    sessionPct = cttPctFromSection(sessionSection);
    weeklyPct = cttPctFromSection(weeklySection);
    sessionReset = cttResetLabel(sessionSection);
    weeklyReset = cttResetLabel(weeklySection);
  }

  return {
    tokens,
    tokenPct,
    sessionPct,
    weeklyPct,
    sessionReset,
    weeklyReset,
    lastMessageTime: result.lastMessageTime,
  };
}
