// Text-to-Speech Manager for flashcard app
// Handles all TTS operations with proper configuration and error handling

export interface TTSConfig {
  rate: number;
  pitch: number;
  volume: number;
  voice?: string;
  language: string;
}

export interface TTSFeedback {
  success: boolean;
  error?: string;
  message?: string;
}

class TTSManager {
  private synthesis: SpeechSynthesis | null = null;
  private config: TTSConfig = {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'en-US'
  };
  private isSpeaking: boolean = false;
  private queue: string[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.initializeSynthesis();
  }

  private initializeSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      console.log('🎤 Starlet25: TTS Manager initialized');
    } else {
      console.error('🎤 Starlet25: Speech synthesis not supported');
    }
  }

  public setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🎤 Starlet25: TTS config updated:', this.config);
  }

  public getConfig(): TTSConfig {
    return { ...this.config };
  }

  public speak(text: string, immediate: boolean = false): TTSFeedback {
    if (!this.synthesis) {
      return {
        success: false,
        error: 'Speech synthesis not supported'
      };
    }

    if (immediate) {
      this.stop();
      this.queue = [];
    }

    if (this.isSpeaking && !immediate) {
      this.queue.push(text);
      return {
        success: true,
        message: 'Text queued for speech'
      };
    }

    return this.processText(text);
  }

  private processText(text: string): TTSFeedback {
    try {
      this.synthesis!.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      utterance.lang = this.config.language;

      // Set voice if specified
      if (this.config.voice) {
        const voices = this.synthesis!.getVoices();
        const selectedVoice = voices.find(voice => voice.name === this.config.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        console.log('🎤 Starlet25: Started speaking:', text.substring(0, 50) + '...');
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        console.log('🎤 Starlet25: Finished speaking');
        this.isSpeaking = false;
        this.processQueue();
      };

      utterance.onerror = (event) => {
        console.error('🎤 Starlet25: TTS error:', event.error);
        this.isSpeaking = false;
        this.processQueue();
      };

      this.synthesis!.speak(utterance);

      return {
        success: true,
        message: 'Speech started'
      };
    } catch (error) {
      console.error('🎤 Starlet25: Error in processText:', error);
      return {
        success: false,
        error: 'Failed to process text for speech'
      };
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && !this.isProcessingQueue) {
      this.isProcessingQueue = true;
      const nextText = this.queue.shift()!;
      
      setTimeout(() => {
        this.processText(nextText);
        this.isProcessingQueue = false;
      }, 500); // Small delay between queue items
    }
  }

  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.queue = [];
      console.log('🎤 Starlet25: Speech stopped');
    }
  }

  public pause(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
      console.log('🎤 Starlet25: Speech paused');
    }
  }

  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
      console.log('🎤 Starlet25: Speech resumed');
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    
    const voices = this.synthesis.getVoices();
    return voices.filter(voice => voice.lang.startsWith('en'));
  }

  public isSupported(): boolean {
    return this.synthesis !== null;
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  // Flashcard-specific methods
  public speakQuestion(question: string): TTSFeedback {
    return this.speak(`Question: ${question}`, true);
  }

  public speakAnswer(answer: string): TTSFeedback {
    return this.speak(`Answer: ${answer}`, true);
  }

  public speakProgress(current: number, total: number): TTSFeedback {
    return this.speak(`Card ${current} of ${total}`, true);
  }

  public speakNavigation(action: string): TTSFeedback {
    const messages = {
      next: 'Moving to next card',
      previous: 'Moving to previous card',
      repeat: 'Repeating current card',
      stop: 'Stopping flashcard session',
      start: 'Starting flashcard session'
    };
    
    const message = messages[action as keyof typeof messages] || action;
    return this.speak(message, true);
  }

  public speakError(error: string): TTSFeedback {
    return this.speak(`Error: ${error}`, true);
  }

  public speakSuccess(message: string): TTSFeedback {
    return this.speak(`Success: ${message}`, true);
  }
}

// Create singleton instance
export const ttsManager = new TTSManager(); 