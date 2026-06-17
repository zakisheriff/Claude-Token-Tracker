# <div align="center">Claude Token Tracker</div>

<div align="center">
<strong>Real-time token usage, context, and quota tracking for Claude.ai — Built by The Atom</strong>
</div>

<br />

<div align="center">

![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<br />

<a href="https://github.com/zakisheriff/Claude-Token-Tracker">
<img src="https://img.shields.io/badge/View%20on%20GitHub-Click%20Here-0071e3?style=for-the-badge&logo=github&logoColor=white" height="50" />
</a>

<br />
<br />

**[GitHub Repository](https://github.com/zakisheriff/Claude-Token-Tracker)**

</div>

<br />

> **"Know your usage, never hit the limit blind."**
>
> Claude Token Tracker gives you complete visibility into your Claude.ai token consumption, session quotas, and weekly limits — right where you need it, when you need it.

---

## 🌟 Vision

Claude Token Tracker's mission is to:

- **Eliminate surprise rate limits** — See real-time usage before you hit the ceiling
- **Match Claude's native design** — Feel like it was built by Anthropic themselves
- **Stay lightweight and fast** — Zero bloat, pure vanilla JavaScript
- **Respect your privacy** — All data stays on your device, no external tracking

---

## ✨ Why Claude Token Tracker?

Claude Pro has session (5h) and weekly (7d) usage limits that **aren't visible in the UI** until you've already hit them.  
Claude Token Tracker solves this with a native-styled popup that shows:

✅ **Context window usage** — Token count + % of 200k context limit  
✅ **Session quota (5h)** — How much you've used this window  
✅ **Weekly quota (7d)** — Weekly usage cap with reset countdown  
✅ **Real-time updates** — Reflects actual usage from your messages  
✅ **One-click access** — Toolbar icon opens instant visibility  

---

## 🎨 Claude-Native Design Language

- **Light Theme UI**  
  White background matching claude.ai's composer, not a dark clone.

- **Native Typography**  
  System font stack (`-apple-system, BlinkMacSystemFont`) for maximum authenticity.

- **Signature Colors**  
  Blue (#2563eb) for session, orange (#fb923c) for weekly — the exact palette Claude uses.

- **Minimal, Clean Layout**  
  Tally-counter aesthetic with inline metrics like `context · 691 / 200k 0%`.

- **Smooth Interactions**  
  Refresh button, progress animations, and responsive feedback.

---

## 🔍 How It Works

### Data Collection (Privacy-First)

The extension observes claude.ai's **own network responses** for usage telemetry:

1. **inject.js** (MAIN world) — Patches `fetch` and `XMLHttpRequest` to watch for JSON responses containing usage patterns (`five_hour`, `seven_day`, `utilization`, etc.)
2. **content.js** (isolated world) — Relays captured payloads to Chrome storage and computes a heuristic token estimate from visible page text (chars ÷ 4)
3. **popup.js** — Renders real data when found, honest "no data yet" state otherwise

**No external servers contacted. No sending your data anywhere. All processing stays local.**

---

## 🎯 Key Features

✅ **Real-Time Context Tracking** — Live token count from visible conversation  
✅ **Session Quota Monitor** — 5-hour window usage with reset countdown  
✅ **Weekly Limit Visibility** — 7-day quota + days until reset  
✅ **Warning System** — Visual alerts when approaching 75%+ usage  
✅ **Fast Refresh** — One-click data refresh  
✅ **Claude-Exact Design** — Indistinguishable from native UI  
✅ **Zero Configuration** — Install and use, no setup needed  

---

## 📁 Project Structure

```
claude-token-tracker/
├── manifest.json                 # Chrome Extension manifest (MV3)
├── inject.js                     # Page-context network observer
├── content.js                    # Isolated-world bridge + token estimator
├── background.js                 # Service worker
├── popup.html                    # UI structure
├── popup.css                     # Claude-styled light theme
├── popup.js                      # Data rendering + storage management
├── icons/                        # Extension icons (16, 48, 128px)
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── PRIVACY.md                    # Privacy policy
└── README.md                     # This file
```

---

## 🚀 Installation & Setup

### Option 1: Load Unpacked (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/zakisheriff/Claude-Token-Tracker.git
   cd claude-token-tracker
   ```

2. **Open Chrome Extensions**
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

4. **Load Unpacked**
   - Click "Load unpacked"
   - Select the `claude-token-tracker` folder
   - The extension appears with a green progress-ring icon

5. **Pin to Toolbar** (optional)
   - Click the puzzle piece icon
   - Pin "Claude Token Tracker" for easy access

### Option 2: Chrome Web Store (Coming Soon)

Once published, install with a single click from the Chrome Web Store.

---

## 💡 How to Use

### Basic Workflow

1. **Open Claude.ai** in a tab
2. **Send a message** to your conversation
3. **Click the extension icon** in your toolbar
4. **View your usage**:
   - `context · 691 / 200k 0%` — Current token consumption
   - `session · 45%` — Session quota usage + reset time
   - `weekly · 12%` — Weekly quota usage + days remaining

### Understanding the Metrics

| Metric | What It Shows | Data Source |
|--------|---------------|-------------|
| **Context** | Tokens in current conversation | Text estimator (visible page content) |
| **Session (5h)** | Usage within current 5-hour window | Real API response (if loaded) |
| **Weekly (7d)** | Cumulative usage this week | Real API response (if loaded) |

**Note:** Session and weekly data only populate once you've triggered a usage payload response from Claude's servers. This happens naturally as you use the app. If you see "no data" initially, send a few more messages.

---

## 🔒 Privacy & Security

✅ **Zero External Requests** — Extension never contacts any server except claude.ai  
✅ **Local Storage Only** — All data stored in `chrome.storage.local`  
✅ **No Message Logging** — We never read or store your conversation content (only text length for token estimation)  
✅ **Open Source** — Fully auditable code, no hidden logic  
✅ **GDPR Compliant** — No personal data collection or transmission  

See [PRIVACY.md](./PRIVACY.md) for full details.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Extension Framework** | Chrome Manifest V3 |
| **Network Interception** | `fetch` + `XMLHttpRequest` patching (MAIN world) |
| **Storage** | `chrome.storage.local` API |
| **UI Framework** | Vanilla JavaScript + Pure CSS |
| **Design System** | Claude.ai's native light theme |

---

## 📊 Architecture Decisions

### Why MAIN World + Isolated World?

- **inject.js in MAIN world** can access the page's original `fetch` before it's patched by Content Security Policy
- **content.js in isolated world** bridges safely to the extension APIs without exposing secrets
- Prevents Content Security Policy from blocking our observation

### Why Heuristic Token Estimation?

Claude's usage API is internal (not publicly documented). Rather than guess endpoints that break, we:
- Estimate tokens from visible text (honest fallback)
- Capture real data when Claude's own code loads it
- Degrade gracefully if API shapes change

### Why Light Theme?

Claude's own UI is light. A dark clone would feel alien. We match exactly.

---

## 🛠️ Development

### Modifying the Extension

1. **Edit any file** in the repo
2. **Go to `chrome://extensions`**
3. **Click the refresh icon** on Claude Token Tracker
4. **Reload claude.ai** to see changes

### Adding Features

- **New metrics?** Add fields to `popup.html` and update `popup.js` parsing logic
- **New colors?** Edit CSS variables in `popup.css`
- **New data sources?** Add detection patterns to `inject.js`'s `USAGE_KEY_HINTS` array

---

## 📝 API Reference

### Storage API

```javascript
// Current state stored in chrome.storage.local:
{
  tokenEstimate: { tokens: 691, updatedAt: 1686754123456 },
  usagePayload: { 
    url: "https://claude.ai/api/...", 
    payload: { /* raw API response */ }
  },
  lastMessageTime: 1686754123456
}
```

### Events (inject.js → content.js)

```javascript
// Custom event dispatched when usage data is found
window.dispatchEvent(
  new CustomEvent("__claude_token_tracker_usage__", {
    detail: { url, payload, capturedAt }
  })
);
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **No data showing** | Send a message on claude.ai to trigger usage payloads |
| **"No data observed yet"** | This is normal — Claude's servers may not send usage data every request |
| **Refresh button not working** | Click it again; payload data is cached until Claude.ai loads new data |
| **Extension not updating** | Go to `chrome://extensions`, click refresh on the extension card |

---

## 📦 Deployment to Chrome Web Store

### Prerequisites

1. **Google Developer Account** ($5 one-time fee)
2. **ZIP file** of the extension (see below)

### Steps

```bash
# 1. Create ZIP
zip -r claude-token-tracker.zip \
  manifest.json *.js popup.* icons/ PRIVACY.md

# 2. Go to Chrome Web Store Developer Dashboard
# https://chrome.google.com/webstore/devconsole

# 3. Click "New Item" → Upload ZIP
# 4. Fill in store listing:
#    - Title: "Claude Token Tracker"
#    - Description: (see below)
#    - Category: Productivity
#    - Upload icons (16, 48, 128)
# 5. Submit for review (24-72 hours)
```

### Store Listing

**Short Description:**
```
Real-time token count, session, and weekly quota tracking for Claude.ai with Claude-native design.
```

**Detailed Description:**
```
Claude Pro has hidden usage limits that aren't visible until you hit them. 
Claude Token Tracker makes them visible with a light-themed popup showing 
your context window usage, 5-hour session quota, and 7-day weekly limit.

Features:
• Real-time context window token counter
• Session (5h) and weekly (7d) quota tracking
• Countdown timers for limit resets
• Claude-native design matching your composer UI
• Privacy-first: all data stays on your device
• Zero configuration, instant visibility

Built by The Atom.
```

---

## 🤝 Contributing

Issues and pull requests welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "add feature"`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — 100% Free and Open Source

You are free to use, modify, and distribute this extension.

---

## ☕️ Support

If Claude Token Tracker saves you from unexpected rate limits:

- **Star the repository** — means a lot!
- **Share it** with friends and colleagues
- **Report bugs** via GitHub Issues
- **Suggest features** via GitHub Discussions

<div align="center">
<a href="https://github.com/zakisheriff/Claude-Token-Tracker">
<img src="https://img.shields.io/github/stars/zakisheriff/Claude-Token-Tracker?style=social" />
</a>
</div>

---

<p align="center">
Made by <strong>Zaki Sheriff</strong> @ <strong>The Atom</strong>
</p>

<p align="center">
<em>Because you shouldn't be surprised by usage limits.</em>
</p>
