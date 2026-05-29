---
name: chrome-extension-dev
description: Chrome extension development with Manifest V3 — service workers, content scripts, declarativeNetRequest, Offscreen API, messaging, storage, security, cross-browser compatibility, and Chrome Web Store publishing best practices.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: chrome-extension
---

## What I do

### Manifest V3 (MV3) — The Only Path Forward
- Manifest V2 is fully deprecated — all new extensions **must** use `"manifest_version": 3`
- Key changes from MV2: service workers replace persistent background pages, `declarativeNetRequest` replaces blocking `webRequest`, no remote code execution, stricter CSP
- All JavaScript must be **bundled locally** — no `eval()`, no external script tags, no `new Function()` from remote strings

### Service Worker Architecture
- Service workers are **ephemeral** — they spin up on demand and terminate after ~30 seconds of inactivity
- **Never rely on global variables** for state — they are wiped on restart
- Use `chrome.storage.local` or `chrome.storage.session` for persistence
- `chrome.storage.session` is fast but cleared on browser restart (use for rate-limit counters, ephemeral state)
- Use `chrome.alarms` instead of `setInterval`/`setTimeout` for periodic/scheduled tasks
- Event-driven design: handle one event at a time, persist state before returning

### Content Scripts
- Run in an isolated JS environment — share DOM with page but not JS scope
- Declare in `manifest.json` with `matches`, `run_at`, and `js`/`css` arrays
- Inject dynamically via `chrome.scripting.executeScript` when user-action-based
- Use `MutationObserver` for DOM change detection (not polling)
- Minimize DOM operations — batch updates, use `requestAnimationFrame`

### Message Passing
- **Popup ↔ Service Worker**: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
- **Content Script ↔ Service Worker**: same API — `sender.tab` identifies source tab
- **Service Worker → Content Script**: `chrome.tabs.sendMessage(tabId, message)`
- Always call `sendResponse` synchronously or return `true` for async response in `onMessage` listeners
- Use `chrome.runtime.connect` for long-lived connections (streaming, WebSocket proxy)

### DeclarativeNetRequest (DNR)
- Replace blocking `webRequest` with static/dynamic DNR rules
- Rules evaluated natively in C++ — faster and more private
- Define static rules in JSON files, dynamic rules via `chrome.declarativeNetRequest.updateDynamicRules`
- DNR is less flexible than `webRequest` — if you cannot express your filter as rules, reconsider the approach

### Permissions Strategy (Least Privilege)
- Request the **absolute minimum** upfront — excessive permissions reduce install rates and trigger store review flags
- Use `activeTab` instead of broad `<all_urls>` or `tabs` when possible
- Declare optional permissions and request at runtime: `chrome.permissions.request`
- Every permission in `manifest.json` must have a **demonstrable use** in code
- Use specific host patterns over broad patterns

### Offscreen API (Service Worker DOM Access)
- Service workers have no DOM — use Offscreen API for parsing HTML, clipboard, audio playback
- Create a temporary hidden document, perform work, close it
- Do NOT use Offscreen API as a replacement for persistent background pages

### Security & CSP
- Stricter Content Security Policy by default — no `unsafe-eval`, no inline scripts in extension pages
- Move all event listeners to JS files (no inline `onclick="..."`)
- Sanitize all user inputs before DOM insertion, prefer `textContent` over `innerHTML`
- Encrypt sensitive data before storage, never store credentials in plain text
- HTTPS only for all external API calls

### Storage
- `chrome.storage.local`: 10 MB default, request `unlimitedStorage` for more (justify in listing)
- `chrome.storage.sync`: for settings that roam across devices (limited quota)
- `chrome.storage.session`: for ephemeral state within browser session

### Cross-Browser Compatibility
- WebExtensions API mostly standardized — one codebase can target Chrome, Firefox, Edge, Safari
- Use `chrome` namespace (Chrome) or `browser` namespace (Firefox) — consider `webextension-polyfill`
- Firefox still supports `webRequest` blocking — but don't rely on it for new code

### Testing & Debugging
- **Debugging**: `chrome://extensions` → Developer Mode → Inspect service worker / popup / content script contexts
- **Popup debugging**: right-click extension icon → "Inspect popup"
- **E2E testing**: Puppeteer with extension support for integration tests
- Avoid `unload` handler (deprecated) — use `pagehide` or `chrome.tabs.onRemoved`

### Chrome Web Store Publishing
- Required: clear description with keywords, ≥ 3 screenshots (1280×800), privacy policy if handling user data
- No obfuscated code (minification is OK, but must remain readable)
- All dependencies bundled — no remote code
- Categorize correctly in developer dashboard
- Approval typically 24–48 hours with minimal permissions; expect stricter review with powerful permissions
- Common rejection reasons: MV2 usage, unused permissions, missing privacy policy, remote code execution
