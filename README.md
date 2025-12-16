# CyViewer (Chrome Extension)

CyViewer is a Chrome Extension for Cymulate pages that shows useful environment data in a compact UI (tabs: **Info**, **Agents**, **Environments**, **Integrations**, **Settings**). It can also render as a floating, draggable overlay inside Cymulate pages.

## Install (Load Unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

## Use

- **Popup**: click the extension icon in Chrome’s toolbar.
- **Floating overlay** (on Cymulate pages):
  - Go to **Settings** tab → enable the floating button (if disabled).
  - Click the floating button (bottom-right) to open/close the draggable window.

## Notes

- The overlay is implemented by a content script that injects a draggable `div` with an `iframe` that loads `popup.html` (declared in `web_accessible_resources`).
- Theme preference is stored locally (dark/light toggle in the header).


