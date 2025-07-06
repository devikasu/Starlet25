import React, { useState, useEffect, useRef } from 'react';
import { Flashcard } from '../utils/summarizer';
import { ttsManager } from '../utils/ttsManager';
import { sttManager } from '../utils/sttManager';

interface VoiceFlashcardViewerProps {
  flashcards: Flashcard[];
  onClose: () => void;
  autoStartVoice?: boolean;
}

const VoiceFlashcardViewer: React.FC<VoiceFlashcardViewerProps> = ({ 
  flashcards, 
  onClose, 
  autoStartVoice = true 
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [_isListening, setIsListening] = useState(false); // Used in voice session management
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'speaking' | 'listening' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const sessionRef = useRef<{ startTime: number; cardsReviewed: number }>({
    startTime: Date.now(),
    cardsReviewed: 0
  });

  const currentCard = flashcards[currentCardIndex];

  useEffect(() => {
    if (autoStartVoice && voiceEnabled) {
      startVoiceSession();
    }

    return () => {
      stopVoiceSession();
    };
  }, []);

  useEffect(() => {
    if (currentCard && voiceEnabled) {
      speakCurrentCard();
    }
  }, [currentCardIndex, showAnswer, voiceEnabled]);

  const startVoiceSession = async () => {
    try {
      // Check microphone permission
      const hasPermission = await sttManager.requestMicrophonePermission();
      if (!hasPermission) {
        setErrorMessage('Microphone access required for voice commands');
        setVoiceStatus('error');
        return;
      }

      // Set up command handlers
      sttManager.setCommandHandler(handleVoiceCommand);
      sttManager.setErrorHandler(handleVoiceError);

      // Start listening
      const result = sttManager.startListening();
      if (result.success) {
        setIsListening(true);
        setVoiceStatus('listening');
        ttsManager.speakSuccess('Voice session started. Say help for available commands.');
      } else {
        setErrorMessage(result.error || 'Failed to start voice recognition');
        setVoiceStatus('error');
      }
    } catch (error) {
      console.error('🎤 Starlet25: Error starting voice session:', error);
      setErrorMessage('Failed to start voice session');
      setVoiceStatus('error');
    }
  };

  const stopVoiceSession = () => {
    sttManager.stopListening();
    ttsManager.stop();
    setIsListening(false);
    setVoiceStatus('idle');
  };

  const handleVoiceCommand = (command: string) => {
    console.log('🎤 Starlet25: Executing voice command:', command);
    
    switch (command) {
      case 'next':
        nextCard();
        break;
      case 'previous':
        previousCard();
        break;
      case 'repeat':
        speakCurrentCard();
        break;
      case 'readQuestion':
        speakQuestion();
        break;
      case 'readAnswer':
        speakAnswer();
        break;
      case 'stop':
        onClose();
        break;
      case 'help':
        speakHelp();
        break;
      case 'progress':
        speakProgress();
        break;
      case 'pause':
        ttsManager.pause();
        setVoiceStatus('idle');
        break;
      case 'resume':
        ttsManager.resume();
        setVoiceStatus('speaking');
        break;
      default:
        console.log('🎤 Starlet25: Unknown command:', command);
    }
  };

  const handleVoiceError = (error: string) => {
    setErrorMessage(error);
    setVoiceStatus('error');
    ttsManager.speakError(error);
  };

  const speakCurrentCard = () => {
    if (!currentCard) return;

    setVoiceStatus('speaking');
    if (showAnswer) {
      ttsManager.speakQuestion(currentCard.question);
      setTimeout(() => {
        ttsManager.speakAnswer(currentCard.answer);
      }, 2000);
    } else {
      ttsManager.speakQuestion(currentCard.question);
    }
  };

  const speakQuestion = () => {
    if (!currentCard) return;
    setVoiceStatus('speaking');
    ttsManager.speakQuestion(currentCard.question);
  };

  const speakAnswer = () => {
    if (!currentCard) return;
    setVoiceStatus('speaking');
    ttsManager.speakAnswer(currentCard.answer);
  };

  const speakProgress = () => {
    setVoiceStatus('speaking');
    ttsManager.speakProgress(currentCardIndex + 1, flashcards.length);
  };

  const speakHelp = () => {
    setVoiceStatus('speaking');
    const helpText = sttManager.getCommandHelp();
    ttsManager.speak(`Available commands: ${helpText}`, true);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      sessionRef.current.cardsReviewed++;
      ttsManager.speakNavigation('next');
    } else {
      ttsManager.speak('This is the last card. Say previous to go back or stop to end session.');
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
      ttsManager.speakNavigation('previous');
    } else {
      ttsManager.speak('This is the first card. Say next to continue or stop to end session.');
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopVoiceSession();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      startVoiceSession();
    }
  };

  const getVoiceStatusColor = () => {
    switch (voiceStatus) {
      case 'speaking': return 'text-blue-600';
      case 'listening': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getVoiceStatusIcon = () => {
    switch (voiceStatus) {
      case 'speaking': return '🔊';
      case 'listening': return '🎤';
      case 'error': return '⚠️';
      default: return '🔇';
    }
  };

  if (!currentCard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Flashcards Available</h3>
            <p className="text-gray-600 mb-4">No flashcards were generated from this content.</p>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">Voice-Enabled Flashcards</h2>
            <div className={`flex items-center space-x-2 ${getVoiceStatusColor()}`}>
              <span className="text-2xl">{getVoiceStatusIcon()}</span>
              <span className="text-sm font-medium capitalize">{voiceStatus}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoice}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                voiceEnabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
            <span>{Math.round(((currentCardIndex + 1) / flashcards.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">❓</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentCard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentCard.difficulty}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {currentCard.readingTime}
            </div>
          </div>

          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Question:</h3>
            <p className="text-blue-900 leading-relaxed">{currentCard.question}</p>
          </div>

          {/* Answer */}
          <div className={`border rounded-lg p-4 mb-4 transition-all duration-300 ${
            showAnswer 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${showAnswer ? 'text-green-800' : 'text-gray-600'}`}>
                Answer:
              </h3>
              <button
                onClick={toggleAnswer}
                className={`text-sm font-medium transition-colors ${
                  showAnswer ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
            </div>
            {showAnswer && (
              <p className="text-green-900 leading-relaxed">{currentCard.answer}</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {currentCard.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Voice Commands Help */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <div className="flex items-start">
              <span className="mr-2">🎤</span>
              <div>
                <p className="font-medium mb-1">Voice Commands:</p>
                <p className="text-xs">Say "next", "previous", "repeat", "read answer", or "help"</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-auto">
            <button
              onClick={previousCard}
              disabled={currentCardIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={speakQuestion}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                🔊 Read Question
              </button>
              <button
                onClick={speakAnswer}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                🔊 Read Answer
              </button>
            </div>
            
            <button
              onClick={nextCard}
              disabled={currentCardIndex === flashcards.length - 1}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceFlashcardViewer; 