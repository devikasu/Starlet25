// Voice command utility using Web Speech API

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const listenForCommand = (onSummarize: () => void) => {
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    if (transcript.includes("summarize")) {
      onSummarize();
    }
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
}; 