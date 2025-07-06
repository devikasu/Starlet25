// Speech-to-Text Manager for flashcard app
// Handles voice command recognition with proper error handling and fallbacks

export interface STTConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface STTResult {
  success: boolean;
  transcript?: string;
  confidence?: number;
  error?: string;
}

export interface VoiceCommand {
  command: string;
  aliases: string[];
  action: string;
  description: string;
}

class STTManager {
  private recognition: SpeechRecognition | null = null;
  private config: STTConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: false,
    maxAlternatives: 1
  };
  private isListening: boolean = false;
  private onCommandRecognized?: (command: string) => void;
  private onError?: (error: string) => void;
  private commands: VoiceCommand[] = [];

  constructor() {
    this.initializeRecognition();
    this.setupDefaultCommands();
  }

  private initializeRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      this.setupEventHandlers();
      console.log('🎤 Starlet25: STT Manager initialized');
    } else {
      console.error('🎤 Starlet25: Speech recognition not supported');
    }
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('🎤 Starlet25: Speech recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;

      console.log('🎤 Starlet25: Recognized:', transcript, 'confidence:', confidence);

      if (result.isFinal) {
        this.processTranscript(transcript, confidence);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🎤 Starlet25: Speech recognition error:', event.error);
      this.isListening = false;
      
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture error. Please check your microphone.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      if (this.onError) {
        this.onError(errorMessage);
      }
    };

    this.recognition.onend = () => {
      console.log('🎤 Starlet25: Speech recognition ended');
      this.isListening = false;
      
      // Restart if it was interrupted
      if (this.isListening) {
        setTimeout(() => {
          this.startListening();
        }, 1000);
      }
    };
  }

  private setupDefaultCommands(): void {
    this.commands = [
      {
        command: 'next',
        aliases: ['next card', 'next flashcard', 'advance', 'forward', 'go next'],
        action: 'next',
        description: 'Go to next flashcard'
      },
      {
        command: 'previous',
        aliases: ['previous card', 'previous flashcard', 'back', 'go back', 'previous card'],
        action: 'previous',
        description: 'Go to previous flashcard'
      },
      {
        command: 'repeat',
        aliases: ['repeat card', 'say again', 'read again', 'repeat question'],
        action: 'repeat',
        description: 'Repeat current flashcard'
      },
      {
        command: 'read question',
        aliases: ['question', 'what is the question', 'read the question'],
        action: 'readQuestion',
        description: 'Read the current question'
      },
      {
        command: 'read answer',
        aliases: ['answer', 'what is the answer', 'show answer', 'read the answer'],
        action: 'readAnswer',
        description: 'Read the current answer'
      },
      {
        command: 'stop',
        aliases: ['stop listening', 'exit', 'quit', 'close', 'end session'],
        action: 'stop',
        description: 'Stop listening and speaking'
      },
      {
        command: 'help',
        aliases: ['what can you do', 'commands', 'voice commands', 'help me'],
        action: 'help',
        description: 'List available voice commands'
      },
      {
        command: 'progress',
        aliases: ['where am i', 'how many cards', 'progress', 'current position'],
        action: 'progress',
        description: 'Announce current progress'
      },
      {
        command: 'pause',
        aliases: ['pause speech', 'stop talking', 'quiet'],
        action: 'pause',
        description: 'Pause speech synthesis'
      },
      {
        command: 'resume',
        aliases: ['resume speech', 'continue talking', 'continue'],
        action: 'resume',
        description: 'Resume speech synthesis'
      }
    ];
  }

  private processTranscript(transcript: string, _confidence: number): void {
    // Find matching command
    const command = this.commands.find(cmd => 
      cmd.command === transcript || 
      cmd.aliases.some(alias => alias === transcript)
    );

    if (command) {
      console.log('🎤 Starlet25: Command recognized:', command.action);
      if (this.onCommandRecognized) {
        this.onCommandRecognized(command.action);
      }
    } else {
      console.log('🎤 Starlet25: Unknown command:', transcript);
      if (this.onError) {
        this.onError('Command not recognized. Say help for available commands.');
      }
    }
  }

  public startListening(): STTResult {
    if (!this.recognition) {
      return {
        success: false,
        error: 'Speech recognition not supported'
      };
    }

    try {
      this.recognition.start();
      return {
        success: true,
        transcript: 'Listening started'
      };
    } catch (error) {
      console.error('🎤 Starlet25: Error starting speech recognition:', error);
      return {
        success: false,
        error: 'Failed to start speech recognition'
      };
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🎤 Starlet25: Stopped speech recognition');
    }
  }

  public setConfig(config: Partial<STTConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
    
    console.log('🎤 Starlet25: STT config updated:', this.config);
  }

  public getConfig(): STTConfig {
    return { ...this.config };
  }

  public setCommandHandler(handler: (command: string) => void): void {
    this.onCommandRecognized = handler;
  }

  public setErrorHandler(handler: (error: string) => void): void {
    this.onError = handler;
  }

  public addCommand(command: VoiceCommand): void {
    this.commands.push(command);
    console.log('🎤 Starlet25: Added command:', command.command);
  }

  public removeCommand(commandName: string): void {
    this.commands = this.commands.filter(cmd => cmd.command !== commandName);
    console.log('🎤 Starlet25: Removed command:', commandName);
  }

  public getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  public getCommandHelp(): string {
    return this.commands.map(cmd => 
      `${cmd.command}: ${cmd.description}`
    ).join('. ');
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }

  public requestMicrophonePermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.recognition) {
        resolve(false);
        return;
      }

      // Try to start recognition to trigger permission request
      try {
        this.recognition.start();
        setTimeout(() => {
          this.recognition!.stop();
          resolve(true);
        }, 100);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

// Create singleton instance
export const sttManager = new STTManager(); 