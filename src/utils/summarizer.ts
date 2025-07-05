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
    tags: ['general', 'fallback']
  },
  {
    id: 'fallback_2',
    question: "What can the user do with this extension?",
    answer: "Extract text from web pages, summarize content, generate flashcards for learning, and analyze page content for better understanding.",
    type: 'concept',
    difficulty: 'easy',
    tags: ['extension', 'fallback']
  },
  {
    id: 'fallback_3',
    question: "How does text extraction work?",
    answer: "The extension identifies main content areas, removes navigation elements, and extracts clean text while avoiding ads, footers, and sidebars.",
    type: 'process',
    difficulty: 'medium',
    tags: ['extraction', 'fallback']
  },
  {
    id: 'fallback_4',
    question: "What types of content can be processed?",
    answer: "Articles, documentation, tutorials, blog posts, and any text-based content. The extension works best with structured, informative content.",
    type: 'fact',
    difficulty: 'easy',
    tags: ['content', 'fallback']
  },
  {
    id: 'fallback_5',
    question: "How can I use the text-to-speech feature?",
    answer: "Click the 🔊 Speak Summary button to have the page summary read aloud using your browser's text-to-speech capabilities.",
    type: 'process',
    difficulty: 'easy',
    tags: ['speech', 'fallback']
  },
  {
    id: 'fallback_6',
    question: "What are the different flashcard types?",
    answer: "Definition cards explain terms, concept cards cover ideas, fact cards present information, and process cards describe how things work.",
    type: 'concept',
    difficulty: 'medium',
    tags: ['flashcards', 'fallback']
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
  
  // Take first 3 meaningful sentences
  const summarySentences = sentences
    .filter(s => s.length > 20)
    .slice(0, 3);
  
  if (summarySentences.length === 0) {
    return sentences[0] || "Content extracted but too short for meaningful summary.";
  }
  
  return summarySentences.join(' ') + '.';
}

function extractKeyPoints(sentences: string[]): string[] {
  return sentences
    .filter(s => s.length > 30 && s.length < 150)
    .slice(0, 5)
    .map(s => s.trim());
}

function generateFlashcards(text: string, topics: string[], difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] {
  const flashcards: Flashcard[] = [];
  const sentences = extractSentences(text);
  
  // Generate definition cards for technical terms
  const technicalTerms = TECHNICAL_TERMS.filter(term => 
    text.toLowerCase().includes(term)
  ).slice(0, 3);
  
  technicalTerms.forEach((term, index) => {
    flashcards.push({
      id: `def_${index}`,
      question: `What is ${term}?`,
      answer: generateDefinitionAnswer(term, text),
      type: 'definition',
      difficulty: difficulty,
      tags: [...topics, 'definition']
    });
  });
  
  // Generate concept cards
  const conceptSentences = sentences.filter(s => 
    s.length > 40 && s.length < 120
  ).slice(0, 2);
  
  conceptSentences.forEach((sentence, index) => {
    const concept = extractConceptFromSentence(sentence);
    if (concept) {
      flashcards.push({
        id: `concept_${index}`,
        question: `Explain the concept of ${concept}.`,
        answer: sentence,
        type: 'concept',
        difficulty: difficulty,
        tags: [...topics, 'concept']
      });
    }
  });
  
  // Generate fact cards
  const factSentences = sentences.filter(s => 
    s.includes('is') || s.includes('are') || s.includes('was') || s.includes('were')
  ).slice(0, 2);
  
  factSentences.forEach((sentence, index) => {
    const fact = extractFactFromSentence(sentence);
    if (fact) {
      flashcards.push({
        id: `fact_${index}`,
        question: `What is ${fact}?`,
        answer: sentence,
        type: 'fact',
        difficulty: difficulty,
        tags: [...topics, 'fact']
      });
    }
  });
  
  // Generate process cards
  const processSentences = sentences.filter(s => 
    s.includes('step') || s.includes('process') || s.includes('method') || s.includes('procedure')
  ).slice(0, 1);
  
  processSentences.forEach((sentence, index) => {
    const process = extractProcessFromSentence(sentence);
    if (process) {
      flashcards.push({
        id: `process_${index}`,
        question: `What are the steps to ${process}?`,
        answer: sentence,
        type: 'process',
        difficulty: difficulty,
        tags: [...topics, 'process']
      });
    }
  });
  
  return flashcards.slice(0, 8); // Limit to 8 flashcards
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

function extractConceptFromSentence(sentence: string): string | null {
  // Look for concepts in the sentence
  const conceptPatterns = [
    /the concept of (\w+)/i,
    /(\w+) is a/i,
    /(\w+) refers to/i,
    /(\w+) means/i
  ];
  
  for (const pattern of conceptPatterns) {
    const match = sentence.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function extractFactFromSentence(sentence: string): string | null {
  // Look for facts in the sentence
  const factPatterns = [
    /(\w+) is (\w+)/i,
    /(\w+) are (\w+)/i,
    /(\w+) was (\w+)/i,
    /(\w+) were (\w+)/i
  ];
  
  for (const pattern of factPatterns) {
    const match = sentence.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function extractProcessFromSentence(sentence: string): string | null {
  // Look for processes in the sentence
  const processPatterns = [
    /the (\w+) process/i,
    /(\w+) procedure/i,
    /(\w+) method/i,
    /steps to (\w+)/i
  ];
  
  for (const pattern of processPatterns) {
    const match = sentence.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export function formatSummary(summary: Summary): string {
  return `Summary: ${summary.text}\n\nKey Points:\n${summary.keyPoints.map(point => `• ${point}`).join('\n')}\n\nTopics: ${summary.topics.join(', ')}\nDifficulty: ${summary.difficulty}\nConfidence: ${Math.round(summary.confidence * 100)}%`;
}

export function formatFlashcards(flashcards: Flashcard[]): string {
  return flashcards.map((card, index) => 
    `Card ${index + 1} (${card.type}):\nQ: ${card.question}\nA: ${card.answer}\nTags: ${card.tags.join(', ')}\n`
  ).join('\n');
}
