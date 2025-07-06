// Voice Assistant for Starlet25 - Full accessibility for blind users
// Provides voice input recognition and speech output for all extension features

export interface VoiceCommand {
  command: string;
  description: string;
  action: () => Promise<void>;
}

export interface VoiceAssistantState {
  isListening: boolean;
  isSpeaking: boolean;
  currentCommand: string | null;
}

class VoiceAssistant {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSpeaking = false;
  private commands: VoiceCommand[] = [];
  private onStateChange: ((state: VoiceAssistantState) => void) | null = null;

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
    this.setupCommands();
  }

  private initializeSpeechRecognition(): void {
    console.log('🎤 Starlet25: Initializing speech recognition...');
    console.log('🎤 Starlet25: SpeechRecognition available:', 'SpeechRecognition' in window);
    console.log('🎤 Starlet25: webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      console.log('🎤 Starlet25: Creating SpeechRecognition instance...');
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('🎤 Starlet25: Voice recognition started');
        this.isListening = true;
        this.updateState();
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('🎤 Starlet25: onresult fired with transcript:', transcript);
        console.log('🎤 Starlet25: Processing command...');
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('🎤 Starlet25: Speech recognition error:', event.error);
        this.speak('Sorry, I did not understand. Please try again.');
        this.isListening = false;
        this.updateState();
      };

      this.recognition.onend = () => {
        console.log('🎤 Starlet25: Voice recognition ended');
        this.isListening = false;
        this.updateState();
      };
      
      console.log('🎤 Starlet25: Speech recognition initialized successfully');
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

  private setupCommands(): void {
    this.commands = [
      {
        command: 'summarize page',
        description: 'Extract and summarize the current page content',
        action: async () => {
          await this.handleSummarizePage();
        }
      },
      {
        command: 'read flashcards',
        description: 'Read the generated flashcards aloud',
        action: async () => {
          await this.handleReadFlashcards();
        }
      },
      {
        command: 'read summary',
        description: 'Read the page summary aloud',
        action: async () => {
          await this.handleReadSummary();
        }
      },
      {
        command: 'toggle accessibility',
        description: 'Turn accessibility mode on or off',
        action: async () => {
          await this.handleToggleAccessibility();
        }
      },
      {
        command: 'help',
        description: 'List all available voice commands',
        action: async () => {
          await this.handleHelp();
        }
      },
      {
        command: 'stop',
        description: 'Stop current speech or listening',
        action: async () => {
          await this.handleStop();
        }
      },
      {
        command: 'clear data',
        description: 'Clear all stored page data',
        action: async () => {
          await this.handleClearData();
        }
      }
    ];
  }

  public startListening(): void {
    console.log('🎤 Starlet25: startListening called');
    console.log('🎤 Starlet25: recognition available:', !!this.recognition);
    console.log('🎤 Starlet25: isListening:', this.isListening);
    
    if (!this.recognition) {
      console.error('🎤 Starlet25: Speech recognition not available');
      this.speak('Speech recognition is not available in this browser.');
      return;
    }

    if (this.isListening) {
      console.log('🎤 Starlet25: Already listening, ignoring start request');
      this.speak('Already listening for commands.');
      return;
    }

    console.log('🎤 Starlet25: Starting speech recognition...');
    this.speak('Listening. Please say a command.');
    
    try {
      this.recognition.start();
      console.log('🎤 Starlet25: Speech recognition start() called successfully');
    } catch (error) {
      console.error('🎤 Starlet25: Error starting recognition:', error);
      this.speak('Error starting voice recognition. Please try again.');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public speak(text: string): void {
    if (!this.synthesis) {
      console.error('🎤 Starlet25: Speech synthesis not available');
      return;
    }

    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      console.log('🎤 Starlet25: Speaking:', text);
      this.isSpeaking = true;
      this.updateState();
    };

    utterance.onend = () => {
      console.log('🎤 Starlet25: Finished speaking');
      this.isSpeaking = false;
      this.updateState();
    };

    utterance.onerror = (event) => {
      console.error('🎤 Starlet25: Speech error:', event.error);
      this.isSpeaking = false;
      this.updateState();
    };

    this.synthesis.speak(utterance);
  }

  private async processCommand(transcript: string): Promise<void> {
    console.log('🎤 Starlet25: processCommand called with transcript:', transcript);
    
    // Find the best matching command
    const command = this.findBestMatch(transcript);
    console.log('🎤 Starlet25: findBestMatch returned:', command?.command || 'null');
    
    if (command) {
      console.log('🎤 Starlet25: Executing command:', command.command);
      this.speak(`Executing ${command.command}`);
      try {
        await command.action();
        console.log('🎤 Starlet25: Command execution completed successfully');
      } catch (error) {
        console.error('🎤 Starlet25: Error executing command:', error);
        this.speak('Sorry, there was an error executing that command.');
      }
    } else {
      console.log('🎤 Starlet25: Command not recognized:', transcript);
      this.speak(`Command not recognized: ${transcript}. Say "help" for available commands.`);
    }
  }

  private findBestMatch(transcript: string): VoiceCommand | null {
    console.log('🎤 Starlet25: findBestMatch called with transcript:', transcript);
    console.log('🎤 Starlet25: Available commands:', this.commands.map(cmd => cmd.command));
    
    // Exact match first
    const exactMatch = this.commands.find(cmd => 
      transcript.includes(cmd.command.toLowerCase())
    );
    
    if (exactMatch) {
      console.log('🎤 Starlet25: Found exact match:', exactMatch.command);
      return exactMatch;
    }

    // Fuzzy matching for common variations
    const variations: { [key: string]: string[] } = {
      'summarize page': ['summarize', 'summary', 'summarize this page', 'page summary'],
      'read flashcards': ['flashcards', 'read cards', 'show flashcards', 'flash card'],
      'read summary': ['read summary', 'summary', 'tell me summary'],
      'toggle accessibility': ['accessibility', 'toggle', 'turn on accessibility', 'turn off accessibility'],
      'help': ['help', 'commands', 'what can you do', 'list commands'],
      'stop': ['stop', 'cancel', 'quit', 'end'],
      'clear data': ['clear', 'clear data', 'delete data', 'reset']
    };

    for (const [command, variants] of Object.entries(variations)) {
      if (variants.some(variant => transcript.includes(variant))) {
        const matchedCommand = this.commands.find(cmd => cmd.command === command);
        console.log('🎤 Starlet25: Found fuzzy match:', command, '->', matchedCommand?.command);
        return matchedCommand || null;
      }
    }

    console.log('🎤 Starlet25: No match found for transcript:', transcript);
    return null;
  }

  private async handleSummarizePage(): Promise<void> {
    console.log('🎤 Starlet25: handleSummarizePage called');
    try {
      this.speak('Extracting and summarizing the current page.');
      
      console.log('🎤 Starlet25: Sending message: EXTRACT_CURRENT_PAGE');
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_PAGE' }, (response) => {
          console.log('🎤 Starlet25: Received response for EXTRACT_CURRENT_PAGE:', response);
          if (chrome.runtime.lastError) {
            console.error('🎤 Starlet25: Runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if ((response as any).success) {
        const summarization = (response as any).summarization;
        console.log('🎤 Starlet25: Summarization result:', summarization);
        if (summarization?.summary?.text) {
          this.speak(`Summary complete. ${summarization.summary.text}`);
        } else {
          this.speak('Summary generated but no content found.');
        }
      } else {
        console.log('🎤 Starlet25: Extract current page failed:', response);
        this.speak('Sorry, could not summarize this page.');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error summarizing page:', error);
      this.speak('Error summarizing page. Please try again.');
    }
  }

  private async handleReadFlashcards(): Promise<void> {
    console.log('🎤 Starlet25: handleReadFlashcards called');
    try {
      this.speak('Reading flashcards.');
      
      console.log('🎤 Starlet25: Sending message: GET_STORED_TEXTS');
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'GET_STORED_TEXTS' }, (response) => {
          console.log('🎤 Starlet25: Received response for GET_STORED_TEXTS:', response);
          if (chrome.runtime.lastError) {
            console.error('🎤 Starlet25: Runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      const texts = (response as any).texts || [];
      console.log('🎤 Starlet25: Retrieved texts count:', texts.length);
      
      if (texts.length > 0) {
        const latest = texts[0];
        console.log('🎤 Starlet25: Latest text data:', latest);
        
        if (latest.summarization?.flashcards?.length > 0) {
          const flashcards = latest.summarization.flashcards;
          console.log('🎤 Starlet25: Found flashcards:', flashcards.length);
          this.speak(`Found ${flashcards.length} flashcards. Reading them now.`);
          
          for (let i = 0; i < Math.min(flashcards.length, 5); i++) {
            const card = flashcards[i];
            await this.speakWithDelay(`Card ${i + 1}. Question: ${card.question}. Answer: ${card.answer}`, 2000);
          }
          
          if (flashcards.length > 5) {
            this.speak(`And ${flashcards.length - 5} more flashcards available.`);
          }
        } else {
          console.log('🎤 Starlet25: No flashcards found in latest text');
          this.speak('No flashcards found. Please summarize a page first.');
        }
      } else {
        console.log('🎤 Starlet25: No stored texts found');
        this.speak('No content found. Please summarize a page first.');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error reading flashcards:', error);
      this.speak('Error reading flashcards. Please try again.');
    }
  }

  private async handleReadSummary(): Promise<void> {
    try {
      this.speak('Reading page summary.');
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'GET_STORED_TEXTS' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      const texts = (response as any).texts || [];
      if (texts.length > 0) {
        const latest = texts[0];
        if (latest.summarization?.summary?.text) {
          this.speak(latest.summarization.summary.text);
        } else {
          this.speak('No summary found. Please summarize a page first.');
        }
      } else {
        this.speak('No content found. Please summarize a page first.');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error reading summary:', error);
      this.speak('Error reading summary. Please try again.');
    }
  }

  private async handleToggleAccessibility(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['accessibilityEnabled']);
      const currentState = result.accessibilityEnabled === true;
      const newState = !currentState;
      
      await chrome.storage.local.set({ accessibilityEnabled: newState });
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: 'TOGGLE_ACCESSIBILITY', 
          enabled: newState 
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if ((response as any).success) {
        this.speak(`Accessibility ${newState ? 'enabled' : 'disabled'}. ${newState ? 'Press Alt+N to read page content.' : ''}`);
      } else {
        this.speak('Error toggling accessibility.');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error toggling accessibility:', error);
      this.speak('Error toggling accessibility. Please try again.');
    }
  }

  private async handleHelp(): Promise<void> {
    this.speak('Available voice commands:');
    
    for (const command of this.commands) {
      await this.speakWithDelay(`${command.command}: ${command.description}`, 1000);
    }
    
    this.speak('Say any command to execute it.');
  }

  private async handleStop(): Promise<void> {
    this.synthesis?.cancel();
    this.stopListening();
    this.speak('Stopped.');
  }

  private async handleClearData(): Promise<void> {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'CLEAR_STORED_TEXTS' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if ((response as any).success) {
        this.speak('All stored data cleared.');
      } else {
        this.speak('Error clearing data.');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error clearing data:', error);
      this.speak('Error clearing data. Please try again.');
    }
  }

  private async speakWithDelay(text: string, delay: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.speak(text);
        resolve();
      }, delay);
    });
  }

  public setStateChangeCallback(callback: (state: VoiceAssistantState) => void): void {
    this.onStateChange = callback;
  }

  private updateState(): void {
    if (this.onStateChange) {
      this.onStateChange({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking,
        currentCommand: this.isListening ? 'Listening for commands...' : null
      });
    }
  }

  public getState(): VoiceAssistantState {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      currentCommand: this.isListening ? 'Listening for commands...' : null
    };
  }

  public isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }
}

// Create singleton instance
export const voiceAssistant = new VoiceAssistant();

// Demo examples and usage
export const voiceAssistantDemo = {
  // Example: How to use the voice assistant
  usage: `
    // Start listening for voice commands
    voiceAssistant.startListening();
    
    // Speak text to user
    voiceAssistant.speak('Hello, I am your voice assistant');
    
    // Check if voice features are supported
    if (voiceAssistant.isSupported()) {
      console.log('Voice assistant is available');
    }
  `,
  
  // Example commands users can say
  exampleCommands: [
    'summarize page',
    'read flashcards', 
    'read summary',
    'toggle accessibility',
    'help',
    'stop',
    'clear data'
  ],
  
  // Voice feedback examples
  feedbackExamples: [
    'Listening. Please say a command.',
    'Executing summarize page',
    'Summary complete. This page discusses...',
    'Found 5 flashcards. Reading them now.',
    'Accessibility enabled. Press Alt+N to read page content.',
    'Available voice commands: summarize page, read flashcards...',
    'Stopped.',
    'All stored data cleared.'
  ]
}; 