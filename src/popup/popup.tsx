import React, { useState } from 'react';
import { ProcessedText, formatReadingTime, formatWordCount, formatCharacterCount } from '../utils/textProcessor';
import { SummarizationResult, generateFlashcardsFromSummary } from '../utils/summarizer';
import FlashcardOverlay from '../components/FlashcardOverlay';

const Popup: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [currentProcessed, setCurrentProcessed] = useState<ProcessedText | null>(null);
  const [currentSummarization, setCurrentSummarization] = useState<SummarizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);
  const [saturation, setSaturation] = useState<number>(100);

  const startStudying = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_PAGE' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if ((response as any).success) {
        setCurrentText((response as any).text);
        if ((response as any).processed) {
          setCurrentProcessed((response as any).processed);
        }
        if ((response as any).summarization) {
          setCurrentSummarization((response as any).summarization);
          // Generate simple flashcards and show overlay
          generateFlashcardsFromSummary((response as any).summarization.summary);
          setShowFlashcards(true);
        }
      } else {
        setError((response as any).error || 'Failed to extract text');
      }
    } catch (err) {
      setError('Error extracting text from current page');
    } finally {
      setLoading(false);
    }
  };

  const applySaturationFilter = async (saturationValue: number) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Try multiple injection methods for better compatibility
      const injectionMethods = [
        // Method 1: Direct content script injection
        () => chrome.tabs.sendMessage(tab.id!, { 
          action: 'APPLY_SATURATION_FILTER', 
          saturation: saturationValue 
        }),
        // Method 2: Execute script directly
        () => chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: (saturation) => {
            const style = document.getElementById('starlet25-saturation-filter') || 
                         document.createElement('style');
            style.id = 'starlet25-saturation-filter';
            style.textContent = `* { filter: saturate(${saturation}%) !important; }`;
            if (!document.getElementById('starlet25-saturation-filter')) {
              document.head.appendChild(style);
            }
          },
          args: [saturationValue]
        }),
        // Method 3: Inject CSS via content script
        () => chrome.scripting.insertCSS({
          target: { tabId: tab.id! },
          css: `* { filter: saturate(${saturationValue}%) !important; }`
        })
      ];

      let success = false;
      for (const method of injectionMethods) {
        try {
          await method();
          success = true;
          break;
        } catch (err) {
          console.log('Injection method failed, trying next...', err);
          continue;
        }
      }

      if (success) {
        console.log(`Saturation filter applied: ${saturationValue}%`);
      } else {
        console.error('All saturation injection methods failed');
      }
    } catch (err) {
      console.error('Error applying saturation filter:', err);
    }
  };

  const handleSaturationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setSaturation(value);
    applySaturationFilter(value);
  };

  const resetSaturation = () => {
    setSaturation(100);
    applySaturationFilter(100);
  };

  const renderTextStats = (processed: ProcessedText) => (
    <div className="text-xs text-gray-600 space-y-1 mb-2">
      <div className="flex justify-between">
        <span>{formatWordCount(processed.wordCount)}</span>
        <span>{formatCharacterCount(processed.characterCount)}</span>
      </div>
      <div className="flex justify-between">
        <span>Reading time: {formatReadingTime(processed.estimatedReadingTime)}</span>
        <span>Language: {processed.language.toUpperCase()}</span>
      </div>
      <div className="flex gap-2">
        {processed.hasCode && (
          <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">Code</span>
        )}
        {processed.hasLinks && (
          <span className="bg-green-100 text-green-800 px-1 rounded text-xs">Links</span>
        )}
      </div>
      {processed.keywords.length > 0 && (
        <div className="text-xs">
          <span className="text-gray-500">Keywords: </span>
          <span className="text-gray-700">{processed.keywords.slice(0, 3).join(', ')}</span>
          {processed.keywords.length > 3 && <span className="text-gray-500">...</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-96 h-96 bg-white p-4 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800">Starlet25</h1>
        </div>
        <p className="text-sm text-gray-600 mb-3">Extract & Learn</p>
        
        <button
          onClick={startStudying}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg mb-3 transition-colors text-lg"
        >
          {loading ? '🧠 Processing...' : '🎯 Start Studying'}
        </button>

        {/* Saturation Control Section */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800">Color Saturation</h3>
            <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              <span className="mr-1">🎨</span>
              {saturation}%
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            Adjust the color saturation of the current webpage
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={handleSaturationChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${saturation/2}%, #3b82f6 ${saturation/2}%, #3b82f6 100%)`
                }}
              />
              <button
                onClick={resetSaturation}
                className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
              >
                Reset
              </button>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>0%: Grayscale</span>
                <span>100%: Normal</span>
                <span>200%: Vibrant</span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <p className="text-blue-700 text-sm">Processing page content...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {currentText ? (
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <h3 className="font-semibold text-gray-800 mb-2">Page Content</h3>
          {currentProcessed && renderTextStats(currentProcessed)}
          
          <p className="text-sm text-gray-700">
            {currentText.length > 150 ? currentText.substring(0, 150) + '...' : currentText}
          </p>
        </div>
      ) : !loading && !error && (
        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <div className="text-center">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-medium text-gray-800 mb-2">No Content Found</h3>
            <p className="text-sm text-gray-600 mb-3">
              This page doesn't appear to have extractable content
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-700">
                💡 <strong>Try:</strong> Navigate to an article, documentation, or text-heavy page
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentText && !loading && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Starlet25</h3>
            <p className="text-gray-600 mb-4">Your AI-powered learning companion</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">🚀 Get Started</h4>
            <p className="text-sm text-blue-700 mb-3">
              Click "🎯 Start Studying" to extract and learn from any webpage
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• 📖 Extract main content from articles</p>
              <p>• 🧠 Generate AI-powered summaries</p>
              <p>• 🎯 Create learning flashcards</p>
              <p>• 🎨 Adjust color saturation for better visibility</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Works best with articles, documentation, and educational content
            </p>
          </div>
        </div>
      )}

      {/* Flashcard Overlay */}
      {showFlashcards && currentSummarization && (
        <FlashcardOverlay
          flashcards={generateFlashcardsFromSummary(currentSummarization.summary)}
          onClose={() => setShowFlashcards(false)}
          summary={currentSummarization.summary.text}
        />
      )}
    </div>
  );
};

export default Popup;
