import React, { useState, useEffect, useRef } from 'react';
import { voiceFlashcardSystem, VoiceFlashcard, VoiceSession } from '../utils/voiceFlashcardSystem';

interface VoiceInteractiveFlashcardProps {
  content: string;
  onClose: () => void;
  onSessionComplete?: (session: VoiceSession) => void; // Available for future use
}

const VoiceInteractiveFlashcard: React.FC<VoiceInteractiveFlashcardProps> = ({
  content,
  onClose,
  onSessionComplete: _onSessionComplete // Available for future use
}) => {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [waitingForArrowRight, setWaitingForArrowRight] = useState(false);
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => {
    // Set up state change handler
    voiceFlashcardSystem.setStateChangeHandler((newSession) => {
      setSession(newSession);
      sessionRef.current = newSession;
      setIsListening(!!newSession?.isListening);
      // Reset waiting state when moving to a new question
      setWaitingForArrowRight(false);
    });

    // Set up answer received handler
    voiceFlashcardSystem.setAnswerReceivedHandler((_questionId, userAnswer, isCorrect) => {
      setUserAnswer(userAnswer);
      setIsAnswering(false);
      setWaitingForArrowRight(!isCorrect);
      setLastFeedback({
        correct: isCorrect,
        message: isCorrect ? 'Correct! Moving to the next question.' : `Wrong. The correct answer is ${getCurrentCard()?.answer}. Press → to continue.`
      });
    });

    // Patch speech recognition events for debugging
    if ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.onstart = () => console.log('🎤 [DEBUG] Speech recognition started');
      recognition.onresult = (event: any) => console.log('🎤 [DEBUG] Speech recognition result:', event.results[0][0].transcript);
      recognition.onerror = (event: any) => console.log('🎤 [DEBUG] Speech recognition error:', event.error);
      recognition.onend = () => console.log('🎤 [DEBUG] Speech recognition ended');
    }

    // Start session
    startSession();

    return () => {
      voiceFlashcardSystem.stop();
    };
  }, []);

  // Handle ArrowRight key press for continuing after wrong answers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && waitingForArrowRight) {
        setWaitingForArrowRight(false);
        voiceFlashcardSystem.nextFlashcard();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [waitingForArrowRight]);



  const startSession = async () => {
    setIsStarting(true);
    setError('');

    try {
      const response = voiceFlashcardSystem.startSession(content);
      if (response.success) {
        console.log('🎤 Voice flashcard session started');
      } else {
        setError(response.error || 'Failed to start session');
      }
    } catch (err) {
      setError('Error starting voice session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    switch (command) {
      case 'next':
        if (session && session.currentIndex < session.flashcards.length - 1) {
          voiceFlashcardSystem.nextFlashcard();
        }
        break;
      case 'previous':
        if (session && session.currentIndex > 0) {
          voiceFlashcardSystem.previousFlashcard();
        }
        break;
      case 'repeat':
        voiceFlashcardSystem.askCurrentQuestion();
        break;
      case 'answer':
        setIsAnswering(true);
        setUserAnswer('');
        setLastFeedback(null);
        voiceFlashcardSystem.askCurrentQuestion();
        break;
      case 'stop':
        onClose();
        break;
      case 'help':
        setShowHelp(!showHelp);
        break;
    }
  };

  const getCurrentCard = (): VoiceFlashcard | null => {
    if (!session) return null;
    return session.flashcards[session.currentIndex] || null;
  };

  // Announce question to screen readers when it changes
  useEffect(() => {
    const currentCard = getCurrentCard();
    if (currentCard) {
      const questionElement = document.getElementById('question-text');
      if (questionElement) {
        questionElement.setAttribute('aria-live', 'polite');
        questionElement.focus();
      }
    }
  }, [session?.currentIndex]);

  const getProgressPercentage = (): number => {
    if (!session) return 0;
    return ((session.currentIndex + 1) / session.flashcards.length) * 100;
  };

  const getSessionStats = () => {
    if (!session) return null;
    
    const totalAnswers = session.userAnswers.size;
    const correctAnswers = Array.from(session.userAnswers.values()).filter(answer => 
      answer.toLowerCase().includes('correct') || answer.length > 1
    ).length;
    
    return { totalAnswers, correctAnswers };
  };



  if (!voiceFlashcardSystem.isSupported()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Features Not Supported</h3>
            <p className="text-gray-600 mb-4">
              Your browser doesn't support speech recognition or synthesis. 
              Please use a modern browser like Chrome or Edge.
            </p>
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

  if (isStarting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Starting Voice Session</h3>
            <p className="text-gray-600">Please allow microphone access when prompted.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
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

  const currentCard = getCurrentCard();
  const stats = getSessionStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-800">🎤 Voice Study</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">
                {isListening ? 'Listening' : session?.isSpeaking ? 'Speaking' : 'Ready'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            aria-label="Close voice study session"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 mb-1">
            Card {session?.currentIndex ? session.currentIndex + 1 : 0} of {session?.flashcards.length || 0}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Main Question Display */}
        {currentCard && (
          <div className="text-center mb-8">
            {/* Question Text - Large and prominent */}
            <div className="mb-6">
              <h3 
                id="question-text"
                className="text-2xl font-bold text-gray-800 mb-2 leading-relaxed"
                tabIndex={0}
                role="heading"
                aria-level={1}
              >
                {currentCard.question}
              </h3>
              <div className="text-sm text-gray-500">
                {currentCard.type === 'summary' ? '📋 Summary Card' : '❓ Question Card'}
              </div>
            </div>

            {/* Answer Section - Only show when needed */}
            {!isAnswering && !lastFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-700 mb-2">Answer:</h4>
                <p className="text-blue-900 text-lg">{currentCard.answer}</p>
              </div>
            )}

            {/* Listening Indicator */}
            {isAnswering && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-yellow-700 font-medium">Listening for your answer...</span>
                </div>
                <p className="text-yellow-600 text-sm">Speak clearly into your microphone</p>
              </div>
            )}

            {/* Feedback Section */}
            {lastFeedback && (
              <div className={`border rounded-lg p-4 mb-6 ${
                lastFeedback.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-center">
                  <span className="text-2xl mr-3">
                    {lastFeedback.correct ? '✅' : '❌'}
                  </span>
                  <div className="text-center">
                    <p className={`font-medium text-lg ${
                      lastFeedback.correct ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {lastFeedback.message}
                    </p>
                    {userAnswer && (
                      <p className="text-sm text-gray-600 mt-1">
                        Your answer: "{userAnswer}"
                      </p>
                    )}
                    {waitingForArrowRight && (
                      <div className="mt-3 flex items-center justify-center">
                        <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-blue-700 text-sm font-medium">
                          Press → to continue
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Three Small Buttons */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => handleVoiceCommand('repeat')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                aria-label="Repeat question"
                tabIndex={1}
              >
                🔁 Repeat
              </button>
              <button
                onClick={() => handleVoiceCommand('next')}
                disabled={!session || session.currentIndex === session.flashcards.length - 1}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                aria-label="Next question"
                tabIndex={2}
              >
                ⏭️ Next
              </button>
              <button
                onClick={() => handleVoiceCommand('previous')}
                disabled={!session || session.currentIndex === 0}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors text-sm"
                aria-label="Previous question"
                tabIndex={3}
              >
                ⏮️ Previous
              </button>
            </div>
          </div>
        )}

        {/* Session Stats - Compact */}
        {stats && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-x-4">
              <span>Answered: {stats.totalAnswers}</span>
              <span>Correct: {stats.correctAnswers}</span>
              <span>Progress: {Math.round(getProgressPercentage())}%</span>
            </div>
          </div>
        )}

        {/* Voice Status - Compact */}
        <div className="text-center mt-4">
          <p className="text-gray-500 text-xs">
            {isListening ? '🎤 Listening for voice commands...' : 
             session?.isSpeaking ? '🔊 Speaking...' : 
             '💡 Use voice commands or keyboard navigation'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInteractiveFlashcard; 