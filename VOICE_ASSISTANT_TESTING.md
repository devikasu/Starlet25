# 🎤 Starlet25 Voice Assistant Testing Guide

## ✅ Fixed Architecture

The voice assistant has been properly separated to fix the "⚠️ Failed to toggle accessibility" error:

### 🔧 Background Script (`background.ts`)
- **Only** listens for `Alt+Shift+V` keyboard shortcut
- Sends `{ action: "START_VOICE_ASSISTANT" }` message to active tab
- **No** voice assistant imports or direct calls

### 🎯 Content Script (`contentScript.ts`)
- Listens for `START_VOICE_ASSISTANT` messages
- Imports and calls `voiceAssistant.startListening()`
- Handles all Web Speech API interactions

### 🎤 Voice Assistant (`voiceAssistant.ts`)
- Contains all SpeechRecognition and SpeechSynthesis logic
- Only imported in content script (not background)
- Provides voice command processing and feedback

## 🧪 Testing Steps

### 1. Build and Install Extension
```bash
npm run build
```

### 2. Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
5. Verify extension is loaded and enabled

### 3. Test Voice Assistant
1. Open `test-voice-assistant.html` in Chrome
2. Press `Alt+Shift+V` to start voice assistant
3. Allow microphone access when prompted
4. Try voice commands:
   - "help" - List available commands
   - "summarize page" - Extract and summarize content
   - "read flashcards" - Read generated flashcards
   - "toggle accessibility" - Turn accessibility on/off
   - "stop" - Stop listening/speaking

### 4. Expected Console Logs
```
🎤 Starlet25: Alt+Shift+V received in background
🎤 Starlet25: Received START_VOICE_ASSISTANT command in content script
🎤 Starlet25: Voice assistant is supported, calling startListening()
🎤 Starlet25: startListening() called successfully
🎤 Starlet25: Starting speech recognition...
🎤 Starlet25: Voice recognition started
```

## 🎯 Voice Commands

| Command | Description | Example Usage |
|---------|-------------|---------------|
| `summarize page` | Extract and summarize current page | "summarize this page" |
| `read flashcards` | Read generated flashcards aloud | "read the flashcards" |
| `read summary` | Read page summary aloud | "tell me the summary" |
| `toggle accessibility` | Turn accessibility mode on/off | "turn on accessibility" |
| `help` | List all available commands | "what can you do" |
| `stop` | Stop current speech or listening | "stop listening" |
| `clear data` | Clear all stored page data | "clear everything" |

## 🐛 Troubleshooting

### Voice Assistant Not Starting
- Check console for "🎤 Starlet25:" messages
- Verify extension is loaded in `chrome://extensions/`
- Ensure microphone permission is granted
- Try refreshing the page and pressing `Alt+Shift+V` again

### Microphone Permission Issues
- Click the microphone icon in Chrome's address bar
- Select "Allow" for microphone access
- Refresh the page and try again

### Speech Recognition Not Working
- Ensure you're on HTTPS or localhost
- Check browser console for Web Speech API errors
- Try saying commands clearly and slowly
- Verify browser supports SpeechRecognition

### Extension Not Responding
- Check if extension is enabled in `chrome://extensions/`
- Reload the extension
- Check console for runtime errors
- Verify manifest.json has correct permissions

## 🔍 Debug Information

### Console Logs to Look For
```
✅ Extension is running and responding
✅ Speech Recognition: ✅
✅ Speech Synthesis: ✅
✅ Microphone permission granted
🎤 Starlet25: Voice recognition started
🎤 Starlet25: onresult fired with transcript: help
🎤 Starlet25: Executing help
```

### Test Functions Available
- `window.testStarlet25VoiceAssistant()` - Test voice assistant directly
- `window.testStarlet25Accessibility()` - Test accessibility features
- Check extension status via PING message

## 🎵 Audio Feedback

The voice assistant provides audio feedback:
- **Start listening**: "Listening. Please say a command."
- **Command execution**: "Executing [command name]"
- **Error handling**: "Sorry, I did not understand. Please try again."
- **Success feedback**: "Summary complete. [content]"

## 🔄 Testing Workflow

1. **Initial Setup**: Build extension and load in Chrome
2. **Basic Test**: Press `Alt+Shift+V` and say "help"
3. **Content Test**: Say "summarize page" on any webpage
4. **Accessibility Test**: Say "toggle accessibility" then press `Alt+N`
5. **Flashcard Test**: Say "read flashcards" after summarizing a page
6. **Error Test**: Say unrecognized commands to test error handling

## 📋 Success Criteria

✅ Voice assistant starts with `Alt+Shift+V`
✅ Microphone permission is requested and granted
✅ Voice commands are recognized and executed
✅ Speech synthesis provides audio feedback
✅ Console logs show proper flow
✅ No "Failed to toggle accessibility" errors
✅ Extension responds to all voice commands

## 🚀 Next Steps

After successful testing:
1. Test on different websites
2. Verify accessibility mode works with `Alt+N`
3. Test flashcard generation and reading
4. Verify data storage and retrieval
5. Test error handling and edge cases

---

**Note**: The voice assistant now properly separates background and content script responsibilities, eliminating the SpeechRecognition error in background scripts. 