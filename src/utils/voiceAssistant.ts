// Voice Assistant for visually impaired flashcard app
// Handles speech recognition (STT) and text-to-speech (TTS)

export interface VoiceCommand {
  command: string;
  description: string;
  action: () => void;
  aliases?: string[];
}

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

class VoiceAssistant {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private commands: VoiceCommand[] = [];
  private onFlashcardAction?: (action: string) => void;
  private currentFlashcard?: { question: string; answer: string; index: number; total: number };

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
    this.setupFlashcardCommands();
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('🎤 Starlet25: Speech recognition started');
        this.isListening = true;
        this.speak('Listening for voice commands');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('🎤 Starlet25: Recognized:', transcript);
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('🎤 Starlet25: Speech recognition error:', event.error);
        this.isListening = false;
        if (event.error === 'not-allowed') {
          this.speak('Microphone access denied. Please allow microphone access and try again.');
        } else {
          this.speak('Speech recognition error. Please try again.');
        }
      };

      this.recognition.onend = () => {
        console.log('🎤 Starlet25: Speech recognition ended');
        this.isListening = false;
        // Restart listening if it was interrupted
        if (this.isListening) {
          this.startListening();
        }
      };
    } else {
      console.error('🎤 Starlet25: Speech recognition not supported');
    }
  }

  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.error('🎤 Starlet25: Speech synthesis not supported');
    }
  }

  private setupFlashcardCommands(): void {
    this.commands = [
      {
        command: 'next',
        description: 'Go to next flashcard',
        action: () => this.handleFlashcardAction('next'),
        aliases: ['next card', 'next flashcard', 'advance', 'forward']
      },
      {
        command: 'previous',
        description: 'Go to previous flashcard',
        action: () => this.handleFlashcardAction('previous'),
        aliases: ['previous card', 'previous flashcard', 'back', 'go back']
      },
      {
        command: 'repeat',
        description: 'Repeat current flashcard',
        action: () => this.handleFlashcardAction('repeat'),
        aliases: ['repeat card', 'say again', 'read again']
      },
      {
        command: 'read question',
        description: 'Read the current question',
        action: () => this.handleFlashcardAction('readQuestion'),
        aliases: ['question', 'what is the question']
      },
      {
        command: 'read answer',
        description: 'Read the current answer',
        action: () => this.handleFlashcardAction('readAnswer'),
        aliases: ['answer', 'what is the answer', 'show answer']
      },
      {
        command: 'stop',
        description: 'Stop listening and speaking',
        action: () => this.handleFlashcardAction('stop'),
        aliases: ['stop listening', 'exit', 'quit', 'close']
      },
      {
        command: 'help',
        description: 'List available voice commands',
        action: () => this.speakHelp(),
        aliases: ['what can you do', 'commands', 'voice commands']
      },
      {
        command: 'progress',
        description: 'Announce current progress',
        action: () => this.announceProgress(),
        aliases: ['where am i', 'how many cards', 'progress']
      }
    ];
  }

  public startListening(): void {
    if (!this.recognition) {
      this.speak('Speech recognition is not supported in this browser');
      return;
    }

    try {
      this.recognition.start();
      console.log('🎤 Starlet25: Starting voice recognition');
    } catch (error) {
      console.error('🎤 Starlet25: Error starting speech recognition:', error);
      this.speak('Error starting voice recognition. Please try again.');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🎤 Starlet25: Stopped voice recognition');
    }
  }

  public speak(text: string, options: TTSOptions = {}): void {
    if (!this.synthesis) {
      console.error('🎤 Starlet25: Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = 'en-US';

    // Try to use a good voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('🎤 Starlet25: Started speaking:', text);
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      console.log('🎤 Starlet25: Finished speaking');
      this.isSpeaking = false;
    };

    utterance.onerror = (event) => {
      console.error('🎤 Starlet25: Speech synthesis error:', event.error);
      this.isSpeaking = false;
    };

    this.synthesis.speak(utterance);
  }

  private processCommand(transcript: string): void {
    // Find matching command
    const command = this.commands.find(cmd => 
      cmd.command === transcript || 
      cmd.aliases?.some(alias => alias === transcript)
    );

    if (command) {
      console.log('🎤 Starlet25: Executing command:', command.command);
      this.speak(`Executing ${command.command}`);
      command.action();
    } else {
      console.log('🎤 Starlet25: Unknown command:', transcript);
      this.speak('Command not recognized. Say help for available commands.');
    }
  }

  private handleFlashcardAction(action: string): void {
    if (this.onFlashcardAction) {
      this.onFlashcardAction(action);
    } else {
      console.log('🎤 Starlet25: Flashcard action handler not set');
    }
  }

  private speakHelp(): void {
    const helpText = this.commands.map(cmd => 
      `${cmd.command}: ${cmd.description}`
    ).join('. ');
    
    this.speak(`Available commands: ${helpText}`);
  }

  private announceProgress(): void {
    if (this.currentFlashcard) {
      const { index, total } = this.currentFlashcard;
      this.speak(`Card ${index + 1} of ${total}`);
    } else {
      this.speak('No flashcard session active');
    }
  }

  // Public methods for flashcard integration
  public setFlashcardActionHandler(handler: (action: string) => void): void {
    this.onFlashcardAction = handler;
  }

  public setCurrentFlashcard(flashcard: { question: string; answer: string; index: number; total: number }): void {
    this.currentFlashcard = flashcard;
  }

  public readFlashcardQuestion(): void {
    if (this.currentFlashcard) {
      this.speak(`Question: ${this.currentFlashcard.question}`);
    }
  }

  public readFlashcardAnswer(): void {
    if (this.currentFlashcard) {
      this.speak(`Answer: ${this.currentFlashcard.answer}`);
    }
  }

  public isVoiceRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  public isVoiceSynthesisSupported(): boolean {
    return this.synthesis !== null;
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  public stopAll(): void {
    this.stopListening();
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Create singleton instance
export const voiceAssistant = new VoiceAssistant(); 