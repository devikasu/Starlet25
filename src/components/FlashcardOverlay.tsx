import React, { useState, useEffect } from 'react';

interface FlashcardOverlayProps {
  flashcards: string[];
  isVisible: boolean;
  onClose: () => void;
  autoAdvance?: boolean;
  voiceEnabled?: boolean;
}

const FlashcardOverlay: React.FC<FlashcardOverlayProps> = ({
  flashcards,
  isVisible,
  onClose,
  autoAdvance = false,
  voiceEnabled = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);

  // Auto-advance timer
  useEffect(() => {
    if (!isVisible || !autoAdvance || currentIndex >= flashcards.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, isVisible, autoAdvance, flashcards.length]);

  // Reset index when overlay opens
  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(0);
    }
  }, [isVisible]);

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const readCardAloud = () => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    setIsReading(true);
    const utterance = new SpeechSynthesisUtterance(flashcards[currentIndex]);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    
    speechSynthesis.cancel(); // Stop any current speech
    speechSynthesis.speak(utterance);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (!isVisible) return;
    
    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      nextCard();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, currentIndex]);

  if (!isVisible) return null;

  const currentCard = flashcards[currentIndex];
  const isLastCard = currentIndex === flashcards.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} of {flashcards.length}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close flashcards"
          >
            ×
          </button>
        </div>

        {/* Flashcard content */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gray-800 leading-relaxed mb-4">
            {currentCard}
          </div>
          
          {/* Voice button */}
          {voiceEnabled && (
            <button
              onClick={readCardAloud}
              disabled={isReading}
              className="mb-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              aria-label={isReading ? 'Reading aloud...' : 'Read card aloud'}
            >
              {isReading ? '🔊 Reading...' : '🔊 Read Aloud'}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <button
            onClick={nextCard}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
            aria-label={isLastCard ? 'Finish flashcards' : 'Next card'}
          >
            {isLastCard ? 'Finish' : 'Next →'}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Press <kbd className="bg-gray-100 px-2 py-1 rounded">Space</kbd> or <kbd className="bg-gray-100 px-2 py-1 rounded">→</kbd> for next</p>
          <p>Press <kbd className="bg-gray-100 px-2 py-1 rounded">Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
};

export default FlashcardOverlay; 