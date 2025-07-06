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

let isOverlayActive = false;

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'EXTRACT_TEXT') {
    const text = extractReadableText();
    sendResponse({ text, url: window.location.href, title: document.title });
  }
  
  if (request.action === 'START_VOICE_ASSISTANT') {
    console.log('🎤 Starlet25: Received START_VOICE_ASSISTANT command in content script');
    sendResponse({ success: true, message: 'Voice assistant ready' });
  }
  
  if (request.action === 'EXTRACT_CURRENT_PAGE') {
    const extractedText = extractMainContent();
    const processedText = processText(extractedText);
    
    sendResponse({
      success: true,
      text: extractedText,
      processed: processedText
    });
  } else if (request.action === 'SHOW_FLASHCARD_OVERLAY') {
    console.log('Content script: Received SHOW_FLASHCARD_OVERLAY message');
    console.log('Content script: Flashcards:', request.flashcards);
    console.log('Content script: Summary:', request.summary);
    showFlashcardOverlay(request.flashcards, request.summary);
    sendResponse({ success: true });
  } else if (request.action === 'SHOW_VOICE_FLASHCARD') {
    showVoiceFlashcard(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'HIDE_OVERLAY') {
    hideOverlay();
    sendResponse({ success: true });
  } else if (request.action === 'APPLY_SATURATION_FILTER') {
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
  
  return true; // Keep the message channel open for async response
});

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

// Extract main content from the page
function extractMainContent(): string {
  // Remove common non-content elements
  const elementsToRemove = [
    'nav', 'header', 'footer', 'aside', 'menu',
    '.navigation', '.header', '.footer', '.sidebar', '.menu',
    '.ad', '.advertisement', '.banner', '.popup',
    'script', 'style', 'noscript'
  ];
  
  // Clone the body to avoid modifying the original page
  const bodyClone = document.body.cloneNode(true) as HTMLElement;
  
  // Remove unwanted elements
  elementsToRemove.forEach(selector => {
    const elements = bodyClone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // Get text content
  let text = bodyClone.textContent || '';
  
  // Clean up the text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
  
  return text;
}

// Process extracted text
function processText(text: string) {
  const words = text.split(/\s+/).length;
  const characters = text.length;
  const estimatedReadingTime = Math.ceil(words / 200); // 200 words per minute
  
  return {
    wordCount: words,
    characterCount: characters,
    estimatedReadingTime,
    language: 'en',
    hasCode: /<code>|<pre>|function|class|const|let|var/.test(text),
    hasLinks: /<a\s+href/.test(text),
    keywords: extractKeywords(text)
  };
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Show flashcard overlay on the webpage
function showFlashcardOverlay(flashcards: string[], summary?: string) {
  if (isOverlayActive) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'starlet25-flashcard-overlay';
  overlay.innerHTML = `
    <div class="starlet25-overlay-container">
      <div class="starlet25-flashcard-content">
        <div class="starlet25-header">
          <h2>Study Notes</h2>
          <button class="starlet25-close-btn">×</button>
        </div>
        <div class="starlet25-card-content">
          <p class="starlet25-card-text">${flashcards[0] || 'No content available'}</p>
        </div>
        <div class="starlet25-navigation">
          <button class="starlet25-nav-btn starlet25-prev-btn">← Previous</button>
          <div class="starlet25-progress">
            ${flashcards.map((_, i) => `<span class="starlet25-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
          <button class="starlet25-nav-btn starlet25-next-btn">Next →</button>
        </div>
        ${summary ? `
        <div class="starlet25-summary-section">
          <button class="starlet25-summary-toggle">📋 Show Summary</button>
          <div class="starlet25-summary-content" style="display: none;">
            <h3>�� Page Summary</h3>
            <p>${summary}</p>
            <div class="starlet25-summary-actions">
              <button class="starlet25-speak-summary">🔊 Read</button>
              <button class="starlet25-download-summary">📥 Download</button>
              <button class="starlet25-download-braille">📄 Download for Braille</button>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #starlet25-flashcard-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(4px);
    }
    
    .starlet25-overlay-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      width: 95%;
      max-width: 900px;
      min-height: 85vh;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      padding: 40px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .starlet25-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 24px;
    }
    
    .starlet25-header h2 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    
    .starlet25-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    .starlet25-close-btn:hover {
      opacity: 1;
    }
    
    .starlet25-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      min-height: 300px;
      padding: 20px 0;
    }
    
    .starlet25-card-text {
      font-size: clamp(20px, 4vw, 32px);
      font-weight: 600;
      text-align: center;
      line-height: 1.5;
      margin: 0;
      max-width: 100%;
      word-wrap: break-word;
      hyphens: auto;
    }
    
    .starlet25-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 32px;
    }
    
    .starlet25-nav-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      backdrop-filter: blur(8px);
    }
    
    .starlet25-nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .starlet25-nav-btn:disabled {
      background: rgba(255, 255, 255, 0.1);
      cursor: not-allowed;
    }
    
    .starlet25-progress {
      display: flex;
      gap: 8px;
    }
    
    .starlet25-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .starlet25-dot.active {
      background: white;
    }
    
    .starlet25-dot:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    
    .starlet25-summary-section {
      width: 100%;
      margin-top: 24px;
    }
    
    .starlet25-summary-toggle {
      width: 100%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      backdrop-filter: blur(8px);
    }
    
    .starlet25-summary-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .starlet25-summary-content {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 24px;
      margin-top: 16px;
      color: #333;
    }
    
    .starlet25-summary-content h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    
    .starlet25-summary-content p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    
    .starlet25-summary-actions {
      display: flex;
      gap: 8px;
    }
    
    .starlet25-summary-actions button {
      background: #3b82f6;
      border: none;
      color: white;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .starlet25-summary-actions button:hover {
      background: #2563eb;
    }
    
    .starlet25-download-braille {
      background: #059669 !important;
    }
    
    .starlet25-download-braille:hover {
      background: #047857 !important;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  // Add global functions for navigation
  let currentCardIndex = 0;
  const cardText = overlay.querySelector('.starlet25-card-text') as HTMLElement;
  const dots = overlay.querySelectorAll('.starlet25-dot');
  const summaryContent = overlay.querySelector('.starlet25-summary-content') as HTMLElement;
  const summaryToggle = overlay.querySelector('.starlet25-summary-toggle') as HTMLButtonElement;
  
  // Debug logs for summary elements
  console.log('Debug - summaryToggle found:', !!summaryToggle);
  console.log('Debug - summaryContent found:', !!summaryContent);
  console.log('Debug - summary text:', summary);
  console.log('Debug - Overlay created and appended to body');
  console.log('Debug - Overlay element:', overlay);

  // Attach event listeners for navigation and summary actions
  const prevBtn = overlay.querySelector('.starlet25-prev-btn') as HTMLButtonElement;
  const nextBtn = overlay.querySelector('.starlet25-next-btn') as HTMLButtonElement;
  const closeBtn = overlay.querySelector('.starlet25-close-btn') as HTMLButtonElement;
  const speakBtn = overlay.querySelector('.starlet25-speak-summary') as HTMLButtonElement;
  const downloadBtn = overlay.querySelector('.starlet25-download-summary') as HTMLButtonElement;
  const downloadBrailleBtn = overlay.querySelector('.starlet25-download-braille') as HTMLButtonElement;

  prevBtn?.addEventListener('click', () => {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      updateCard();
    }
  });
  nextBtn?.addEventListener('click', () => {
    if (currentCardIndex < flashcards.length - 1) {
      currentCardIndex++;
      updateCard();
    }
  });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentCardIndex = i;
      updateCard();
    });
  });
  closeBtn?.addEventListener('click', () => {
    overlay.remove();
  });
  if (summaryToggle) {
    console.log('Debug - Adding event listener to summary toggle');
    summaryToggle.addEventListener('click', () => {
      console.log('Debug - Summary toggle clicked!');
      if (!summaryContent) {
        console.warn('Summary content element not found!');
        return;
      }
      const isVisible = summaryContent.style.display !== 'none';
      console.log('Debug - Current visibility:', isVisible);
      summaryContent.style.display = isVisible ? 'none' : 'block';
      summaryToggle.textContent = isVisible ? '📋 Show Summary' : '📋 Hide Summary';
      console.log('Summary toggle clicked. Now visible:', !isVisible);
    });
  } else {
    console.warn('Debug - Summary toggle button not found!');
  }
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(summary);
        window.speechSynthesis.speak(utterance);
      }
    });
  }
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const content = `Page Summary\n${'='.repeat(50)}\n\n${summary}\n\nStudy Notes\n${'='.repeat(50)}\n\n${flashcards.map((note, index) => `${index + 1}. ${note}`).join('\n\n')}\n\nGenerated on: ${new Date().toLocaleString()}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_notes_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
  
  if (downloadBrailleBtn) {
    downloadBrailleBtn.addEventListener('click', () => {
      // Format content specifically for Braille conversion
      const brailleContent = formatForBraille(summary || 'No summary available', flashcards);
      const blob = new Blob([brailleContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braille_study_notes_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
  
  function updateCard() {
    cardText.textContent = flashcards[currentCardIndex] || 'No content available';
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentCardIndex);
    });
  }
  
  // Add keyboard navigation
  const handleKeyPress = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        if (currentCardIndex < flashcards.length - 1) {
          currentCardIndex++;
          updateCard();
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentCardIndex > 0) {
          currentCardIndex--;
          updateCard();
        }
        break;
      case 'Escape':
        event.preventDefault();
        overlay.remove();
        break;
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  
  // Cleanup when overlay is removed
  overlay.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyPress);
    isOverlayActive = false;
  });
  
  isOverlayActive = true;
}

// Show voice flashcard overlay
function showVoiceFlashcard(content: string) {
  // Similar implementation for voice flashcards
  // This would create a voice-interactive overlay
  console.log('Voice flashcard requested for content:', content);
}

// Hide overlay
function hideOverlay() {
  const overlay = document.getElementById('starlet25-flashcard-overlay');
  if (overlay) {
    overlay.remove();
    isOverlayActive = false;
  }
}

// Format content specifically for Braille conversion
function formatForBraille(summary: string, flashcards: string[]): string {
  // Braille formatting guidelines:
  // - Use simple punctuation
  // - Avoid complex formatting
  // - Use clear section breaks
  // - Keep lines at reasonable length
  // - Use descriptive headers
  
  const lines: string[] = [];
  
  // Header
  lines.push('STUDY NOTES FOR BRAILLE CONVERSION');
  lines.push('='.repeat(40));
  lines.push('');
  
  // Summary section
  lines.push('PAGE SUMMARY');
  lines.push('-'.repeat(20));
  lines.push('');
  
  // Format summary for Braille (simple, clear sentences)
  const summaryLines = summary
    .split('. ')
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .map(sentence => sentence + '.');
  
  lines.push(...summaryLines);
  lines.push('');
  
  // Flashcards section
  lines.push('STUDY FLASHCARDS');
  lines.push('-'.repeat(20));
  lines.push('');
  
  // Format flashcards for Braille
  flashcards.forEach((flashcard, index) => {
    lines.push(`CARD ${index + 1}:`);
    lines.push(flashcard);
    lines.push('');
  });
  
  // Footer
  lines.push('END OF STUDY NOTES');
  lines.push('='.repeat(40));
  lines.push(`Generated on: ${new Date().toLocaleString()}`);
  lines.push('Formatted for Braille conversion');
  
  return lines.join('\n');
}

// Apply saturation filter
function applySaturationFilter(saturation: number) {
  const style = document.getElementById('starlet25-saturation-filter') || 
               document.createElement('style');
  style.id = 'starlet25-saturation-filter';
  style.textContent = `* { filter: saturate(${saturation}%) !important; }`;
  if (!document.getElementById('starlet25-saturation-filter')) {
    document.head.appendChild(style);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    sendTextToBackground();
  });
} else {
  sendTextToBackground();
}

// Monitor for content changes
let lastTextLength = 0;
const observer = new MutationObserver(() => {
  const currentText = extractReadableText();
  if (Math.abs(currentText.length - lastTextLength) > 100) {
    lastTextLength = currentText.length;
    sendTextToBackground();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
