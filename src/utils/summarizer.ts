// Offline summarizer and flashcard generator

export interface Summary {
  text: string;
  keyPoints: string[];
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-1
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  type: 'definition' | 'concept' | 'fact' | 'process';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  readingTime: string; // e.g., '3 sec'
}

export interface SummarizationResult {
  summary: Summary;
  flashcards: Flashcard[];
  generatedAt: number;
  isFallback?: boolean;
}

// Common technical terms and concepts
const TECHNICAL_TERMS = [
  'algorithm', 'API', 'database', 'framework', 'function', 'method', 'object', 'class',
  'variable', 'loop', 'condition', 'array', 'string', 'integer', 'boolean', 'null',
  'undefined', 'callback', 'promise', 'async', 'await', 'module', 'package', 'library',
  'dependency', 'version', 'deployment', 'production', 'development', 'testing',
  'debugging', 'optimization', 'performance', 'security', 'authentication', 'authorization',
  'encryption', 'compression', 'caching', 'scaling', 'microservices', 'monolith',
  'frontend', 'backend', 'fullstack', 'responsive', 'accessibility', 'SEO'
];

// Common programming concepts
const PROGRAMMING_CONCEPTS = [
  'Object-Oriented Programming', 'Functional Programming', 'Procedural Programming',
  'Event-Driven Programming', 'Reactive Programming', 'Declarative Programming',
  'Imperative Programming', 'SOLID Principles', 'DRY Principle', 'KISS Principle',
  'Design Patterns', 'Data Structures', 'Algorithms', 'Big O Notation',
  'Memory Management', 'Garbage Collection', 'Threading', 'Concurrency',
  'Asynchronous Programming', 'Error Handling', 'Logging', 'Monitoring'
];

// Default fallback flashcards
const FALLBACK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fallback_1',
    question: "What is this page about?",
    answer: "This page contains general information relevant to the user. The content has been extracted but could not be automatically summarized.",
    type: 'concept',
    difficulty: 'easy',
    tags: ['general', 'fallback'],
    readingTime: '3 sec'
  },
  {
    id: 'fallback_2',
    question: "What can the user do with this extension?",
    answer: "Extract text from web pages, summarize content, generate flashcards for learning, and analyze page content for better understanding.",
    type: 'concept',
    difficulty: 'easy',
    tags: ['extension', 'fallback'],
    readingTime: '3 sec'
  },
  {
    id: 'fallback_3',
    question: "How does text extraction work?",
    answer: "The extension identifies main content areas, removes navigation elements, and extracts clean text while avoiding ads, footers, and sidebars.",
    type: 'process',
    difficulty: 'medium',
    tags: ['extraction', 'fallback'],
    readingTime: '3 sec'
  },
  {
    id: 'fallback_4',
    question: "What types of content can be processed?",
    answer: "Articles, documentation, tutorials, blog posts, and any text-based content. The extension works best with structured, informative content.",
    type: 'fact',
    difficulty: 'easy',
    tags: ['content', 'fallback'],
    readingTime: '3 sec'
  },
  {
    id: 'fallback_5',
    question: "How can I use the text-to-speech feature?",
    answer: "Click the 🔊 Speak Summary button to have the page summary read aloud using your browser's text-to-speech capabilities.",
    type: 'process',
    difficulty: 'easy',
    tags: ['speech', 'fallback'],
    readingTime: '3 sec'
  },
  {
    id: 'fallback_6',
    question: "What are the different flashcard types?",
    answer: "Definition cards explain terms, concept cards cover ideas, fact cards present information, and process cards describe how things work.",
    type: 'concept',
    difficulty: 'medium',
    tags: ['flashcards', 'fallback'],
    readingTime: '3 sec'
  }
];

export function summarizeText(text: string): SummarizationResult {
  const sentences = extractSentences(text);
  const topics = identifyTopics(text);
  const difficulty = assessDifficulty(text);
  
  // Generate summary
  const summary: Summary = {
    text: generateSummaryText(sentences),
    keyPoints: extractKeyPoints(sentences),
    topics: topics,
    difficulty: difficulty,
    confidence: calculateConfidence(text)
  };

  // Generate flashcards
  let flashcards = generateFlashcards(text, topics, difficulty);
  let isFallback = false;

  // Fallback logic: if no flashcards generated or summarization failed
  if (!flashcards || flashcards.length === 0 || summary.confidence < 0.3) {
    flashcards = [...FALLBACK_FLASHCARDS];
    isFallback = true;
    console.log('Starlet25: Using fallback flashcards due to low confidence or no content');
  }

  return {
    summary,
    flashcards,
    generatedAt: Date.now(),
    isFallback
  };
}

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200)
    .slice(0, 20); // Limit to first 20 sentences
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'just', 'into', 'than', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'people', 'only', 'well', 'also', 'over', 'still', 'take', 'every', 'think', 'here', 'again', 'another', 'around', 'because', 'before', 'should', 'through', 'during', 'first', 'going', 'great', 'might', 'never', 'often', 'place', 'right', 'small', 'sound', 'their', 'there', 'those', 'under', 'until', 'water', 'where', 'which', 'while', 'world', 'years', 'after', 'being', 'could', 'every', 'found', 'going', 'having', 'large', 'learn', 'never', 'other', 'place', 'right', 'small', 'sound', 'their', 'there', 'those', 'under', 'until', 'water', 'where', 'which', 'while', 'world', 'years'].includes(word));
}

function identifyTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for programming/tech topics
  if (TECHNICAL_TERMS.some(term => lowerText.includes(term))) {
    topics.push('Programming');
  }
  
  if (PROGRAMMING_CONCEPTS.some(concept => lowerText.includes(concept.toLowerCase()))) {
    topics.push('Software Development');
  }
  
  // Check for common topic indicators
  if (lowerText.includes('api') || lowerText.includes('endpoint')) {
    topics.push('APIs');
  }
  
  if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('query')) {
    topics.push('Databases');
  }
  
  if (lowerText.includes('react') || lowerText.includes('vue') || lowerText.includes('angular')) {
    topics.push('Frontend Frameworks');
  }
  
  if (lowerText.includes('node') || lowerText.includes('express') || lowerText.includes('server')) {
    topics.push('Backend Development');
  }
  
  if (lowerText.includes('test') || lowerText.includes('testing') || lowerText.includes('unit')) {
    topics.push('Testing');
  }
  
  if (lowerText.includes('deploy') || lowerText.includes('production') || lowerText.includes('hosting')) {
    topics.push('Deployment');
  }
  
  if (lowerText.includes('security') || lowerText.includes('authentication') || lowerText.includes('encryption')) {
    topics.push('Security');
  }
  
  // Default topic if none identified
  if (topics.length === 0) {
    topics.push('General');
  }
  
  return topics.slice(0, 3); // Limit to 3 topics
}

function assessDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const words = extractWords(text);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const sentenceCount = extractSentences(text).length;
  const technicalTermCount = TECHNICAL_TERMS.filter(term => 
    text.toLowerCase().includes(term)
  ).length;
  
  let score = 0;
  score += avgWordLength > 8 ? 2 : avgWordLength > 6 ? 1 : 0;
  score += sentenceCount > 15 ? 2 : sentenceCount > 10 ? 1 : 0;
  score += technicalTermCount > 5 ? 2 : technicalTermCount > 2 ? 1 : 0;
  
  if (score >= 5) return 'hard';
  if (score >= 2) return 'medium';
  return 'easy';
}

function calculateConfidence(text: string): number {
  const words = extractWords(text);
  const sentences = extractSentences(text);
  
  // Higher confidence for longer, well-structured content
  let confidence = 0.5; // Base confidence
  
  if (words.length > 100) confidence += 0.2;
  if (sentences.length > 5) confidence += 0.1;
  if (TECHNICAL_TERMS.some(term => text.toLowerCase().includes(term))) confidence += 0.1;
  if (text.includes('function') || text.includes('class') || text.includes('method')) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function generateSummaryText(sentences: string[]): string {
  if (sentences.length === 0) return "No content available for summarization.";
  
  // Take first 2-3 meaningful sentences and make them more concise
  const summarySentences = sentences
    .filter(s => s.length > 20 && s.length < 120)
    .slice(0, 3)
    .map(sentence => {
      // Make sentences more concise by removing unnecessary words
      return sentence
        .replace(/\b(this|that|these|those|it|they|them)\b/gi, '')
        .replace(/\b(is|are|was|were)\s+(a|an|the)\s+/gi, 'is ')
        .replace(/\s+/g, ' ')
        .trim();
    });
  
  if (summarySentences.length === 0) {
    return sentences[0] || "Content extracted but too short for meaningful summary.";
  }
  
  // Join with better punctuation and ensure it's not too long
  let summary = summarySentences.join('. ');
  if (!summary.endsWith('.')) summary += '.';
  
  // Limit to 200 characters for better readability
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }
  
  return summary;
}

function extractKeyPoints(sentences: string[]): string[] {
  return sentences
    .filter(s => s.length > 20 && s.length < 100)
    .slice(0, 4)
    .map(s => {
      // Make key points more concise
      return s
        .replace(/\b(this|that|these|those)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 80); // Limit length
    });
}

function generateFlashcards(text: string, topics: string[], difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] {
  const flashcards: Flashcard[] = [];
  
  // Generate Q&A cards (more detailed)
  const qaCards = generateQACards(text, topics, difficulty);
  flashcards.push(...qaCards);
  
  // Generate revision cards (concise)
  const revisionCards = generateRevisionCards(text, topics, difficulty);
  flashcards.push(...revisionCards);
  
  return flashcards.slice(0, 12); // Limit to 12 flashcards total
}

function generateQACards(text: string, topics: string[], difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] {
  const cards: Flashcard[] = [];
  const sentences = extractSentences(text);

  // Use only the first 4 sentences for Q&A cards
  sentences.slice(0, 4).forEach((sentence, index) => {
    const question = makeQuestion(sentence);
    const answer = simplify(sentence);
    cards.push({
      id: `qa_simple_${index}`,
      question,
      answer,
      type: 'concept',
      difficulty,
      tags: [...topics, 'qa'],
      readingTime: estimateReadingTime(answer)
    });
  });

  // Add a definition card if a technical term is found
  const technicalTerm = TECHNICAL_TERMS.find(term => text.toLowerCase().includes(term));
  if (technicalTerm) {
    const defAnswer = simplify(generateDefinitionAnswer(technicalTerm, text));
    cards.push({
      id: `qa_def_${technicalTerm}`,
      question: `What is ${technicalTerm}?`,
      answer: defAnswer,
      type: 'definition',
      difficulty,
      tags: [...topics, 'definition', 'qa'],
      readingTime: estimateReadingTime(defAnswer)
    });
  }

  return cards.slice(0, 5); // Limit to 5 Q&A cards
}

function generateRevisionCards(text: string, topics: string[], difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] {
  const cards: Flashcard[] = [];
  const sentences = extractSentences(text);

  // Use only the next 3 sentences for revision cards
  sentences.slice(4, 7).forEach((sentence, index) => {
    const question = makeQuestion(sentence);
    const answer = simplify(sentence);
    cards.push({
      id: `rev_simple_${index}`,
      question,
      answer,
      type: 'fact',
      difficulty,
      tags: [...topics, 'revision'],
      readingTime: estimateReadingTime(answer)
    });
  });

  // Add a keyword definition card if a keyword is found
  const words = extractWords(text);
  const keyword = words.find(word => TECHNICAL_TERMS.includes(word));
  if (keyword) {
    const defAnswer = simplify(generateShortDefinition(keyword));
    cards.push({
      id: `rev_keyword_${keyword}`,
      question: `Define: ${keyword}`,
      answer: defAnswer,
      type: 'definition',
      difficulty,
      tags: [...topics, 'keyword', 'revision'],
      readingTime: estimateReadingTime(defAnswer)
    });
  }

  return cards.slice(0, 3); // Limit to 3 revision cards
}

function generateShortDefinition(term: string): string {
  const shortDefinitions: { [key: string]: string } = {
    'api': 'Interface for software communication',
    'function': 'Reusable code block',
    'variable': 'Data storage container',
    'class': 'Object blueprint',
    'method': 'Class function',
    'object': 'Class instance',
    'array': 'Ordered data collection',
    'string': 'Text sequence',
    'database': 'Structured data storage',
    'framework': 'Development foundation',
    'algorithm': 'Problem-solving steps',
    'loop': 'Repeated execution',
    'condition': 'Decision logic',
    'callback': 'Function reference',
    'promise': 'Async operation result',
    'module': 'Code organization unit',
    'package': 'Dependency bundle',
    'library': 'Reusable code collection',
    'dependency': 'Required external code',
    'deployment': 'Application release',
    'testing': 'Code verification',
    'debugging': 'Error fixing',
    'optimization': 'Performance improvement',
    'security': 'Protection measures',
    'authentication': 'User verification',
    'encryption': 'Data protection',
    'caching': 'Temporary storage',
    'scaling': 'Performance expansion',
    'frontend': 'User interface',
    'backend': 'Server logic',
    'responsive': 'Adaptive design',
    'accessibility': 'Universal access',
    'seo': 'Search optimization'
  };
  
  return shortDefinitions[term.toLowerCase()] || `${term}: technical concept`;
}

function generateDefinitionAnswer(term: string, context: string): string {
  // Simple definition generation based on context
  const sentences = extractSentences(context);
  const relevantSentence = sentences.find(s => 
    s.toLowerCase().includes(term.toLowerCase())
  );
  
  if (relevantSentence) {
    return relevantSentence;
  }
  
  // Fallback definitions
  const fallbackDefinitions: { [key: string]: string } = {
    'api': 'An Application Programming Interface (API) is a set of rules and protocols that allows different software applications to communicate with each other.',
    'function': 'A function is a reusable block of code that performs a specific task and can be called from other parts of the program.',
    'variable': 'A variable is a container that stores data values and can be referenced and manipulated throughout a program.',
    'class': 'A class is a blueprint for creating objects that defines their properties and methods.',
    'method': 'A method is a function that belongs to a class or object and defines the behavior of that class or object.',
    'object': 'An object is an instance of a class that contains data and code to manipulate that data.',
    'array': 'An array is a data structure that stores a collection of elements in a specific order.',
    'string': 'A string is a sequence of characters used to represent text in programming.',
    'database': 'A database is an organized collection of structured information or data stored electronically.',
    'framework': 'A framework is a pre-built structure that provides a foundation for developing applications.'
  };
  
  return fallbackDefinitions[term.toLowerCase()] || `${term} is a technical concept used in software development.`;
}

// These functions are no longer used after the flashcard redesign
// but kept for potential future use
// function extractConceptFromSentence(sentence: string): string | null {
//   // Look for concepts in the sentence
//   const conceptPatterns = [
//     /the concept of (\w+)/i,
//     /(\w+) is a/i,
//     /(\w+) refers to/i,
//     /(\w+) means/i
//   ];
//   
//   for (const pattern of conceptPatterns) {
//     const match = sentence.match(pattern);
//     if (match) return match[1];
//   }
//   
//   return null;
// }

// function extractFactFromSentence(sentence: string): string | null {
//   // Look for facts in the sentence
//   const factPatterns = [
//     /(\w+) is (\w+)/i,
//     /(\w+) are (\w+)/i,
//     /(\w+) was (\w+)/i,
//     /(\w+) were (\w+)/i
//   ];
//   
//   for (const pattern of factPatterns) {
//     const match = sentence.match(pattern);
//     if (match) return match[1];
//   }
//   
//   return null;
// }

// function extractProcessFromSentence(sentence: string): string | null {
//   // Look for processes in the sentence
//   const processPatterns = [
//     /the (\w+) process/i,
//     /(\w+) procedure/i,
//     /(\w+) method/i,
//     /steps to (\w+)/i
//   ];
//   
//   for (const pattern of processPatterns) {
//     const match = sentence.match(pattern);
//     if (match) return match[1];
//   }
//   
//   return null;
// }

export function formatSummary(summary: Summary): string {
  return `Summary: ${summary.text}\n\nKey Points:\n${summary.keyPoints.map(point => `• ${point}`).join('\n')}\n\nTopics: ${summary.topics.join(', ')}\nDifficulty: ${summary.difficulty}\nConfidence: ${Math.round(summary.confidence * 100)}%`;
}

export function formatFlashcards(flashcards: Flashcard[]): string {
  return flashcards.map((card, index) => 
    `Card ${index + 1} (${card.type}):\nQ: ${card.question}\nA: ${card.answer}\nTags: ${card.tags.join(', ')}\nReading Time: ${card.readingTime}\n`
  ).join('\n');
}

/**
 * Generates simple flashcards from a summary for the simplified overlay.
 * Returns an array of short note strings (1-2 sentences each).
 */
export function generateFlashcardsFromSummary(summary: Summary): string[] {
  const flashcards: string[] = [];
  
  // Add the main summary as the first card
  if (summary.text) {
    flashcards.push(summary.text);
  }
  
  // Add key points as individual cards
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    summary.keyPoints.forEach(point => {
      if (point.length > 10 && point.length < 200) {
        flashcards.push(point);
      }
    });
  }
  
  // If we don't have enough cards, create some from the summary text
  if (flashcards.length < 3) {
    const sentences = extractSentences(summary.text);
    sentences.slice(0, 5).forEach(sentence => {
      const simplified = simplify(sentence);
      if (simplified.length > 20 && simplified.length < 150 && !flashcards.includes(simplified)) {
        flashcards.push(simplified);
      }
    });
  }
  
  // Ensure we have at least 3 cards
  if (flashcards.length === 0) {
    flashcards.push("This page contains information that can help with learning.");
    flashcards.push("The content has been extracted and summarized for easy reading.");
    flashcards.push("Use these notes to review and remember key points.");
  }
  
  // Limit to 8 cards maximum for simplicity
  return flashcards.slice(0, 8);
}

// --- Accessibility & Readability Helpers ---

/**
 * Converts a sentence into a short, natural question for a flashcard.
 */
function makeQuestion(sentence: string): string {
  // Heuristics for question generation
  if (/\b(is|are|was|were|means|refers to|describes|defines)\b/i.test(sentence)) {
    // Try to extract the subject and make a "What is ...?" question
    const match = sentence.match(/^(.*?)\b(is|are|was|were|means|refers to|describes|defines)\b/i);
    if (match && match[1]) {
      return `What is ${match[1].trim()}?`;
    }
  }
  // Fallback: turn statement into "What about ...?"
  const firstWord = sentence.split(' ')[0];
  if (firstWord && firstWord.length < 15) {
    return `What about ${firstWord}?`;
  }
  // Default fallback
  return 'What is this about?';
}

/**
 * Simplifies a sentence to plain, speech-friendly English.
 */
function simplify(sentence: string): string {
  // Common-sense rewrites
  const replacements: [RegExp, string][] = [
    [/utilizes?/gi, 'uses'],
    [/initialization/gi, 'starting'],
    [/implementation/gi, 'how it works'],
    [/functionality/gi, 'feature'],
    [/methodology/gi, 'method'],
    [/individuals?/gi, 'people'],
    [/commonly/gi, 'often'],
    [/in order to/gi, 'to'],
    [/prior to/gi, 'before'],
    [/subsequent/gi, 'next'],
    [/obtain/gi, 'get'],
    [/demonstrates?/gi, 'shows'],
    [/approximately/gi, 'about'],
    [/assistance/gi, 'help'],
    [/modification/gi, 'change'],
    [/numerous/gi, 'many'],
    [/various/gi, 'different'],
    [/indicates?/gi, 'shows'],
    [/facilitates?/gi, 'helps'],
    [/commences?/gi, 'starts'],
    [/terminates?/gi, 'ends'],
    [/subsequently/gi, 'then'],
    [/consequently/gi, 'so'],
    [/therefore/gi, 'so'],
    [/additionally/gi, 'also'],
    [/approximately/gi, 'about'],
    [/sufficient/gi, 'enough'],
    [/insufficient/gi, 'not enough'],
    [/advantageous/gi, 'helpful'],
    [/disadvantageous/gi, 'not helpful'],
    [/commonly/gi, 'often'],
    [/frequently/gi, 'often'],
    [/subsequent/gi, 'next'],
    [/prior/gi, 'before'],
    [/obtain/gi, 'get'],
    [/demonstrate/gi, 'show'],
    [/approximately/gi, 'about'],
    [/assistance/gi, 'help'],
    [/modification/gi, 'change'],
    [/numerous/gi, 'many'],
    [/various/gi, 'different'],
    [/indicates?/gi, 'shows'],
    [/facilitates?/gi, 'helps'],
    [/commences?/gi, 'starts'],
    [/terminates?/gi, 'ends'],
    [/subsequently/gi, 'then'],
    [/consequently/gi, 'so'],
    [/therefore/gi, 'so'],
    [/additionally/gi, 'also'],
    [/approximately/gi, 'about'],
    [/sufficient/gi, 'enough'],
    [/insufficient/gi, 'not enough'],
    [/advantageous/gi, 'helpful'],
    [/disadvantageous/gi, 'not helpful'],
  ];
  let result = sentence;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  // Remove extra whitespace and keep it short
  result = result.replace(/\s+/g, ' ').trim();
  if (result.length > 120) {
    result = result.slice(0, 117) + '...';
  }
  return result;
}

/**
 * Estimates reading time for a string (for screen readers).
 * Returns a string like '3 sec'.
 */
function estimateReadingTime(text: string): string {
  const words = text.split(/\s+/).length;
  const seconds = Math.max(1, Math.round(words / 3)); // 3 words/sec for screen readers
  return `${seconds} sec`;
}
