// Background script for handling extracted page text
import { processExtractedText, ProcessedText } from '../utils/textProcessor';
import { summarizeText, SummarizationResult } from '../utils/summarizer';

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
    console.log(`[${new Date().toISOString()}] Generated ${summarization.flashcards.length} flashcards and summary with ${Math.round(summarization.summary.confidence * 100)}% confidence`);
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

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'GET_STORED_TEXTS') {
    chrome.storage.local.get(null).then((data) => {
      const textEntries = Object.entries(data)
        .filter(([key]) => key.startsWith('page_text_'))
        .map(([key, value]) => ({
          id: key,
          ...value as StoredText
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
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
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXTRACT_TEXT' }, (response) => {
          if (response && response.text) {
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
            sendResponse({ 
              success: true, 
              text: response.text, 
              processed: processed,
              summarization: summarization
            });
          } else {
            sendResponse({ success: false, error: 'No text extracted' });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Starlet25: Extension installed');
});

// Handle tab updates to extract text on page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Small delay to ensure content script has loaded
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_TEXT' }).catch(() => {
        // Content script might not be ready yet, ignore errors
      });
    }, 1000);
  }
});
