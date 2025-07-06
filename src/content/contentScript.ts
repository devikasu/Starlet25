// Content script for extracting main page text
// Avoids navbars, footers, sidebars, and other non-content elements

console.log('🔊 Starlet25 content script loaded. Waiting for Alt+N...');

// Import voice assistant
import { voiceAssistant } from '../utils/voiceAssistant';

// Log voice assistant initialization
console.log('🎤 Starlet25: Voice assistant imported:', !!voiceAssistant);
console.log('🎤 Starlet25: Voice assistant supported:', voiceAssistant.isSupported());

interface ExtractedText {
  type: 'PAGE_TEXT';
  text: string;
  url: string;
  title: string;
  timestamp: number;
}

// Accessibility state
let accessibilityEnabled = false;
let keydownListener: ((event: KeyboardEvent) => void) | null = null;

// Check accessibility status on load
async function checkAccessibilityStatus() {
  try {
    const result = await chrome.storage.local.get(['accessibilityEnabled']);
    accessibilityEnabled = result.accessibilityEnabled === true;
    
    console.log('Starlet25: Checking accessibility status:', accessibilityEnabled);
    
    if (accessibilityEnabled && !keydownListener) {
      console.log('Starlet25: Enabling accessibility listener');
      attachAccessibilityListener();
    } else if (!accessibilityEnabled && keydownListener) {
      console.log('Starlet25: Disabling accessibility listener');
      removeAccessibilityListener();
    }
    
    // Log current state for debugging
    console.log('Starlet25: Current state - accessibilityEnabled:', accessibilityEnabled, 'keydownListener:', !!keydownListener);
  } catch (error) {
    console.error('Starlet25: Error checking accessibility status:', error);
  }
}

// Attach accessibility keyboard listener
function attachAccessibilityListener() {
  if (keydownListener) return; // Already attached

  keydownListener = (event: KeyboardEvent) => {
    // Check for Alt+N (case insensitive)
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Starlet25: Alt+N pressed - reading content');
      
      // Add visual feedback immediately
      showReadingIndicator();
      
      // Read content
      readVisibleContent();
    }
  };

  document.addEventListener('keydown', keydownListener, true);
  console.log('Starlet25: Accessibility listener attached (Alt+N to read content)');
  
  // Add a test to verify the listener is working
  setTimeout(() => {
    console.log('Starlet25: Accessibility listener status - enabled:', accessibilityEnabled, 'listener attached:', !!keydownListener);
  }, 1000);
}

// Remove accessibility keyboard listener
function removeAccessibilityListener() {
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener, true);
    keydownListener = null;
    console.log('Starlet25: Accessibility listener removed');
  }
}

// Read visible content using SpeechSynthesis
function readVisibleContent() {
  try {
    const visibleText = extractReadableText();
    
    if (!visibleText || visibleText.trim().length === 0) {
      speakText('No visible content found on this page.');
      return;
    }

    // Limit text length to avoid very long speech
    const maxLength = 500;
    const textToRead = visibleText.length > maxLength 
      ? visibleText.substring(0, maxLength) + '... (content truncated)'
      : visibleText;

    speakText(textToRead);
    
  } catch (error) {
    console.error('Starlet25: Error reading content:', error);
    speakText('Error reading page content.');
  }
}

// Speak text using SpeechSynthesis
function speakText(text: string) {
  if ('speechSynthesis' in window) {
    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Add event listeners for better user feedback
    utterance.onstart = () => {
      console.log('Starlet25: Started reading content aloud');
      // Add visual feedback
      showReadingIndicator();
    };
    
    utterance.onend = () => {
      console.log('Starlet25: Finished reading content');
      hideReadingIndicator();
    };
    
    utterance.onerror = (event) => {
      console.error('Starlet25: Speech error:', event.error);
      hideReadingIndicator();
    };
    
    speechSynthesis.speak(utterance);
  } else {
    console.error('Starlet25: Speech synthesis not supported');
  }
}

// Show visual indicator that content is being read
function showReadingIndicator() {
  // Remove existing indicator
  hideReadingIndicator();
  
  const indicator = document.createElement('div');
  indicator.id = 'starlet25-reading-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: starlet25-pulse 1.5s infinite;
  `;
  indicator.textContent = '🔊 Reading content...';
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes starlet25-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(indicator);
}

// Hide reading indicator
function hideReadingIndicator() {
  const indicator = document.getElementById('starlet25-reading-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function getMainContent(): HTMLElement | null {
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.entry-content',
    '#content',
    '#main'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }
  }

  const body = document.body as HTMLElement;
  const textContainers = Array.from(body.querySelectorAll('div, section, article, main'))
    .filter(el => el instanceof HTMLElement) as HTMLElement[];

  let largestContainer: HTMLElement = body;
  let maxTextLength = body.innerText.length;

  textContainers.forEach(container => {
    const textLength = container.innerText.length;
    if (textLength > maxTextLength && textLength > 100) {
      maxTextLength = textLength;
      largestContainer = container;
    }
  });

  return largestContainer;
}

function removeNonContentElements(element: HTMLElement): void {
  const selectorsToRemove = [
    'nav',
    'header',
    'footer',
    'aside',
    '.nav',
    '.navigation',
    '.navbar',
    '.header',
    '.footer',
    '.sidebar',
    '.advertisement',
    '.ads',
    '.ad',
    '.social-share',
    '.share-buttons',
    '.comments',
    '.comment-section',
    '.related-posts',
    '.recommendations',
    '.breadcrumb',
    '.breadcrumbs',
    '.menu',
    '.menu-item',
    '.search',
    '.search-box',
    '.newsletter',
    '.subscribe',
    '.cookie-notice',
    '.privacy-notice',
    '.banner',
    '.popup',
    '.modal',
    '.overlay',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '[aria-label*="navigation"]',
    '[aria-label*="menu"]',
    '[class*="nav"]',
    '[class*="menu"]',
    '[class*="header"]',
    '[class*="footer"]',
    '[class*="sidebar"]',
    '[class*="ad"]',
    '[id*="nav"]',
    '[id*="menu"]',
    '[id*="header"]',
    '[id*="footer"]',
    '[id*="sidebar"]',
    '[id*="ad"]'
  ];

  selectorsToRemove.forEach(selector => {
    element.querySelectorAll(selector).forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });

  element.querySelectorAll('script, style, noscript, iframe, embed, object').forEach(el => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function extractReadableText(): string {
  const mainContent = getMainContent();
  if (!mainContent) return '';

  const clone = mainContent.cloneNode(true) as HTMLElement;
  removeNonContentElements(clone);

  let text = clone.innerText || clone.textContent || '';
  text = cleanText(text);

  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 10 || trimmed.length === 0;
  });

  return lines.join('\n').trim();
}

function sendTextToBackground(): void {
  const text = extractReadableText();
  if (text.length < 50) {
    console.log('Starlet25: Not enough text content found');
    return;
  }

  const message: ExtractedText = {
    type: 'PAGE_TEXT',
    text: text,
    url: window.location.href,
    title: document.title,
    timestamp: Date.now()
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Starlet25: Error sending message to background:', chrome.runtime.lastError.message);
    } else if (response) {
      console.log('Starlet25: Message sent successfully to background');
    }
  });

  console.log('Starlet25: Extracted text length:', text.length);
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'EXTRACT_TEXT') {
    const text = extractReadableText();
    sendResponse({ text, url: window.location.href, title: document.title });
  }
  
  // Handle accessibility toggle
  if (request.action === 'TOGGLE_ACCESSIBILITY') {
    const { enabled } = request;
    accessibilityEnabled = enabled;
    
    console.log('Starlet25: Toggling accessibility to:', enabled);
    
    if (enabled) {
      attachAccessibilityListener();
    } else {
      removeAccessibilityListener();
      hideReadingIndicator();
    }
    
    // Verify the state after toggle
    setTimeout(() => {
      console.log('Starlet25: After toggle - accessibilityEnabled:', accessibilityEnabled, 'keydownListener:', !!keydownListener);
    }, 100);
    
    sendResponse({ success: true });
  }
  
  // Handle accessibility status check
  if (request.action === 'GET_ACCESSIBILITY_STATUS') {
    sendResponse({ enabled: accessibilityEnabled });
  }
  
  // Handle voice assistant start
  if (request.action === 'START_VOICE_ASSISTANT') {
    console.log('🎤 Starlet25: Received START_VOICE_ASSISTANT command in content script');
    try {
      console.log('🎤 Starlet25: voiceAssistant object:', voiceAssistant);
      console.log('🎤 Starlet25: voiceAssistant.isSupported():', voiceAssistant.isSupported());
      
      if (voiceAssistant.isSupported()) {
        console.log('🎤 Starlet25: Voice assistant is supported, calling startListening()');
        voiceAssistant.startListening();
        console.log('🎤 Starlet25: startListening() called successfully');
        sendResponse({ success: true });
      } else {
        console.error('🎤 Starlet25: Voice assistant not supported');
        sendResponse({ success: false, error: 'Voice assistant not supported' });
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error starting voice assistant:', error);
      sendResponse({ success: false, error: 'Failed to start voice assistant' });
    }
  }
  
  // Handle saturation filter
  if (request.action === 'APPLY_SATURATION_FILTER') {
    console.log('🎨 Starlet25: Received APPLY_SATURATION_FILTER command in content script');
    try {
      const { saturation } = request;
      console.log('🎨 Starlet25: Applying saturation filter:', saturation + '%');
      
      // Remove existing saturation filter if any
      const existingFilter = document.getElementById('starlet25-saturation-filter');
      if (existingFilter) {
        existingFilter.remove();
      }
      
      // Only apply filter if saturation is not 100% (normal)
      if (saturation !== 100) {
        // Create new style element for saturation filter
        const styleElement = document.createElement('style');
        styleElement.id = 'starlet25-saturation-filter';
        styleElement.textContent = `
          html {
            filter: saturate(${saturation}%) !important;
          }
        `;
        
        // Add the style to the document head
        document.head.appendChild(styleElement);
        console.log('🎨 Starlet25: Saturation filter applied successfully');
      } else {
        console.log('🎨 Starlet25: Saturation reset to normal (100%)');
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('🎨 Starlet25: Error applying saturation filter:', error);
      sendResponse({ success: false, error: 'Failed to apply saturation filter' });
    }
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.accessibilityEnabled) {
    accessibilityEnabled = changes.accessibilityEnabled.newValue === true;
    
    console.log('Starlet25: Storage changed - accessibilityEnabled:', accessibilityEnabled);
    
    if (accessibilityEnabled && !keydownListener) {
      console.log('Starlet25: Enabling accessibility from storage change');
      attachAccessibilityListener();
    } else if (!accessibilityEnabled && keydownListener) {
      console.log('Starlet25: Disabling accessibility from storage change');
      removeAccessibilityListener();
      hideReadingIndicator();
    }
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    sendTextToBackground();
    checkAccessibilityStatus();
  });
} else {
  sendTextToBackground();
  checkAccessibilityStatus();
}

let lastTextLength = 0;
const observer = new MutationObserver(() => {
  const text = extractReadableText();
  if (Math.abs(text.length - lastTextLength) > 100) {
    lastTextLength = text.length;
    sendTextToBackground();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  removeAccessibilityListener();
  hideReadingIndicator();
});

// Test function to manually trigger reading (for debugging)
function testAccessibilityReading() {
  console.log('Starlet25: Testing accessibility reading...');
  console.log('Starlet25: Current state - accessibilityEnabled:', accessibilityEnabled, 'keydownListener:', !!keydownListener);
  
  if (accessibilityEnabled) {
    readVisibleContent();
  } else {
    console.log('Starlet25: Accessibility is disabled');
  }
}

// Expose test function globally for debugging
(window as any).testStarlet25Accessibility = testAccessibilityReading;

// Expose voice assistant test function globally for debugging
(window as any).testStarlet25VoiceAssistant = () => {
  console.log('🎤 Starlet25: Testing voice assistant manually...');
  console.log('🎤 Starlet25: voiceAssistant object:', voiceAssistant);
  console.log('🎤 Starlet25: voiceAssistant.isSupported():', voiceAssistant.isSupported());
  
  if (voiceAssistant.isSupported()) {
    console.log('🎤 Starlet25: Starting voice assistant test...');
    voiceAssistant.startListening();
    return 'Voice assistant started successfully';
  } else {
    console.error('🎤 Starlet25: Voice assistant not supported');
    return 'Voice assistant not supported';
  }
};
