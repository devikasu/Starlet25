// Voice Flashcard System for visually impaired users
// Handles summarization, flashcard generation, TTS reading, and voice Q&A

export interface VoiceFlashcard {
  id: string;
  question: string;
  answer: string;
  summary: string;
  type: 'summary' | 'question' | 'interactive';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
}

export interface VoiceSession {
  flashcards: VoiceFlashcard[];
  currentIndex: number;
  isListening: boolean;
  isSpeaking: boolean;
  userAnswers: Map<string, string>;
  sessionStartTime: number;
}

export interface VoiceResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class VoiceFlashcardSystem {
  private session: VoiceSession | null = null;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private onStateChange?: (session: VoiceSession) => void;
  private onAnswerReceived?: (questionId: string, userAnswer: string, isCorrect: boolean) => void;

  constructor() {
    this.initializeSpeechAPIs();
  }

  private initializeSpeechAPIs(): void {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      this.setupRecognitionHandlers();
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      if (this.session) {
        this.session.isListening = true;
        this.updateState();
      }
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      this.processVoiceInput(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      if (this.session) {
        this.session.isListening = false;
        this.updateState();
      }
    };

    this.recognition.onend = () => {
      if (this.session) {
        this.session.isListening = false;
        this.updateState();
      }
    };
  }

  // Generate flashcards from page content
  public generateFlashcardsFromContent(content: string): VoiceFlashcard[] {
    const flashcards: VoiceFlashcard[] = [];
    
    // Generate summary flashcard
    const summary = this.generateSummary(content);
    flashcards.push({
      id: 'summary-1',
      question: 'What is the main topic?',
      answer: this.extractOneWordAnswer(summary),
      summary: summary,
      type: 'summary',
      difficulty: 'easy',
      keywords: this.extractKeywords(content)
    });

    // Generate interactive question flashcards with short questions and one-word answers
    const questions = this.generateShortQuestions(content);
    questions.forEach((q, index) => {
      flashcards.push({
        id: `question-${index + 1}`,
        question: q.question,
        answer: q.answer,
        summary: q.summary,
        type: 'interactive',
        difficulty: q.difficulty,
        keywords: q.keywords
      });
    });

    return flashcards;
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summarySentences = sentences.slice(0, 3);
    return summarySentences.join('. ').trim() + '.';
  }

  private extractOneWordAnswer(text: string): string {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'just', 'into', 'than', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'people', 'only', 'well', 'also', 'over', 'still', 'take', 'every', 'think', 'here', 'again', 'another', 'around', 'because', 'before', 'should', 'through', 'during', 'first', 'going', 'great', 'might', 'never', 'often', 'place', 'right', 'small', 'sound', 'their', 'there', 'those', 'under', 'until', 'water', 'where', 'which', 'while', 'world', 'years'].includes(word));
    
    return words[0] || 'topic';
  }

  private generateShortQuestions(content: string): Array<{
    question: string;
    answer: string;
    summary: string;
    difficulty: 'easy' | 'medium' | 'hard';
    keywords: string[];
  }> {
    const questions: Array<{
      question: string;
      answer: string;
      summary: string;
      difficulty: 'easy' | 'medium' | 'hard';
      keywords: string[];
    }> = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Generate short questions with one-word answers
    const questionTemplates = [
      { template: 'What is {word}?', difficulty: 'easy' as const },
      { template: 'Name a {category}.', difficulty: 'easy' as const },
      { template: 'What does {word} mean?', difficulty: 'medium' as const },
      { template: 'Give one example of {category}.', difficulty: 'medium' as const },
      { template: 'What is the main {concept}?', difficulty: 'hard' as const }
    ];

    sentences.slice(0, 8).forEach((sentence, index) => {
      const keywords = this.extractKeywords(sentence);
      if (keywords.length === 0) return;
      
      const template = questionTemplates[index % questionTemplates.length];
      const word = keywords[0];
      const category = keywords[1] || 'concept';
      const concept = keywords[2] || 'idea';
      
      let question = template.template
        .replace('{word}', word)
        .replace('{category}', category)
        .replace('{concept}', concept);
      
      // Extract one-word answer from the sentence
      const answer = this.extractOneWordAnswer(sentence);
      
      questions.push({
        question: question,
        answer: answer,
        summary: sentence.trim(),
        difficulty: template.difficulty,
        keywords: keywords.slice(0, 3)
      });
    });

    return questions;
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'just', 'into', 'than', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'people', 'only', 'well', 'also', 'over', 'still', 'take', 'every', 'think', 'here', 'again', 'another', 'around', 'because', 'before', 'should', 'through', 'during', 'first', 'going', 'great', 'might', 'never', 'often', 'place', 'right', 'small', 'sound', 'their', 'there', 'those', 'under', 'until', 'water', 'where', 'which', 'while', 'world', 'years'].includes(word));
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  // Start a new voice flashcard session
  public startSession(content: string): VoiceResponse {
    try {
      const flashcards = this.generateFlashcardsFromContent(content);
      
      this.session = {
        flashcards,
        currentIndex: 0,
        isListening: false,
        isSpeaking: false,
        userAnswers: new Map(),
        sessionStartTime: Date.now()
      };

      this.updateState();
      this.speak('Voice flashcard session started. I will ask you questions and listen for your answers. Get ready!');
      
      // Start the first question automatically
      setTimeout(() => this.askCurrentQuestion(), 2000);
      
      return {
        success: true,
        message: 'Session started',
        data: { flashcardCount: flashcards.length }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start session',
        error: 'Failed to start session'
      };
    }
  }

  // Read current flashcard aloud
  public readCurrentFlashcard(): VoiceResponse {
    if (!this.session) {
      return { success: false, message: 'No active session', error: 'No active session' };
    }

    const currentCard = this.session.flashcards[this.session.currentIndex];
    if (!currentCard) {
      return { success: false, message: 'No flashcard available', error: 'No flashcard available' };
    }

    this.session.isSpeaking = true;
    this.updateState();

    const text = `${currentCard.question}. ${currentCard.answer}`;
    this.speak(text);

    return {
      success: true,
      message: 'Reading flashcard',
      data: { currentCard }
    };
  }

  // Process voice input from user
  private processVoiceInput(transcript: string): void {
    if (!this.session) return;

    const commands = {
      'next': () => this.nextFlashcard(),
      'previous': () => this.previousFlashcard(),
      'repeat': () => this.askCurrentQuestion(),
      'stop': () => this.endSession(),
      'help': () => this.speakHelp(),
      'answer': () => this.askCurrentQuestion()
    };

    // Check for navigation commands
    for (const [command, action] of Object.entries(commands)) {
      if (transcript.includes(command)) {
        action();
        return;
      }
    }

    // If no command found, treat as answer to current question
    this.processAnswer(transcript);
  }

  public nextFlashcard(): void {
    if (!this.session) return;

    if (this.session.currentIndex < this.session.flashcards.length - 1) {
      this.session.currentIndex++;
      this.updateState();
      this.speak('Moving to next question');
      setTimeout(() => this.askCurrentQuestion(), 1000);
    } else {
      this.speak('This is the last question. Session complete!');
      this.endSession();
    }
  }

  public previousFlashcard(): void {
    if (!this.session) return;

    if (this.session.currentIndex > 0) {
      this.session.currentIndex--;
      this.updateState();
      this.speak('Moving to previous question');
      setTimeout(() => this.askCurrentQuestion(), 1000);
    } else {
      this.speak('This is the first question. Say "next" to continue.');
    }
  }

  public askCurrentQuestion(): void {
    if (!this.session) return;

    const currentCard = this.session.flashcards[this.session.currentIndex];
    this.speak(`Question: ${currentCard.question}. Please answer with one word.`);
    
    // Start listening for answer after a short delay
    setTimeout(() => {
      if (this.recognition) {
        this.recognition.start();
      }
    }, 1000);
  }

  public startAnswerMode(): void {
    this.askCurrentQuestion();
  }

  private processAnswer(userAnswer: string): void {
    if (!this.session) return;

    const currentCard = this.session.flashcards[this.session.currentIndex];
    this.session.userAnswers.set(currentCard.id, userAnswer);

    // Extract the first word as the answer
    const cleanAnswer = userAnswer.toLowerCase().trim().split(/\s+/)[0];
    
    // Simple answer validation for one-word answers
    const isCorrect = this.validateOneWordAnswer(cleanAnswer, currentCard.answer);
    
    if (isCorrect) {
      this.speak('Correct! Moving to the next question.');
      setTimeout(() => this.nextFlashcard(), 2000);
    } else {
      this.speak(`Wrong. The correct answer is ${currentCard.answer}. Press → to continue.`);
      // Wait for ArrowRight key before proceeding
      this.waitForArrowRightKey();
    }

    if (this.onAnswerReceived) {
      this.onAnswerReceived(currentCard.id, cleanAnswer, isCorrect);
    }
  }

  private waitForArrowRightKey(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        document.removeEventListener('keydown', handleKeyPress);
        setTimeout(() => this.nextFlashcard(), 500);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
  }

  private validateOneWordAnswer(userAnswer: string, correctAnswer: string): boolean {
    // Clean and normalize both answers
    const cleanUserAnswer = userAnswer.toLowerCase().trim();
    const cleanCorrectAnswer = correctAnswer.toLowerCase().trim();
    
    // Direct match
    if (cleanUserAnswer === cleanCorrectAnswer) {
      return true;
    }
    
    // Check if user answer is contained in correct answer or vice versa
    if (cleanCorrectAnswer.includes(cleanUserAnswer) || cleanUserAnswer.includes(cleanCorrectAnswer)) {
      return true;
    }
    
    // Check for similar words (simple fuzzy matching)
    const userWords = cleanUserAnswer.split(/\s+/);
    const correctWords = cleanCorrectAnswer.split(/\s+/);
    
    for (const userWord of userWords) {
      for (const correctWord of correctWords) {
        if (userWord.length > 2 && correctWord.length > 2) {
          // Check if words are similar (simple edit distance)
          if (this.areWordsSimilar(userWord, correctWord)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private areWordsSimilar(word1: string, word2: string): boolean {
    // Simple similarity check - if words share most characters
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;
    
    if (longer.includes(shorter) || shorter.includes(longer)) {
      return true;
    }
    
    // Check for common prefixes/suffixes
    if (longer.startsWith(shorter) || longer.endsWith(shorter)) {
      return true;
    }
    
    return false;
  }

  private speakHelp(): void {
    const helpText = 'Available commands: next, previous, repeat, stop, help. I will automatically ask questions and listen for your answers.';
    this.speak(helpText);
  }

  private endSession(): void {
    if (!this.session) return;

    const sessionDuration = Date.now() - this.session.sessionStartTime;
    const minutes = Math.floor(sessionDuration / 60000);
    
    this.speak(`Session ended. You reviewed ${this.session.flashcards.length} flashcards in ${minutes} minutes.`);
    
    this.session = null;
    this.updateState();
  }

  private speak(text: string): void {
    if (!this.synthesis) return;

    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (this.session) {
        this.session.isSpeaking = false;
        this.updateState();
      }
    };

    utterance.onerror = () => {
      if (this.session) {
        this.session.isSpeaking = false;
        this.updateState();
      }
    };

    this.synthesis.speak(utterance);
  }

  private updateState(): void {
    if (this.onStateChange && this.session) {
      this.onStateChange({ ...this.session });
    }
  }

  // Public methods for external control
  public getCurrentSession(): VoiceSession | null {
    return this.session;
  }

  public setStateChangeHandler(handler: (session: VoiceSession) => void): void {
    this.onStateChange = handler;
  }

  public setAnswerReceivedHandler(handler: (questionId: string, userAnswer: string, isCorrect: boolean) => void): void {
    this.onAnswerReceived = handler;
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.session = null;
  }

  public isSupported(): boolean {
    return this.recognition !== null && this.synthesis !== null;
  }
}

// Create singleton instance
export const voiceFlashcardSystem = new VoiceFlashcardSystem(); 