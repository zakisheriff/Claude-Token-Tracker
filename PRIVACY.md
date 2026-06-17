# Privacy Policy — Claude Token Tracker

Built by The Atom.

## Data collection
This extension does not collect, transmit, or sell any data to any server. It is not affiliated with or endorsed by Anthropic.

## How it works
- A script running on claude.ai pages observes network responses the page itself already loads, looking for usage/rate-limit data Anthropic's own web app uses internally.
- A second script estimates current context size from the visible page text.
- All of this stays on your device, stored in Chrome's local extension storage (`chrome.storage.local`).

## What it does not do
- It does not read your account credentials, message contents for any purpose other than the local token estimate, or send anything off-device.
- It does not contact any server other than the ones claude.ai itself already contacts as part of normal use.

## Permissions
- `storage` — persist the latest observed usage data and token estimate between popup opens.
- Content script access to `https://claude.ai/*` — required to observe the page's own network responses and visible text.

## Uninstalling
Removing the extension deletes all locally stored data immediately.
