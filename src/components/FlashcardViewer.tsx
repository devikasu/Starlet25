import React, { useState } from 'react';
import { Flashcard } from '../utils/summarizer';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
    setFlippedCards(prev => new Set(prev).add(currentCard.id));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'definition': return 'bg-blue-100 text-blue-800';
      case 'concept': return 'bg-purple-100 text-purple-800';
      case 'fact': return 'bg-green-100 text-green-800';
      case 'process': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">No Flashcards Available</h3>
          <p className="text-gray-600 mb-4">No flashcards were generated for this content.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Flashcards ({currentIndex + 1}/{flashcards.length})</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          ></div>
        </div>

        {/* Card */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-6 min-h-[200px] flex flex-col justify-center">
            {/* Card metadata */}
            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(currentCard.type)}`}>
                {currentCard.type}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                {currentCard.difficulty}
              </span>
            </div>

            {/* Question/Answer */}
            <div className="text-center">
              <h4 className="text-lg font-medium mb-4">
                {showAnswer ? 'Answer' : 'Question'}
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {showAnswer ? currentCard.answer : currentCard.question}
              </p>
            </div>

            {/* Tags */}
            {currentCard.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {currentCard.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Previous
          </button>

          <button
            onClick={flipCard}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            {showAnswer ? 'Show Question' : 'Show Answer'}
          </button>

          <button
            onClick={nextCard}
            disabled={currentIndex === flashcards.length - 1}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Next
          </button>
        </div>

        {/* Card navigation dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setShowAnswer(false);
              }}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-blue-500' 
                  : flippedCards.has(flashcards[index].id) 
                    ? 'bg-green-400' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer; 