import React, { useState, useEffect } from 'react';
import { ttsManager } from '../utils/ttsManager';
import { sttManager } from '../utils/sttManager';

interface VoiceSession {
  startTime: number;
  endTime?: number;
  cardsReviewed: number;
  totalCards: number;
  commandsUsed: string[];
}

interface VoiceInteractiveFlashcardProps {
  content: string;
  onClose: () => void;
  onSessionComplete: (session: VoiceSession) => void;
}

const VoiceInteractiveFlashcard: React.FC<VoiceInteractiveFlashcardProps> = ({
  content,
  onClose,
  onSessionComplete
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<VoiceSession>({
    startTime: Date.now(),
    cardsReviewed: 0,
    totalCards: 0,
    commandsUsed: []
  });

  // Generate simple flashcards from content
  const generateFlashcards = (text: string): string[] => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 8).map(sentence => sentence.trim());
  };

  const flashcards = generateFlashcards(content);

  useEffect(() => {
    setSession(prev => ({ ...prev, totalCards: flashcards.length }));
    startVoiceSession();
  }, []);

  const startVoiceSession = async () => {
    try {
      const hasPermission = await sttManager.requestMicrophonePermission();
      if (!hasPermission) {
        console.error('Microphone permission denied');
        return;
      }

      sttManager.setCommandHandler(handleVoiceCommand);
      sttManager.setErrorHandler(handleVoiceError);
      
      const result = sttManager.startListening();
      if (result.success) {
        setIsListening(true);
        ttsManager.speakSuccess('Voice session started. Say next, previous, or repeat.');
      }
    } catch (error) {
      console.error('Error starting voice session:', error);
    }
  };

  const stopVoiceSession = () => {
    sttManager.stopListening();
    ttsManager.stop();
    setIsListening(false);
    
    const completedSession = {
      ...session,
      endTime: Date.now(),
      cardsReviewed: currentIndex + 1
    };
    onSessionComplete(completedSession);
  };

  const handleVoiceCommand = (command: string) => {
    setSession(prev => ({
      ...prev,
      commandsUsed: [...prev.commandsUsed, command]
    }));

    switch (command) {
      case 'next':
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          ttsManager.speakNavigation('next');
          setTimeout(() => speakCurrentCard(), 1000);
        } else {
          ttsManager.speak('This is the last card. Say previous to go back or stop to end session.');
        }
        break;
      case 'previous':
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
          ttsManager.speakNavigation('previous');
          setTimeout(() => speakCurrentCard(), 1000);
        } else {
          ttsManager.speak('This is the first card. Say next to continue or stop to end session.');
        }
        break;
      case 'repeat':
        speakCurrentCard();
        break;
      case 'stop':
        stopVoiceSession();
        onClose();
        break;
      case 'help':
        const helpText = sttManager.getCommandHelp();
        ttsManager.speak(`Available commands: ${helpText}`, true);
        break;
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    ttsManager.speakError(error);
  };

  const speakCurrentCard = () => {
    if (flashcards[currentIndex]) {
      setIsSpeaking(true);
      ttsManager.speak(flashcards[currentIndex], true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sttManager.stopListening();
      ttsManager.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl w-[90%] max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 flex-shrink-0">
          <div className="text-white">
            <h2 className="text-2xl font-bold">🎤 Voice Study Session</h2>
            <p className="text-white text-opacity-80">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
            <div className="flex items-center mt-2">
              <span className={`text-sm ${isListening ? 'text-green-300' : isSpeaking ? 'text-blue-300' : 'text-white text-opacity-60'}`}>
                {isListening ? '🎤 Listening' : isSpeaking ? '🔊 Speaking' : '🔇 Voice Ready'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="text-white hover:text-white text-opacity-80 hover:text-opacity-100 text-3xl font-bold transition-opacity"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
          <div className="bg-white bg-opacity-95 rounded-xl p-8 shadow-lg w-full max-w-3xl">
            <div className="text-center">
              <div className="text-4xl mb-6">🎤</div>
              <p className="text-2xl font-semibold text-gray-800 leading-relaxed">
                {flashcards[currentIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Voice Commands Help */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Voice Commands:</h3>
            <div className="text-white text-sm space-y-1">
              <p>• "Next" - Go to next card</p>
              <p>• "Previous" - Go to previous card</p>
              <p>• "Repeat" - Repeat current card</p>
              <p>• "Stop" - End session</p>
              <p>• "Help" - List all commands</p>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center pb-4 flex-shrink-0">
          <p className="text-white text-opacity-60 text-sm">
            Use ← → arrows or spacebar to navigate • Esc to close • Say commands to control with voice
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInteractiveFlashcard; 