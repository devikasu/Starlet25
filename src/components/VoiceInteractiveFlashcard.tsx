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
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => {
    // Set up state change handler
    voiceFlashcardSystem.setStateChangeHandler((newSession) => {
      setSession(newSession);
      sessionRef.current = newSession;
      setIsListening(!!newSession?.isListening);
    });

    // Set up answer received handler
    voiceFlashcardSystem.setAnswerReceivedHandler((_questionId, userAnswer, isCorrect) => {
      setUserAnswer(userAnswer);
      setIsAnswering(false);
      setLastFeedback({
        correct: isCorrect,
        message: isCorrect ? 'Correct! Well done.' : 'Good try. Check the answer above.'
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

  // Manual trigger for listening (debugging)
  const manualListen = () => {
    if ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        alert('Manual voice input: ' + transcript);
      };
      recognition.start();
    }
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
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">🎤 Voice Interactive Flashcards</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isListening ? 'Listening' : session?.isSpeaking ? 'Speaking' : 'Ready'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              Card {session?.currentIndex ? session.currentIndex + 1 : 0} of {session?.flashcards.length || 0}
            </span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {currentCard && (
            <div className="space-y-6">
              {/* Current Flashcard */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-800">
                    {currentCard.type === 'summary' ? '📋 Summary' : '❓ Question'}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    currentCard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentCard.difficulty}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Question:</h4>
                    <p className="text-blue-900">{currentCard.question}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Answer:</h4>
                    <p className="text-blue-900">{currentCard.answer}</p>
                  </div>
                  {/* Render summary points if available */}
                  {currentCard.type === 'summary' && currentCard.summary && (
                    <div className="mt-2">
                      <h4 className="font-medium text-blue-700 mb-1">Summary Points:</h4>
                      <ul className="list-disc list-inside text-blue-800 text-sm">
                        {currentCard.summary.split(/[.;\n]/).filter(s => s.trim().length > 0).map((point, idx) => (
                          <li key={idx}>{point.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* User Answer Section */}
              {isAnswering && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-700 font-medium">Listening for your answer...</span>
                  </div>
                  <p className="text-yellow-600 text-sm">Speak clearly into your microphone</p>
                </div>
              )}

              {/* Feedback Section */}
              {lastFeedback && (
                <div className={`border rounded-lg p-4 ${
                  lastFeedback.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">
                      {lastFeedback.correct ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className={`font-medium ${
                        lastFeedback.correct ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {lastFeedback.message}
                      </p>
                      {userAnswer && (
                        <p className="text-sm text-gray-600 mt-1">
                          Your answer: "{userAnswer}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Session Stats */}
              {stats && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Session Progress</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Questions Answered:</span>
                      <span className="ml-2 font-medium">{stats.totalAnswers}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Correct Answers:</span>
                      <span className="ml-2 font-medium">{stats.correctAnswers}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Voice Commands Help */}
        {showHelp && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">🎤 Voice Commands</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-purple-700">
              <div>• "next" - Go to next card</div>
              <div>• "previous" - Go to previous card</div>
              <div>• "repeat" - Read current card again</div>
              <div>• "answer" - Start answering mode</div>
              <div>• "stop" - End session</div>
              <div>• "help" - Show this help</div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => handleVoiceCommand('previous')}
              disabled={!session || session.currentIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => handleVoiceCommand('repeat')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              🔊 Repeat
            </button>
            <button
              onClick={() => handleVoiceCommand('answer')}
              disabled={isAnswering}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              🎤 Answer
            </button>
            <button
              onClick={manualListen}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              🛠️ Manual Listen
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {showHelp ? 'Hide Help' : 'Help'}
            </button>
            <button
              onClick={() => handleVoiceCommand('next')}
              disabled={!session || session.currentIndex === session.flashcards.length - 1}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Voice Status */}
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            {isListening ? '🎤 Listening for voice commands...' : 
             session?.isSpeaking ? '🔊 Speaking...' : 
             '💡 Say "next", "previous", "repeat", or "answer"'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInteractiveFlashcard; 