// Content script for extracting main page text
// Avoids navbars, footers, sidebars, and other non-content elements

console.log('Starlet25 content script loaded');

interface ExtractedText {
  type: 'PAGE_TEXT';
  text: string;
  url: string;
  title: string;
  timestamp: number;
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
    if (element) {
      return element as HTMLElement;
    }
  }

  // Fallback: find the largest text container
  const textContainers = Array.from(document.querySelectorAll('div, section, p'))
    .filter(el => {
      const text = el.textContent || '';
      return text.length > 200 && !el.querySelector('nav, header, footer, aside');
    })
    .sort((a, b) => (b.textContent?.length || 0) - (a.textContent?.length || 0));

  return textContainers[0] as HTMLElement || null;
}

function removeNonContentElements(element: HTMLElement): void {
  // Remove navigation elements
  const navSelectors = [
    'nav',
    'header',
    'footer',
    'aside',
    '.nav',
    '.navigation',
    '.menu',
    '.sidebar',
    '.footer',
    '.header',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]'
  ];

  navSelectors.forEach(selector => {
    const elements = element.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Remove common non-content elements
  const nonContentSelectors = [
    '.ad',
    '.advertisement',
    '.banner',
    '.popup',
    '.modal',
    '.overlay',
    '.cookie-banner',
    '.newsletter-signup',
    '.social-share',
    '.comments',
    '.related-posts',
    '.recommendations'
  ];

  nonContentSelectors.forEach(selector => {
    const elements = element.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Remove script and style elements
  const scriptAndStyleElements = element.querySelectorAll('script, style, noscript');
  scriptAndStyleElements.forEach(el => el.remove());
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
      
      // Also clear any inline filters
      document.documentElement.style.filter = '';
      document.body.style.filter = '';
      
      // Only apply filter if saturation is not 100% (normal)
      if (saturation !== 100) {
        // Try multiple approaches for better compatibility
        
        // Method 1: Style element (preferred)
        try {
          const styleElement = document.createElement('style');
          styleElement.id = 'starlet25-saturation-filter';
          styleElement.textContent = `
            html {
              filter: saturate(${saturation}%) !important;
            }
          `;
          document.head.appendChild(styleElement);
          console.log('🎨 Starlet25: Saturation filter applied via style element');
        } catch (styleError) {
          console.warn('🎨 Style element method failed, trying inline:', styleError);
          
          // Method 2: Inline style on html element
          try {
            document.documentElement.style.filter = `saturate(${saturation}%)`;
            console.log('🎨 Starlet25: Saturation filter applied via inline style');
          } catch (inlineError) {
            console.warn('🎨 Inline style method failed, trying body:', inlineError);
            
            // Method 3: Inline style on body element
            document.body.style.filter = `saturate(${saturation}%)`;
            console.log('🎨 Starlet25: Saturation filter applied via body style');
          }
        }
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

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    sendTextToBackground();
  });
} else {
  sendTextToBackground();
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
