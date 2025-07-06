// Background script for handling extracted page text
import { processExtractedText, ProcessedText } from '../utils/textProcessor';
import { summarizeText, SummarizationResult } from '../utils/summarizer';

// Centralized function to inject content script
async function injectContentScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content.js'],
    });
    console.log("✅ Starlet25: Content script injected into tab", tabId);
  } catch (error) {
    console.error("❌ Starlet25: Failed to inject content script:", error);
    throw error;
  }
}

interface ExtractedText {
  type: 'PAGE_TEXT';
  text: string;
  url: string;
  title: string;
  timestamp: number;
}

interface StoredText {
  text: string;
  url: string;
  title: string;
  timestamp: number;
  processed?: ProcessedText;
  summarization?: SummarizationResult;
}

// Store extracted text in chrome.storage
async function storeExtractedText(data: ExtractedText): Promise<void> {
  try {
    const key = `page_text_${Date.now()}`;
    
    // Process the extracted text
    const processed = processExtractedText(data.text);
    
    // Generate summary and flashcards
    const summarization = summarizeText(data.text);
    
    const storedData: StoredText = {
      text: data.text,
      url: data.url,
      title: data.title,
      timestamp: data.timestamp,
      processed: processed,
      summarization: summarization
    };

    await chrome.storage.local.set({ [key]: storedData });
    
    // Keep only the last 10 extracted texts
    const allKeys = await chrome.storage.local.get(null);
    const textKeys = Object.keys(allKeys).filter(key => key.startsWith('page_text_'));
    
    if (textKeys.length > 10) {
      const keysToRemove = textKeys
        .sort()
        .slice(0, textKeys.length - 10);
      
      await chrome.storage.local.remove(keysToRemove);
    }

    console.log(`[${new Date().toISOString()}] Extracted summary:`, data.text.slice(0, 200));
    console.log(`[${new Date().toISOString()}] Processed stats:`, {
      wordCount: processed.wordCount,
      readingTime: processed.estimatedReadingTime,
      language: processed.language,
      hasCode: processed.hasCode,
      hasLinks: processed.hasLinks
    });
    console.log(`[${new Date().toISOString()}] Generated ${summarization.flashcards.length} flashcards and summary with ${Math.round(summarization.summary.confidence * 100)}% confidence${summarization.isFallback ? ' (FALLBACK USED)' : ''}`);
  } catch (error) {
    console.error('Starlet25: Error storing text:', error);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: ExtractedText, _sender, sendResponse) => {
  if (message.type === 'PAGE_TEXT') {
    // Quick peek of extracted summary
    console.log(`[${new Date().toISOString()}] Extracted summary:`, message.text.slice(0, 200));
    storeExtractedText(message);
    sendResponse({ success: true });
  }
});

// Handle messages from popup and test pages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Handle PING for testing
  if (request.action === 'PING') {
    console.log("🎤 Starlet25: Received PING request");
    sendResponse({ success: true, message: 'Starlet25 extension is running' });
    return true;
  }

  if (request.action === 'GET_STORED_TEXTS') {
    console.log("🎤 Starlet25: Received GET_STORED_TEXTS request from voice assistant");
    chrome.storage.local.get(null).then((data) => {
      const textEntries = Object.entries(data)
        .filter(([key]) => key.startsWith('page_text_'))
        .map(([key, value]) => ({
          id: key,
          ...value as StoredText
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      console.log("🎤 Starlet25: Retrieved stored texts count:", textEntries.length);
      sendResponse({ texts: textEntries });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'CLEAR_STORED_TEXTS') {
    chrome.storage.local.get(null).then((data) => {
      const textKeys = Object.keys(data).filter(key => key.startsWith('page_text_'));
      chrome.storage.local.remove(textKeys).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'EXTRACT_CURRENT_PAGE') {
    console.log("🎤 Starlet25: Received EXTRACT_CURRENT_PAGE request from voice assistant");
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("🎤 Starlet25: No active tab found for EXTRACT_CURRENT_PAGE");
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      try {
        console.log("🎤 Starlet25: Injecting content script for extraction");
        await injectContentScript(tab.id);

        chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_TEXT" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ Starlet25: Content script not ready", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: 'Content script not ready' });
          } else if (response && response.text) {
            console.log("✅ Starlet25: Got response from content script", response);
            const processed = processExtractedText(response.text);
            const summarization = summarizeText(response.text);
            const extractedData: ExtractedText = {
              type: 'PAGE_TEXT',
              text: response.text,
              url: response.url,
              title: response.title,
              timestamp: Date.now()
            };
            storeExtractedText(extractedData);
            console.log("🎤 Starlet25: Sending successful response to voice assistant");
            sendResponse({ 
              success: true, 
              text: response.text, 
              processed: processed,
              summarization: summarization
            });
          } else {
            console.log("🎤 Starlet25: No text extracted from content script");
            sendResponse({ success: false, error: 'No text extracted' });
          }
        });
      } catch (error) {
        console.error("❌ Starlet25: Failed to inject content script for extraction:", error);
        sendResponse({ success: false, error: 'Content script injection failed' });
      }
    });
    return true;
  }

  // Handle accessibility toggle
  if (request.action === 'TOGGLE_ACCESSIBILITY') {
    const { enabled } = request;
    
    console.log(`Starlet25: Toggling accessibility to ${enabled}`);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error('Starlet25: No active tab found');
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      try {
        await injectContentScript(tab.id);
        
        // Then send the toggle message
        chrome.tabs.sendMessage(tab.id, { 
          action: 'TOGGLE_ACCESSIBILITY', 
          enabled: enabled 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ Starlet25: Content script not ready for accessibility toggle", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: 'Content script not responding' });
          } else if (response && response.success) {
            console.log(`✅ Starlet25: Accessibility ${enabled ? 'enabled' : 'disabled'} successfully`);
            
            // Play audio cue when accessibility is enabled
            if (enabled && tab.id) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  // Generate a pleasant "ding" sound using Web Audio API
                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                  const audioContext = new AudioContextClass();
                  
                  // Create oscillator for the ding sound
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();
                  
                  // Connect nodes
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  
                  // Configure the sound
                  oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Start at 800Hz
                  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1); // Rise to 1200Hz
                  
                  // Configure volume envelope
                  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05); // Quick attack
                  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Decay
                  
                  // Start and stop the sound
                  oscillator.start(audioContext.currentTime);
                  oscillator.stop(audioContext.currentTime + 0.3);
                }
              });
            }
            
            sendResponse({ success: true });
          } else {
            console.error('❌ Starlet25: Failed to toggle accessibility - no response');
            sendResponse({ success: false, error: 'Failed to toggle accessibility' });
          }
        });
      } catch (error) {
        console.error('❌ Starlet25: Error injecting content script:', error);
        sendResponse({ success: false, error: 'Content script injection failed' });
      }
    });
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Starlet25: Extension installed');
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "start-voice-assistant") {
    console.log("🎤 Starlet25: Alt+Shift+V received in background script");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log("🎤 Starlet25: Active tab found:", tab?.id, tab?.url);
      
      if (tab?.id) {
        try {
          console.log("🎤 Starlet25: Injecting content script...");
          await injectContentScript(tab.id);
          console.log("🎤 Starlet25: Content script injected, sending START_VOICE_ASSISTANT message");
          
          chrome.tabs.sendMessage(tab.id, {
            action: "START_VOICE_ASSISTANT"
          }, (response) => {
            console.log("🎤 Starlet25: Received response from content script:", response);
            if (chrome.runtime.lastError) {
              console.warn("⚠️ Starlet25: Content script not ready for voice assistant", chrome.runtime.lastError.message);
            } else if (response && response.success) {
              console.log("✅ Starlet25: Voice assistant started successfully");
            } else {
              console.error('❌ Starlet25: Failed to start voice assistant - response:', response);
            }
          });
        } catch (err) {
          console.error("❌ Starlet25: Error starting voice assistant", err);
        }
      } else {
        console.error("❌ Starlet25: No active tab found");
      }
    } catch (error) {
      console.error("❌ Starlet25: Error handling voice assistant shortcut", error);
    }
  }
});



// Handle tab updates to extract text on page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log(`Starlet25: Tab ${tabId} completed loading: ${tab.url}`);
    
    // Small delay to ensure content script has loaded
    setTimeout(async () => {
      try {
        // Check if accessibility is enabled - default to true
        const result = await chrome.storage.local.get(['accessibilityEnabled']);
        const accessibilityEnabled = result.accessibilityEnabled !== false; // Only false if explicitly set to false
        
        // Always inject content script first to ensure it's available
        await injectContentScript(tabId);
        
        // Extract text after ensuring content script is injected
        chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_TEXT' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`Starlet25: Content script not ready for text extraction on tab ${tabId}:`, chrome.runtime.lastError.message);
          } else if (response) {
            console.log(`Starlet25: Text extracted from tab ${tabId}`);
          }
        });
        
        // If accessibility is enabled, send the toggle message
        if (accessibilityEnabled) {
          console.log(`Starlet25: Accessibility enabled, sending toggle message on tab ${tabId}`);
          
          chrome.tabs.sendMessage(tabId, { 
            action: 'TOGGLE_ACCESSIBILITY', 
            enabled: true 
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log(`⚠️ Starlet25: Content script not ready for accessibility on tab ${tabId}:`, chrome.runtime.lastError.message);
            } else if (response) {
              console.log(`✅ Starlet25: Accessibility enabled on tab ${tabId}`);
            }
          });
        }
      } catch (error) {
        console.log(`ℹ️ Starlet25: Content script already injected or injection failed on tab ${tabId}:`, error);
      }
    }, 1000);
  }
});


