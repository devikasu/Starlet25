# 🧹 Starlet25 Cleanup Checklist

## 🎯 Goal: Simplify the extension by removing advanced features

### ✅ Features to KEEP
- Text Summarization (main feature)
- Color Saturation Control (slider)
- Basic flashcard generation
- File export functionality

### ❌ Features to REMOVE
- Quick Summarize button/feature
- Accessibility controls (voice commands, TTS, keyboard nav)
- ADHD Focus Mode flashcard interface
- Recent Extractions section and storage

---

## 📁 Files to DELETE

### Voice Assistant Files
- [ ] `src/utils/voiceAssistant.ts`
- [ ] `src/utils/voiceCommand.ts`

### ADHD Flashcard Files
- [ ] `src/components/FlashcardOverlay.tsx`

### Test Files (Optional)
- [ ] `test-accessibility.html`
- [ ] `test-keyboard-shortcut.html`
- [ ] `test-voice-assistant.html`

---

## 📝 Files to UPDATE

### Core Files
- [ ] `src/popup/popup.tsx` - Remove accessibility, ADHD, quick summarize, recent extractions
- [ ] `src/background/background.ts` - Remove voice assistant and accessibility shortcuts
- [ ] `src/content/contentScript.ts` - Remove accessibility features
- [ ] `manifest.json` - Remove voice permissions

### Documentation
- [ ] `README.md` - Update to reflect simplified features
- [ ] `MERGED_FEATURES.md` - Update or delete
- [ ] `test-all-features.html` - Simplify to show only kept features

---

## 🔧 Specific Changes Needed

### popup.tsx Changes
- [ ] Remove accessibility toggle section
- [ ] Remove ADHD flashcard section
- [ ] Remove Quick Summarize button
- [ ] Remove Recent Extractions section
- [ ] Remove keyboard shortcuts display
- [ ] Remove voice assistant button
- [ ] Simplify to: Summarize, Rescan, Saturation Slider, Basic Flashcards

### background.ts Changes
- [ ] Remove Alt+Shift+V voice assistant shortcut
- [ ] Remove Alt+N accessibility shortcut
- [ ] Keep only Ctrl+Alt+S and Ctrl+Alt+R shortcuts

### contentScript.ts Changes
- [ ] Remove accessibility reading functions
- [ ] Remove voice assistant message handling
- [ ] Keep saturation filter and basic content extraction

### manifest.json Changes
- [ ] Remove "microphone" permission
- [ ] Remove accessibility-related permissions
- [ ] Keep basic permissions for content scripts and storage

---

## 🧪 Testing After Cleanup

### Test Pages to Update
- [ ] `test-all-features.html` - Remove accessibility, ADHD, voice features
- [ ] Keep only: summarization, saturation, basic flashcards

### Manual Testing
- [ ] Test text summarization still works
- [ ] Test saturation slider still works
- [ ] Test basic flashcard generation
- [ ] Test file export functionality
- [ ] Verify no console errors
- [ ] Test keyboard shortcuts (Ctrl+Alt+S, Ctrl+Alt+R)

---

## 📊 Expected Result

### Simplified Extension Will Have:
- ✅ Clean, minimal popup interface
- ✅ Core summarization functionality
- ✅ Color saturation control
- ✅ Basic flashcard generation
- ✅ File export capability
- ✅ Reduced bundle size
- ✅ Easier maintenance

### Removed Complexity:
- ❌ Voice assistant complexity
- ❌ Accessibility feature overhead
- ❌ ADHD overlay system
- ❌ Recent extractions storage
- ❌ Multiple keyboard shortcuts
- ❌ Complex state management

---

## 🚀 Post-Cleanup Actions

1. [ ] Run `npm run build` to verify no errors
2. [ ] Test extension in Chrome
3. [ ] Update documentation
4. [ ] Create new simplified test page
5. [ ] Verify all core features work correctly

---

**Status**: Ready to begin cleanup process
**Priority**: High - Simplify for better maintainability 