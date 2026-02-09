# WindUI Editor (Offline Preview)

This repository provides an offline editor and preview for WindUI layouts. It renders a WindUI-like UI in the browser without launching Roblox, lets you edit properties, and exports Lua code compatible with WindUI.

**Key Features**
1. WYSIWYG preview of WindUI layout.
2. Structure panel for selecting and reordering elements.
3. Properties panel with validation and typed inputs.
4. Lua export (WindUI API style).

**Quick Start**
1. Open `preview/index.html` in a browser.
2. Edit elements in the preview or in the Structure panel.
3. Use **Copy Lua** or **Download Lua** to export.

**Project Layout**
1. `preview/index.html` UI for the editor.
2. `preview/preview.js` app logic.
3. `preview/preview.css` styles.
4. `preview/preview-data.js` sample data for initial layout.

**Notes**
1. Icon rendering is disabled in this build (offline-only).
2. If you need the original WindUI library, see the upstream repository.

**Upstream**
WindUI by Footagesus: https://github.com/Footagesus/WindUI
