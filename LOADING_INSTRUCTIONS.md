# Loading Starlet25 Chrome Extension

## Quick Setup

1. **Build the Extension**
   ```bash
   npm run build
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project

3. **Verify Installation**
   - The extension should appear in your extensions list
   - You should see the Starlet25 icon in your Chrome toolbar
   - Click the icon to open the popup

## File Structure (dist/)
```
dist/
├── manifest.json     ← Extension manifest
├── icon.png         ← Extension icon
├── index.html       ← Popup HTML
└── assets/
    ├── popup.js     ← Popup bundle
    ├── background.js ← Background script
    ├── content.js   ← Content script
    └── popup.css    ← Styles
```

## Usage
1. Navigate to any webpage with content
2. Click the Starlet25 extension icon
3. Click "📄 Summarize Page" to extract and analyze content
4. View summaries, flashcards, and use voice commands

## Troubleshooting
- If the extension doesn't load, check that all files are in the `dist/` folder
- Make sure Developer mode is enabled in Chrome
- Try refreshing the extensions page if changes don't appear 