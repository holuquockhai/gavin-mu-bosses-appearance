const soundFiles = {
  chime: "/sounds/chime.wav",
  bell: "/sounds/bell.wav",
  beep: "/sounds/beep.wav",
  retro: "/sounds/retro.wav",
  alarm: "/sounds/alarm.wav",
};

const fallbackToneMap = {
  chime: [660, 880],
  bell: [784, 988, 784],
  beep: [1000],
  retro: [440, 660, 330],
  alarm: [740, 554, 740, 554],
};

let sharedAudioContext = null;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }

  return sharedAudioContext;
}

export function unlockAlertSound() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.01);
}

function playFallbackTone(soundStyle = "chime") {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const frequencies = fallbackToneMap[soundStyle] || fallbackToneMap.chime;
  const noteLength = 0.14;

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime + index * noteLength;
    const stopAt = startAt + noteLength;

    oscillator.type = soundStyle === "retro" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.15, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
  });
}

export function playAlertTone(soundStyle = "chime") {
  const soundFile = soundFiles[soundStyle] || soundFiles.chime;
  const audio = new Audio(soundFile);

  audio.volume = 0.85;
  audio.play().catch(() => playFallbackTone(soundStyle));
}
