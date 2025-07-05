// Content script for extracting main page text
// Avoids navbars, footers, sidebars, and other non-content elements

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

  chrome.runtime.sendMessage(message).catch(error => {
    console.log('Starlet25: Error sending message to background:', error);
  });

  console.log('Starlet25: Extracted text length:', text.length);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_TEXT') {
    const text = extractReadableText();
    sendResponse({ text, url: window.location.href, title: document.title });
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendTextToBackground);
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
