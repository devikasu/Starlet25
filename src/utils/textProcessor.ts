// Text processing utilities for extracted page content

export interface ProcessedText {
  originalText: string;
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number; // in minutes
  summary: string;
  keywords: string[];
  language: string;
  hasCode: boolean;
  hasLinks: boolean;
  processedAt: number;
}

export function processExtractedText(text: string): ProcessedText {
  const cleanedText = cleanText(text);
  const wordCount = countWords(cleanedText);
  const characterCount = cleanedText.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/minute
  const summary = generateSummary(cleanedText);
  const keywords = extractKeywords(cleanedText);
  const language = detectLanguage(cleanedText);
  const hasCode = detectCodeBlocks(text);
  const hasLinks = detectLinks(text);

  return {
    originalText: text,
    wordCount,
    characterCount,
    estimatedReadingTime,
    summary,
    keywords,
    language,
    hasCode,
    hasLinks,
    processedAt: Date.now()
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function generateSummary(text: string, maxLength: number = 200): string {
  // Simple summary: take first few sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let summary = '';
  
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) {
      break;
    }
    summary += sentence + '. ';
  }
  
  return summary.trim() || text.substring(0, maxLength) + '...';
}

function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction based on word frequency
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words
  
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function detectLanguage(text: string): string {
  // Simple language detection based on common words
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te'];
  
  const words = text.toLowerCase().split(/\s+/);
  let englishCount = 0;
  let spanishCount = 0;
  
  words.forEach(word => {
    if (englishWords.includes(word)) englishCount++;
    if (spanishWords.includes(word)) spanishCount++;
  });
  
  if (englishCount > spanishCount) return 'en';
  if (spanishCount > englishCount) return 'es';
  return 'unknown';
}

function detectCodeBlocks(text: string): boolean {
  // Check for common code indicators
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /if\s*\(/,
    /for\s*\(/,
    /while\s*\(/,
    /class\s+\w+/,
    /import\s+/,
    /export\s+/,
    /console\.log/,
    /return\s+/,
    /=>\s*/,
    /{[\s\S]*}/,
    /\[[\s\S]*\]/,
    /\([\s\S]*\)/
  ];
  
  return codePatterns.some(pattern => pattern.test(text));
}

function detectLinks(text: string): boolean {
  // Check for URL patterns
  const urlPattern = /https?:\/\/[^\s]+/g;
  return urlPattern.test(text);
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

export function formatWordCount(count: number): string {
  if (count === 1) return '1 word';
  return `${count.toLocaleString()} words`;
}

export function formatCharacterCount(count: number): string {
  return `${count.toLocaleString()} characters`;
} 