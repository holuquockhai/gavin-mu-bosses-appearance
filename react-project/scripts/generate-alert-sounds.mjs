import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/sounds");
const sampleRate = 44100;

fs.mkdirSync(outDir, { recursive: true });

function wavBuffer(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  });

  return buffer;
}

function envelope(time, duration, attack = 0.015, release = 0.18) {
  if (time < attack) return time / attack;
  if (time > duration - release) return Math.max(0, (duration - time) / release);
  return 1;
}

function synth(duration, events) {
  const samples = new Float32Array(Math.floor(duration * sampleRate));

  for (let i = 0; i < samples.length; i += 1) {
    const time = i / sampleRate;
    let sample = 0;

    events.forEach((event) => {
      if (time < event.start || time > event.start + event.duration) return;

      const local = time - event.start;
      const env = envelope(local, event.duration, event.attack ?? 0.01, event.release ?? 0.15);
      const phase = 2 * Math.PI * event.frequency * local;
      const wave = event.wave === "square" ? Math.sign(Math.sin(phase)) : Math.sin(phase);
      sample += wave * env * event.gain;

      if (event.harmonic) {
        sample += Math.sin(phase * 2.01) * env * event.gain * event.harmonic;
      }
    });

    samples[i] = sample;
  }

  return wavBuffer(samples);
}

const sounds = {
  "chime.wav": synth(0.9, [
    { start: 0, duration: 0.28, frequency: 659.25, gain: 0.23, harmonic: 0.2 },
    { start: 0.18, duration: 0.32, frequency: 880, gain: 0.23, harmonic: 0.16 },
    { start: 0.38, duration: 0.42, frequency: 1318.51, gain: 0.18, harmonic: 0.12 },
  ]),
  "bell.wav": synth(1.1, [
    { start: 0, duration: 0.95, frequency: 783.99, gain: 0.23, harmonic: 0.45, attack: 0.003, release: 0.75 },
    { start: 0.03, duration: 0.9, frequency: 1174.66, gain: 0.12, harmonic: 0.2, attack: 0.003, release: 0.7 },
  ]),
  "beep.wav": synth(0.35, [
    { start: 0, duration: 0.22, frequency: 1000, gain: 0.28, attack: 0.005, release: 0.06 },
  ]),
  "retro.wav": synth(0.75, [
    { start: 0, duration: 0.16, frequency: 440, gain: 0.18, wave: "square", release: 0.04 },
    { start: 0.18, duration: 0.16, frequency: 660, gain: 0.18, wave: "square", release: 0.04 },
    { start: 0.36, duration: 0.22, frequency: 330, gain: 0.18, wave: "square", release: 0.05 },
  ]),
  "alarm.wav": synth(1.25, [
    { start: 0, duration: 0.22, frequency: 740, gain: 0.22, wave: "square", release: 0.05 },
    { start: 0.3, duration: 0.22, frequency: 554, gain: 0.22, wave: "square", release: 0.05 },
    { start: 0.6, duration: 0.22, frequency: 740, gain: 0.22, wave: "square", release: 0.05 },
    { start: 0.9, duration: 0.22, frequency: 554, gain: 0.22, wave: "square", release: 0.05 },
  ]),
};

Object.entries(sounds).forEach(([name, buffer]) => {
  fs.writeFileSync(path.join(outDir, name), buffer);
});

console.log(`Generated ${Object.keys(sounds).length} alert sounds in ${outDir}`);
