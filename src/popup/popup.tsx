import React, { useState, useEffect } from 'react';
import { ProcessedText, formatReadingTime, formatWordCount, formatCharacterCount } from '../utils/textProcessor';
import { SummarizationResult, Summary } from '../utils/summarizer';
import { downloadAsTxt } from '../utils/fileExport';
import { listenForCommand } from '../utils/voiceCommand';
import FlashcardViewer from '../components/FlashcardViewer';
import FlashcardOverlay from '../components/FlashcardOverlay';

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
  const [accessibilityEnabled, setAccessibilityEnabled] = useState<boolean>(false);
  const [accessibilityLoading, setAccessibilityLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'summary' | 'flashcards'>('summary');
  const [saturation, setSaturation] = useState<number>(100);
  const [showADHDFlashcards, setShowADHDFlashcards] = useState<boolean>(false);
  const [selectedDeck, setSelectedDeck] = useState<string>('focus');
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  useEffect(() => {
    loadStoredTexts();
    loadAccessibilityStatus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when popup is focused
      if (event.ctrlKey && event.altKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            event.preventDefault();
            if (!loading) {
              extractCurrentPage();
            }
            break;
          case 'r':
            event.preventDefault();
            if (!loading) {
              rescanPage();
            }
            break;
          case 'q':
            event.preventDefault();
            if (!loading) {
              handleVoiceCommand();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading]); // Re-run when loading state changes

  const loadAccessibilityStatus = async () => {
    try {
      const result = await chrome.storage.local.get(['accessibilityEnabled']);
      setAccessibilityEnabled(result.accessibilityEnabled === true);
    } catch (err) {
      console.error('Error loading accessibility status:', err);
    }
  };

  const toggleAccessibility = async () => {
    setAccessibilityLoading(true);
    try {
      const newState = !accessibilityEnabled;
      await chrome.storage.local.set({ accessibilityEnabled: newState });
      setAccessibilityEnabled(newState);
      
      // Send message to background script to handle the toggle
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: 'TOGGLE_ACCESSIBILITY', 
          enabled: newState 
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && (response as any).success) {
        console.log('Starlet25: Accessibility toggled successfully');
      } else {
        throw new Error('Failed to toggle accessibility');
      }
    } catch (err) {
      console.error('Error toggling accessibility:', err);
      setError('Failed to toggle accessibility');
    } finally {
      setAccessibilityLoading(false);
    }
  };

  const loadStoredTexts = async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'GET_STORED_TEXTS' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && (response as any).texts) {
        setStoredTexts((response as any).texts);
      }
    } catch (err) {
      console.error('Error loading stored texts:', err);
    }
  };

  const extractCurrentPage = async () => {
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
        }
        await loadStoredTexts(); // Refresh the list
      } else {
        setError((response as any).error || 'Failed to extract text');
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
        }
        await loadStoredTexts(); // Refresh the list
      } else {
        setError((response as any).error || 'Failed to re-scan page');
      }
    } catch (err) {
      setError('Error re-scanning page');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTexts = async () => {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'CLEAR_STORED_TEXTS' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
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

  const applySaturationFilter = async (saturationValue: number) => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        console.error('No active tab found for saturation filter');
        return;
      }

      // Check if we're on a chrome:// page (which won't work)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        console.log('Cannot apply saturation filter to chrome:// pages');
        return;
      }

      // Inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['assets/content.js'],
        });
        console.log('🎨 Content script injected for saturation filter');
      } catch (error) {
        console.log('🎨 Content script already injected or injection failed:', error);
      }

      // Small delay to ensure content script is ready
      setTimeout(() => {
        // Send message to content script to apply saturation filter
        chrome.tabs.sendMessage(tab.id!, {
          action: 'APPLY_SATURATION_FILTER',
          saturation: saturationValue
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('🎨 Content script not ready for saturation filter:', chrome.runtime.lastError.message);
            // Try injecting again and retry
            chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ['assets/content.js'],
            }).then(() => {
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id!, {
                  action: 'APPLY_SATURATION_FILTER',
                  saturation: saturationValue
                }, (retryResponse) => {
                  if (chrome.runtime.lastError) {
                    console.error('🎨 Failed to apply saturation filter after retry:', chrome.runtime.lastError.message);
                  } else if (retryResponse && retryResponse.success) {
                    console.log(`🎨 Starlet25: Saturation filter applied: ${saturationValue}%`);
                  }
                });
              }, 100);
            });
          } else if (response && response.success) {
            console.log(`🎨 Starlet25: Saturation filter applied: ${saturationValue}%`);
          } else {
            console.error('🎨 Failed to apply saturation filter - response:', response);
          }
        });
      }, 50);
    } catch (error) {
      console.error('🎨 Error applying saturation filter:', error);
    }
  };

  const handleSaturationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseInt(event.target.value);
    setSaturation(newSaturation);
    // Apply filter immediately for smooth real-time updates
    applySaturationFilter(newSaturation);
  };

  const resetSaturation = () => {
    setSaturation(100);
    applySaturationFilter(100);
  };

  // ADHD-friendly flashcard decks
  const adhdFlashcardDecks = {
    focus: [
      "Start with easy tasks to build momentum",
      "Take one small step at a time",
      "Use timers to stay on track",
      "Break big tasks into tiny pieces",
      "Celebrate every small win",
      "Remove distractions from your space",
      "Set clear, simple goals",
      "Take short breaks when needed"
    ],
    study: [
      "Read one paragraph at a time",
      "Write down key points as you go",
      "Use highlighters for important info",
      "Take breaks every 25 minutes",
      "Review what you learned",
      "Ask questions about the material",
      "Connect new info to what you know",
      "Practice explaining it to someone"
    ],
    work: [
      "Make a simple to-do list",
      "Pick your most important task",
      "Set a timer for focused work",
      "Put your phone in another room",
      "Use noise-canceling headphones",
      "Take a walk when you're stuck",
      "Ask for help when needed",
      "Remember: progress over perfection"
    ]
  };

  const launchADHDFlashcards = () => {
    setShowADHDFlashcards(true);
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-3">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">📋</span>
        <h4 className="font-semibold text-blue-800 text-sm">Summary</h4>
        <div className="ml-auto flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            summary.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            summary.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {summary.difficulty}
          </span>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {Math.round(summary.confidence * 100)}% confidence
          </span>
        </div>
      </div>
      
      <p className="text-sm text-blue-900 leading-relaxed mb-3 font-medium">
        {summary.text}
      </p>
      
      {summary.keyPoints.length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-semibold text-blue-700 mb-2 flex items-center">
            <span className="mr-1">💡</span>
            Key Points:
          </h5>
          <ul className="space-y-1">
            {summary.keyPoints.slice(0, 3).map((point, index) => (
              <li key={index} className="text-xs text-blue-800 flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="leading-relaxed">{truncateText(point, 80)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {summary.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {summary.topics.map((topic, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-96 h-96 bg-white p-4 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800">Starlet25</h1>
          <div className="flex gap-1">
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              <kbd className="bg-white px-1 rounded text-xs border">Alt+Shift+V</kbd>
            </div>
          </div>
        </div>
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="flex items-start">
            <span className="mr-2">⌨️</span>
            <div>
              <p className="font-medium mb-1">Keyboard Shortcuts:</p>
              <div className="grid grid-cols-1 gap-1">
                <div className="flex justify-between">
                  <span>Summarize:</span>
                  <kbd className="bg-white px-1 rounded text-xs border">Ctrl+Alt+S</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Rescan:</span>
                  <kbd className="bg-white px-1 rounded text-xs border">Ctrl+Alt+R</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Quick Summarize:</span>
                  <kbd className="bg-white px-1 rounded text-xs border">Ctrl+Alt+Q</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">Extract & Learn</p>
        
        <button
          onClick={extractCurrentPage}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          {loading ? 'Summarizing...' : '📄 Summarize Page (Ctrl+Alt+S)'}
        </button>

        <button
          onClick={rescanPage}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          {loading ? 'Re-scanning...' : '🔄 Re-scan Page (Ctrl+Alt+R)'}
        </button>

        <button
          onClick={handleVoiceCommand}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded mb-3 transition-colors"
        >
          🚀 Quick Summarize (Ctrl+Alt+Q)
        </button>

        {/* Voice Assistant Section */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800">Voice Assistant</h3>
            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
              <span className="mr-1">🎤</span>
              Alt+Shift+V
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            Full voice control for blind users. Press Alt+Shift+V to start.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs text-purple-700">
            <div className="flex items-start">
              <span className="mr-2">🎤</span>
              <div>
                <p className="font-medium mb-1">Voice Commands Available:</p>
                <ul className="space-y-1">
                  <li>• "summarize page" - Extract and summarize content</li>
                  <li>• "read flashcards" - Read generated flashcards aloud</li>
                  <li>• "read summary" - Read page summary aloud</li>
                  <li>• "toggle accessibility" - Turn accessibility on/off</li>
                  <li>• "help" - List all available commands</li>
                  <li>• "stop" - Stop current speech or listening</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Section */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800">Accessibility</h3>
            <div className={`flex items-center text-xs ${
              accessibilityEnabled ? 'text-green-600' : 'text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                accessibilityEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              {accessibilityEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            Toggle voice reading of page content for accessibility
          </p>
          
          <button
            onClick={toggleAccessibility}
            disabled={accessibilityLoading}
            className={`w-full font-medium py-2 px-4 rounded transition-colors ${
              accessibilityEnabled
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {accessibilityLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              accessibilityEnabled ? '🟢 Turn Off Accessibility' : '🔴 Turn On Accessibility'
            )}
          </button>
          
          {accessibilityEnabled && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <div className="flex items-start">
                <span className="mr-2">♿</span>
                <div>
                  <p className="font-medium mb-1">Accessibility is active!</p>
                  <p>Press <kbd className="bg-white px-1 rounded text-xs border">Alt+N</kbd> on any page to read content aloud.</p>
                  <p>Press <kbd className="bg-white px-1 rounded text-xs border">Alt+Shift+V</kbd> to start voice assistant.</p>
                </div>
              </div>
            </div>
          )}
          
          {!accessibilityEnabled && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              <div className="flex items-start">
                <span className="mr-2">⌨️</span>
                <div>
                  <p className="font-medium mb-1">Keyboard Shortcuts</p>
                  <p>Press <kbd className="bg-white px-1 rounded text-xs border">Alt+N</kbd> to read content aloud (when accessibility enabled).</p>
                  <p>Press <kbd className="bg-white px-1 rounded text-xs border">Alt+Shift+V</kbd> to start voice assistant.</p>
                </div>
              </div>
            </div>
          )}
        </div>

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
            Adjust the color saturation of the current webpage for better visibility
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 w-8">0%</span>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={handleSaturationChange}
                onInput={handleSaturationChange}
                disabled={false}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${saturation/2}%, #f3f4f6 ${saturation/2}%, #f3f4f6 100%)`
                }}
              />
              <span className="text-xs text-gray-500 w-8">200%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {saturation < 100 ? 'Desaturated' : saturation > 100 ? 'Oversaturated' : 'Normal'}
              </div>
              <button
                onClick={resetSaturation}
                disabled={saturation === 100}
                className="text-xs text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Reset to 100%
              </button>
            </div>
            
            {false && (
              <div className="flex items-center justify-center text-xs text-orange-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500 mr-2"></div>
                Applying filter...
              </div>
            )}
          </div>
          
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <div className="flex items-start">
              <span className="mr-2">💡</span>
              <div>
                <p className="font-medium mb-1">Saturation Tips:</p>
                <ul className="space-y-1">
                  <li>• <strong>0-50%:</strong> Grayscale to muted colors (good for reading)</li>
                  <li>• <strong>100%:</strong> Normal colors (default)</li>
                  <li>• <strong>150-200%:</strong> Vibrant colors (good for visual appeal)</li>
                  <li>• <strong>Reset:</strong> Returns to normal 100% saturation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ADHD-Friendly Flashcards Section */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800">ADHD Focus Cards</h3>
            <div className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
              <span className="mr-1">🧠</span>
              Focus Mode
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            Simple, distraction-free flashcards for ADHD-friendly learning
          </p>
          
          {/* Deck Selection */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Choose a deck:</label>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="focus">Focus Tips</option>
              <option value="study">Study Hacks</option>
              <option value="work">Work Strategies</option>
            </select>
          </div>
          
          {/* Options */}
          <div className="space-y-2 mb-3">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="mr-2"
              />
              Auto-advance every 10 seconds
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="mr-2"
              />
              Read cards aloud
            </label>
          </div>
          
          <button
            onClick={launchADHDFlashcards}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🧠 Start Focus Cards
          </button>
          
          <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">
            <div className="flex items-start">
              <span className="mr-2">💡</span>
              <div>
                <p className="font-medium mb-1">ADHD-Friendly Features:</p>
                <ul className="space-y-1">
                  <li>• One card at a time (no distractions)</li>
                  <li>• Short, simple tips (under 15 words)</li>
                  <li>• Keyboard shortcuts (Space/→ to advance)</li>
                  <li>• Voice reading option</li>
                  <li>• Auto-advance timer</li>
                </ul>
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
          <h3 className="font-semibold text-gray-800 mb-2">Current Page Content</h3>
          {currentProcessed && renderTextStats(currentProcessed)}
          
          {/* View Mode Toggle */}
          {currentSummarization && (
            <div className="mb-3">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-1">📋</span>
                    Summary
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('flashcards')}
                  className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                    viewMode === 'flashcards'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-1">🎯</span>
                    Flashcards ({currentSummarization.flashcards.length})
                  </span>
                </button>
              </div>
            </div>
          )}
          
          {/* Content View */}
          {viewMode === 'summary' && currentSummarization && (
            <div>
              {renderSummary(currentSummarization.summary)}
              
              {currentSummarization?.isFallback && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-700 text-xs flex items-center">
                    <span className="mr-1">⚠️</span>
                    Fallback flashcards shown (summary confidence was low or content unavailable)
                  </p>
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'flashcards' && currentSummarization && (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-800 mb-2">Ready to Study?</h4>
              <p className="text-sm text-gray-600 mb-3">
                {currentSummarization.flashcards.length} flashcards generated from this content
              </p>
              <button
                onClick={() => setShowFlashcards(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                Start Studying
              </button>
            </div>
          )}
          
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => copyToClipboard(currentText)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Copy Text
            </button>
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

      {/* ADHD Flashcard Overlay */}
      <FlashcardOverlay
        flashcards={adhdFlashcardDecks[selectedDeck as keyof typeof adhdFlashcardDecks]}
        isVisible={showADHDFlashcards}
        onClose={() => setShowADHDFlashcards(false)}
        autoAdvance={autoAdvance}
        voiceEnabled={voiceEnabled}
      />
    </div>
  );
};

export default Popup;
