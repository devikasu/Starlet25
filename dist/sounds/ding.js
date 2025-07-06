// Generate a pleasant "ding" sound using Web Audio API
function generateDingSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create oscillator for the ding sound
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configure the sound
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Start at 800Hz
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1); // Rise to 1200Hz
  
  // Configure volume envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Decay
  
  // Start and stop the sound
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
  
  return audioContext;
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateDingSound };
} else {
  window.generateDingSound = generateDingSound;
} 