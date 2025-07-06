// Background script for handling extracted page text
import { processExtractedText } from '../utils/textProcessor';
import { summarizeText } from '../utils/summarizer';

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

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: ExtractedText, _sender, sendResponse) => {
  if (message.type === 'PAGE_TEXT') {
    console.log(`[${new Date().toISOString()}] Extracted summary:`, message.text.slice(0, 200));
    sendResponse({ success: true });
  }
});

// Handle messages from popup and test pages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // Handle PING for testing
  if (request.action === 'PING') {
    console.log("Starlet25: Received PING request");
    sendResponse({ success: true, message: 'Starlet25 extension is running' });
    return true;
  }

  if (request.action === 'EXTRACT_CURRENT_PAGE') {
    console.log("Starlet25: Received EXTRACT_CURRENT_PAGE request");
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("Starlet25: No active tab found for EXTRACT_CURRENT_PAGE");
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      try {
        console.log("Starlet25: Injecting content script for extraction");
        await injectContentScript(tab.id);

        chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_TEXT" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ Starlet25: Content script not ready", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: 'Content script not ready' });
          } else if (response && response.text) {
            console.log("✅ Starlet25: Got response from content script", response);
            const processed = processExtractedText(response.text);
            const summarization = summarizeText(response.text);
            console.log("Starlet25: Sending successful response");
            sendResponse({ 
              success: true, 
              text: response.text, 
              processed: processed,
              summarization: summarization
            });
          } else {
            console.log("Starlet25: No text extracted from content script");
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
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Starlet25: Extension installed');
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "extract-text") {
    console.log("Starlet25: Ctrl+Alt+S received in background script");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log("Starlet25: Active tab found:", tab?.id, tab?.url);
      
      if (tab?.id) {
        try {
          console.log("Starlet25: Injecting content script...");
          await injectContentScript(tab.id);
          console.log("Starlet25: Content script injected, sending EXTRACT_TEXT message");
          
          chrome.tabs.sendMessage(tab.id, {
            action: "EXTRACT_TEXT"
          }, (response) => {
            console.log("Starlet25: Received response from content script:", response);
            if (chrome.runtime.lastError) {
              console.warn("⚠️ Starlet25: Content script not ready", chrome.runtime.lastError.message);
            } else if (response && response.success) {
              console.log("✅ Starlet25: Text extraction started successfully");
            } else {
              console.error('❌ Starlet25: Failed to extract text - response:', response);
            }
          });
        } catch (err) {
          console.error("❌ Starlet25: Error extracting text", err);
        }
      } else {
        console.error("❌ Starlet25: No active tab found");
      }
    } catch (error) {
      console.error("❌ Starlet25: Error handling text extraction shortcut", error);
    }
  }
  
  if (command === "voice-assistant") {
    console.log("Starlet25: Alt+Shift+V received in background script");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await injectContentScript(tab.id);
        chrome.tabs.sendMessage(tab.id, {
          action: "START_VOICE_ASSISTANT"
        }, (_response) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ Starlet25: Content script not ready for voice assistant", chrome.runtime.lastError.message);
          } else {
            console.log("✅ Starlet25: Voice assistant started successfully");
          }
        });
      }
    } catch (error) {
      console.error("❌ Starlet25: Error starting voice assistant", error);
    }
  }
});

// Handle tab updates to inject content script on page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log(`Starlet25: Tab ${tabId} completed loading: ${tab.url}`);
    
    // Small delay to ensure content script has loaded
    setTimeout(async () => {
      try {
        // Always inject content script first to ensure it's available
        await injectContentScript(tabId);
        console.log(`Starlet25: Content script injected on tab ${tabId}`);
      } catch (error) {
        console.log(`ℹ️ Starlet25: Content script already injected or injection failed on tab ${tabId}:`, error);
      }
    }, 1000);
  }
});


