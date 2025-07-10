// Sound effect manager for Water Quest
// Preload and play sounds for can, plus, and biohazard clicks

const soundUrls = {
  can: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b7b2b2.mp3', // water droplet
  plus: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b2b2b.mp3', // positive bling
  biohazard: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b2b2c.mp3', // negative buzz
};

// Unlock audio context on first user interaction (for iOS/Chrome)
let audioUnlocked = false;
function unlockAudio() {
  if (!audioUnlocked) {
    // Play a silent sound to unlock audio context
    const silent = new Audio();
    silent.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    silent.volume = 0;
    silent.play().catch(() => {});
    // Preload all sounds at zero volume
    Object.values(soundUrls).forEach(url => {
      const a = new Audio(url);
      a.volume = 0;
      a.play().catch(() => {});
    });
    audioUnlocked = true;
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
}
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

function playSound(type) {
  if (soundUrls[type]) {
    const s = new Audio(soundUrls[type]);
    s.volume = 0.45;
    s.play().catch((err) => {
      // For debugging: log if play fails
      console.log('Audio play failed:', err);
    });
  }
}
