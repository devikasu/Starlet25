# 🌟 Starlet25 - Chrome Extension

A comprehensive Chrome extension for text extraction, summarization, learning, and accessibility features.

## ✨ Features

### 📄 Text Summarization
- **AI-powered content extraction** from web pages
- **Smart summarization** with key points and insights
- **Flashcard generation** for learning and retention
- **Export functionality** to save summaries as text files
- **Multiple summarization modes**: Full, Quick, and Rescan

### 🧠 ADHD-Friendly Flashcards
- **Distraction-free overlay** with dimmed background
- **One card at a time** display for better focus
- **Auto-advance timer** with customizable intervals
- **Voice reading option** for auditory learners
- **Three card decks**: Basic, Intermediate, Advanced
- **Keyboard navigation**: Space/Arrow keys to advance, Esc to close

### 🎨 Color Saturation Control
- **Real-time color adjustment** with smooth slider
- **0-200% saturation range** for various visual needs
- **Multiple injection methods** for maximum compatibility
- **Works on most websites** including complex layouts
- **Visual feedback** with immediate color changes

### 🎤 Voice Assistant
- **Full voice control** for all extension features
- **Speech recognition** for hands-free operation
- **Text-to-speech output** for accessibility
- **Voice commands** for summarization, flashcards, and settings
- **Keyboard activation**: Alt+Shift+V

### ♿ Accessibility Features
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** for all features
- **High contrast options** and color adjustments
- **Voice reading** of page content (Alt+N)
- **ADHD-friendly design** with focus management
- **Comprehensive error handling** with user feedback

### ⌨️ Keyboard Shortcuts
- **Ctrl+Alt+S**: Summarize current page
- **Ctrl+Alt+R**: Rescan and re-summarize page
- **Ctrl+Alt+Q**: Quick summarize with minimal processing
- **Alt+Shift+V**: Activate voice assistant
- **Alt+N**: Read page content aloud

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/Starlet25.git
   cd Starlet25
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project

## 🧪 Testing

### Comprehensive Test Page
Open `test-all-features.html` in your browser to test all features:
- Text summarization with sample content
- Color saturation control with test sections
- ADHD flashcard functionality
- Voice assistant integration
- Accessibility features

### Individual Test Pages
- `test-saturation-fixed.html` - Saturation control testing
- `test-accessibility.html` - Accessibility features
- `test-keyboard-shortcut.html` - Keyboard shortcuts
- `test-voice-assistant.html` - Voice assistant

## 🏗️ Architecture

### Core Components
- **Background Script** (`background.ts`): Handles keyboard shortcuts and message routing
- **Content Script** (`contentScript.ts`): Interacts with web pages and applies filters
- **Popup** (`popup.tsx`): Main user interface with all controls
- **Utils**: Modular utilities for text processing, voice assistance, and file export

### Key Features Implementation
- **Saturation Control**: Multiple CSS injection methods with fallbacks
- **Voice Assistant**: Web Speech API integration with error handling
- **Flashcards**: React-based overlay with accessibility features
- **Summarization**: AI-powered text analysis with export capabilities

## 🎯 Usage

### Basic Workflow
1. **Navigate** to any webpage you want to summarize
2. **Click** the Starlet25 extension icon
3. **Choose** your desired action:
   - Summarize page content
   - Generate flashcards
   - Adjust color saturation
   - Activate voice assistant
4. **Use keyboard shortcuts** for quick access to features

### ADHD Flashcards
1. **Select** a card deck (Basic/Intermediate/Advanced)
2. **Choose** options (auto-advance, voice reading)
3. **Launch** the focus overlay
4. **Navigate** with Space/Arrow keys or let auto-advance work
5. **Press Esc** to close when finished

### Color Saturation
1. **Open** the extension popup
2. **Move** the saturation slider (0-200%)
3. **Watch** colors change in real-time
4. **Reset** to 100% for normal colors

## 🔧 Development

### Project Structure
```
Starlet25/
├── src/
│   ├── background/          # Background script
│   ├── content/            # Content script
│   ├── popup/              # Popup interface
│   ├── components/         # React components
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── dist/                   # Built extension
└── test-*.html            # Test pages
```



### Key Technologies
- **TypeScript** for type safety
- **React** for UI components
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Web Speech API** for voice features
- **Chrome Extension APIs** for browser integration







**Starlet25** - Making the web more accessible and learnable, one page at a time! 🌟
