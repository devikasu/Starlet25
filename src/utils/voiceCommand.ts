// Voice command utility - simplified version without SpeechRecognition

export const listenForCommand = (onSummarize: () => void) => {
  // Since SpeechRecognition can cause issues and requires permissions,
  // we'll just trigger the summarize action directly
  console.log('Starlet25: Voice command triggered - summarizing current page');
  onSummarize();
}; 