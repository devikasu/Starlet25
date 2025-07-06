import React, { useState } from 'react';
import { Flashcard } from '../utils/summarizer';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onClose }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'qa' | 'revision'>('qa');

  // Separate flashcards by type
  const qaCards = flashcards.filter(card => card.tags.includes('qa'));
  const revisionCards = flashcards.filter(card => card.tags.includes('revision'));
  
  const currentCards = activeTab === 'qa' ? qaCards : revisionCards;
  const currentCard = currentCards[currentCardIndex];

  const nextCard = () => {
    if (currentCardIndex < currentCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleTabChange = (tab: 'qa' | 'revision') => {
    setActiveTab(tab);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'definition': return '📖';
      case 'concept': return '💡';
      case 'fact': return '📊';
      case 'process': return '⚙️';
      default: return '📝';
    }
  };

  if (!currentCard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Flashcards Available</h3>
            <p className="text-gray-600 mb-4">No {activeTab === 'qa' ? 'Q&A' : 'Revision'} cards found for this content.</p>
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Flashcards</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => handleTabChange('qa')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'qa'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">❓</span>
              Q & A ({qaCards.length})
            </span>
          </button>
          <button
            onClick={() => handleTabChange('revision')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'revision'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">📝</span>
              Revision ({revisionCards.length})
            </span>
          </button>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getTypeIcon(currentCard.type)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                {currentCard.difficulty}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Card {currentCardIndex + 1} of {currentCards.length}
            </div>
          </div>

          {/* Reading Time */}
          <div className="flex items-center mb-2 text-xs text-gray-600" aria-label={`Estimated reading time: ${currentCard.readingTime}`}>
            <span className="mr-1" role="img" aria-label="Reading time">🕒</span>
            <span>{currentCard.readingTime}</span>
          </div>

          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Q:</h3>
            <p className="text-blue-900 leading-relaxed">{currentCard.question}</p>
          </div>

          {/* Answer */}
          <div className={`border rounded-lg p-4 mb-4 transition-all duration-300 ${
            showAnswer 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${showAnswer ? 'text-green-800' : 'text-gray-600'}`}>A:</h3>
              <button
                onClick={toggleAnswer}
                className={`text-sm font-medium transition-colors ${
                  showAnswer ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label={showAnswer ? 'Hide answer' : 'Show answer'}
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
              {currentCard.tags.filter(tag => !['qa', 'revision'].includes(tag)).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-auto">
            <button
              onClick={prevCard}
              disabled={currentCardIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-2">
              {currentCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentCardIndex(index);
                    setShowAnswer(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentCardIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextCard}
              disabled={currentCardIndex === currentCards.length - 1}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer; 