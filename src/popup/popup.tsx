import React, { useState, useEffect } from 'react';
import { ProcessedText, formatReadingTime, formatWordCount, formatCharacterCount } from '../utils/textProcessor';
import { SummarizationResult, Summary } from '../utils/summarizer';
import { downloadAsTxt } from '../utils/fileExport';
import { listenForCommand } from '../utils/voiceCommand';
import FlashcardViewer from '../components/FlashcardViewer';

interface StoredText {
  id: string;
  text: string;
  url: string;
  title: string;
  timestamp: number;
  processed?: ProcessedText;
  summarization?: SummarizationResult;
}

const Popup: React.FC = () => {
  const [storedTexts, setStoredTexts] = useState<StoredText[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  const [currentProcessed, setCurrentProcessed] = useState<ProcessedText | null>(null);
  const [currentSummarization, setCurrentSummarization] = useState<SummarizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);

  useEffect(() => {
    loadStoredTexts();
  }, []);

  const loadStoredTexts = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STORED_TEXTS' });
      if (response && response.texts) {
        setStoredTexts(response.texts);
      }
    } catch (err) {
      console.error('Error loading stored texts:', err);
    }
  };

  const extractCurrentPage = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_PAGE' });
      if (response.success) {
        setCurrentText(response.text);
        if (response.processed) {
          setCurrentProcessed(response.processed);
        }
        if (response.summarization) {
          setCurrentSummarization(response.summarization);
        }
        await loadStoredTexts(); // Refresh the list
      } else {
        setError(response.error || 'Failed to extract text');
      }
    } catch (err) {
      setError('Error extracting text from current page');
    } finally {
      setLoading(false);
    }
  };

  const rescanPage = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_PAGE' });
      if (response.success) {
        setCurrentText(response.text);
        if (response.processed) {
          setCurrentProcessed(response.processed);
        }
        if (response.summarization) {
          setCurrentSummarization(response.summarization);
        }
        await loadStoredTexts(); // Refresh the list
      } else {
        setError(response.error || 'Failed to re-scan page');
      }
    } catch (err) {
      setError('Error re-scanning page');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTexts = async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'CLEAR_STORED_TEXTS' });
      setStoredTexts([]);
      setCurrentText('');
      setCurrentProcessed(null);
      setCurrentSummarization(null);
    } catch (err) {
      console.error('Error clearing texts:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show a brief success message
      const originalText = document.title;
      document.title = 'Copied!';
      setTimeout(() => {
        document.title = originalText;
      }, 1000);
    });
  };

  const speakSummary = () => {
    if (currentSummarization?.summary.text) {
      try {
        const utterance = new SpeechSynthesisUtterance(currentSummarization.summary.text);
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Add event listeners for better user feedback
        utterance.onstart = () => {
          console.log('Speech started');
        };
        
        utterance.onend = () => {
          console.log('Speech ended');
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
        };
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error with text-to-speech:', error);
        // Fallback: try to use a different approach or show an error message
      }
    }
  };

  const downloadText = () => {
    if (currentText) {
      const blob = new Blob([currentText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted_text_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadBrailleTxt = () => {
    if (!currentSummarization) return;
    let txt = '';
    if (currentSummarization.summary.text) {
      txt += 'Summary:\n' + currentSummarization.summary.text + '\n\n';
    }
    if (currentSummarization.summary.keyPoints?.length) {
      txt += 'Key Points:\n';
      currentSummarization.summary.keyPoints.forEach((kp, i) => {
        txt += `${i + 1}. ${kp}\n`;
      });
      txt += '\n';
    }
    if (currentSummarization.flashcards?.length) {
      txt += 'Flashcards:\n';
      currentSummarization.flashcards.forEach((card, i) => {
        txt += `Q${i + 1}: ${card.question}\nA${i + 1}: ${card.answer}\nType: ${card.type}, Difficulty: ${card.difficulty}`;
        if (card.tags?.length) txt += `, Tags: ${card.tags.join(', ')}`;
        txt += '\n\n';
      });
    }
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_flashcards_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (currentSummarization?.summary && currentSummarization?.flashcards) {
      const title = currentSummarization.summary.topics.length > 0 
        ? `${currentSummarization.summary.topics[0]} Study Guide`
        : 'Study Material';
      downloadAsTxt(currentSummarization.summary, currentSummarization.flashcards, title);
    }
  };

  const handleVoiceCommand = () => {
    listenForCommand(() => {
      // Trigger the same logic as the extract button
      extractCurrentPage();
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

  const renderSummary = (summary: Summary) => (
    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
      <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
      <p className="text-sm text-blue-700 mb-2">{summary.text}</p>
      
      <div className="flex gap-2 mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          summary.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
          summary.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {summary.difficulty}
        </span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          {Math.round(summary.confidence * 100)}% confidence
        </span>
      </div>
      
      {summary.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {summary.topics.map((topic, index) => (
            <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
              {topic}
            </span>
          ))}
        </div>
      )}
      
      {summary.keyPoints.length > 0 && (
        <div className="text-xs">
          <span className="text-blue-600 font-medium">Key Points:</span>
          <ul className="list-disc list-inside text-blue-700 mt-1">
            {summary.keyPoints.slice(0, 3).map((point, index) => (
              <li key={index}>{truncateText(point, 80)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-96 h-96 bg-white p-4 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Starlet25</h1>
        <p className="text-sm text-gray-600 mb-3">Extract & Learn</p>
        
        <button
          onClick={extractCurrentPage}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          {loading ? 'Summarizing...' : '📄 Summarize Page'}
        </button>

        <button
          onClick={rescanPage}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          {loading ? 'Re-scanning...' : '🔄 Re-scan Page'}
        </button>

        <button
          onClick={handleVoiceCommand}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          🎙️ Voice Command
        </button>

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
          <h3 className="font-semibold text-gray-800 mb-2">Current Page Text</h3>
          {currentProcessed && renderTextStats(currentProcessed)}
          {currentSummarization && renderSummary(currentSummarization.summary)}
          
          {currentSummarization?.isFallback && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700 text-xs flex items-center">
                <span className="mr-1">⚠️</span>
                Fallback flashcards shown (summary confidence was low or content unavailable)
              </p>
            </div>
          )}
          
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => copyToClipboard(currentText)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Copy Text
            </button>
            {currentSummarization && currentSummarization.flashcards.length > 0 && (
              <button
                onClick={() => setShowFlashcards(true)}
                className="text-green-500 hover:text-green-600 text-sm"
              >
                View Flashcards ({currentSummarization.flashcards.length})
              </button>
            )}
            {currentSummarization?.summary.text && (
              <button
                onClick={speakSummary}
                className="text-purple-500 hover:text-purple-600 text-sm"
              >
                🔊 Speak Summary
              </button>
            )}
            {currentText && (
              <button
                onClick={downloadText}
                className="text-orange-500 hover:text-orange-600 text-sm"
              >
                📄 Download Text
              </button>
            )}
            {currentSummarization && (
              <button
                onClick={downloadBrailleTxt}
                className="text-pink-500 hover:text-pink-600 text-sm"
              >
                ⠿ Export as .txt (Braille)
              </button>
            )}
            {currentSummarization?.summary && currentSummarization?.flashcards && (
              <button
                onClick={exportAsText}
                className="text-indigo-500 hover:text-indigo-600 text-sm"
              >
                📁 Export as Text
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-700">
            {truncateText(currentText, 150)}
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

      {storedTexts.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Recent Extractions</h3>
            <button
              onClick={clearAllTexts}
              className="text-red-500 hover:text-red-600 text-sm"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {storedTexts.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded border">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-800 text-sm truncate">
                    {item.title}
                  </h4>
                  <button
                    onClick={() => copyToClipboard(item.text)}
                    className="text-blue-500 hover:text-blue-600 text-xs ml-2"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-1 truncate">
                  {item.url}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {formatDate(item.timestamp)}
                </p>
                {item.processed && renderTextStats(item.processed)}
                {item.summarization && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Summary: </span>
                    <span className="text-xs text-gray-700">{truncateText(item.summarization.summary.text, 60)}</span>
                    {item.summarization.flashcards.length > 0 && (
                      <span className={`text-xs ml-2 ${item.summarization.isFallback ? 'text-yellow-600' : 'text-green-600'}`}>
                        ({item.summarization.flashcards.length} cards{item.summarization.isFallback ? ' - fallback' : ''})
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-700">
                  {truncateText(item.text, 80)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {storedTexts.length === 0 && !currentText && !loading && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Starlet25</h3>
            <p className="text-gray-600 mb-4">Your AI-powered learning companion</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">🚀 Get Started</h4>
            <p className="text-sm text-blue-700 mb-3">
              Click "📄 Summarize Page" to extract and learn from any webpage
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• 📖 Extract main content from articles</p>
              <p>• 🧠 Generate AI-powered summaries</p>
              <p>• 🎯 Create learning flashcards</p>
              <p>• 🔊 Listen to summaries with text-to-speech</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Works best with articles, documentation, and educational content
            </p>
          </div>
        </div>
      )}

      {/* Flashcard Viewer Modal */}
      {showFlashcards && currentSummarization && (
        <FlashcardViewer
          flashcards={currentSummarization.flashcards}
          onClose={() => setShowFlashcards(false)}
        />
      )}
    </div>
  );
};

export default Popup;
