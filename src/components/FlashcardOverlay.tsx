import React, { useState, useEffect } from 'react';

interface FlashcardOverlayProps {
  flashcards: string[];
  onClose: () => void;
}

const FlashcardOverlay: React.FC<FlashcardOverlayProps> = ({ flashcards, onClose }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Rotating colors for visual variety
  const colors = [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-600',
    'bg-gradient-to-br from-purple-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-blue-600',
    'bg-gradient-to-br from-red-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-purple-600',
    'bg-gradient-to-br from-indigo-500 to-blue-600'
  ];

  const currentColor = colors[currentCardIndex % colors.length];
  const isLastCard = currentCardIndex === flashcards.length - 1;

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          nextCard();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevCard();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentCardIndex, flashcards.length]);

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Content Available</h3>
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
      <div className={`${currentColor} rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Study Notes</h2>
            <p className="text-white text-opacity-80">
              Card {currentCardIndex + 1} of {flashcards.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white text-opacity-80 hover:text-opacity-100 text-3xl font-bold transition-opacity"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white bg-opacity-95 rounded-xl p-8 shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-6">📝</div>
              <p className="text-xl text-gray-800 leading-relaxed font-medium">
                {flashcards[currentCardIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:bg-opacity-10 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            ← Previous
          </button>
          
          {/* Progress dots */}
          <div className="flex space-x-2">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCardIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentCardIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={isLastCard ? onClose : nextCard}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            {isLastCard ? 'Finish' : 'Next →'}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center mt-4">
          <p className="text-white text-opacity-60 text-sm">
            Use ← → arrows or spacebar to navigate • Esc to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashcardOverlay; 