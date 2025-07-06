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
      question: 'What is the main topic of this page?',
      answer: summary,
      summary: summary,
      type: 'summary',
      difficulty: 'easy',
      keywords: this.extractKeywords(content)
    });

    // Generate interactive question flashcards
    const questions = this.generateQuestions(content);
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

  private generateQuestions(content: string): Array<{
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
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    // Generate different types of questions
    const questionTypes = [
      {
        pattern: /\b(what is|what are|define|explain)\b/i,
        template: 'What is {topic}?',
        difficulty: 'easy' as const
      },
      {
        pattern: /\b(how does|how do|describe|explain)\b/i,
        template: 'How does {topic} work?',
        difficulty: 'medium' as const
      },
      {
        pattern: /\b(why|because|reason|cause)\b/i,
        template: 'Why is {topic} important?',
        difficulty: 'hard' as const
      }
    ];

    sentences.slice(0, 6).forEach((sentence, index) => {
      const questionType = questionTypes[index % questionTypes.length];
      const keywords = this.extractKeywords(sentence);
      const topic = keywords[0] || 'this topic';
      
      questions.push({
        question: questionType.template.replace('{topic}', topic),
        answer: sentence.trim(),
        summary: sentence.trim(),
        difficulty: questionType.difficulty,
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
      this.speak('Voice flashcard session started. I will read each flashcard and ask you questions. Say "next" to continue or "repeat" to hear again.');
      
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
      'repeat': () => this.readCurrentFlashcard(),
      'stop': () => this.endSession(),
      'help': () => this.speakHelp(),
      'answer': () => this.startAnswerMode()
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
      this.speak('Moving to next flashcard');
      setTimeout(() => this.readCurrentFlashcard(), 1000);
    } else {
      this.speak('This is the last flashcard. Say "previous" to go back or "stop" to end session.');
    }
  }

  public previousFlashcard(): void {
    if (!this.session) return;

    if (this.session.currentIndex > 0) {
      this.session.currentIndex--;
      this.updateState();
      this.speak('Moving to previous flashcard');
      setTimeout(() => this.readCurrentFlashcard(), 1000);
    } else {
      this.speak('This is the first flashcard. Say "next" to continue.');
    }
  }

  public startAnswerMode(): void {
    if (!this.session) return;

    const currentCard = this.session.flashcards[this.session.currentIndex];
    this.speak(`Please answer the question: ${currentCard.question}`);
    
    if (this.recognition) {
      this.recognition.start();
    }
  }

  private processAnswer(userAnswer: string): void {
    if (!this.session) return;

    const currentCard = this.session.flashcards[this.session.currentIndex];
    this.session.userAnswers.set(currentCard.id, userAnswer);

    // Simple answer validation (keyword matching)
    const isCorrect = this.validateAnswer(userAnswer, currentCard.answer);
    
    if (isCorrect) {
      this.speak('Correct! Well done.');
    } else {
      this.speak(`Good try. The answer was: ${currentCard.answer}`);
    }

    if (this.onAnswerReceived) {
      this.onAnswerReceived(currentCard.id, userAnswer, isCorrect);
    }
  }

  private validateAnswer(userAnswer: string, correctAnswer: string): boolean {
    const userKeywords = this.extractKeywords(userAnswer);
    const correctKeywords = this.extractKeywords(correctAnswer);
    
    const matchingKeywords = userKeywords.filter(keyword => 
      correctKeywords.some(correct => 
        correct.includes(keyword) || keyword.includes(correct)
      )
    );
    
    return matchingKeywords.length >= Math.min(2, correctKeywords.length / 2);
  }

  private speakHelp(): void {
    const helpText = 'Available commands: next, previous, repeat, stop, help, answer. Say "answer" to respond to the current question.';
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