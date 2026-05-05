const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'audio');

function note(name) {
  const notes = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392,
    A4: 440,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880,
    C6: 1046.5
  };
  return notes[name];
}

function synthTone(frequency, duration, volume, type) {
  const samples = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(samples);
  const attack = Math.floor(samples * 0.08);
  const release = Math.floor(samples * 0.28);

  for (let i = 0; i < samples; i += 1) {
    const t = i / SAMPLE_RATE;
    const phase = (t * frequency) % 1;
    let wave = Math.sin(Math.PI * 2 * phase);
    if (type === 'triangle') {
      wave = 1 - 4 * Math.abs(Math.round(phase - 0.25) - (phase - 0.25));
    } else if (type === 'square') {
      wave = phase < 0.5 ? 1 : -1;
    }

    let envelope = 1;
    if (i < attack) {
      envelope = i / Math.max(1, attack);
    } else if (i > samples - release) {
      envelope = (samples - i) / Math.max(1, release);
    }
    out[i] = wave * volume * envelope;
  }
  return out;
}

function silence(duration) {
  return new Float32Array(Math.floor(duration * SAMPLE_RATE));
}

function mix(buffers) {
  const length = buffers.reduce((max, item) => Math.max(max, item.offset + item.data.length), 0);
  const out = new Float32Array(length);

  buffers.forEach((item) => {
    for (let i = 0; i < item.data.length; i += 1) {
      out[item.offset + i] += item.data[i];
    }
  });

  for (let i = 0; i < out.length; i += 1) {
    out[i] = Math.max(-0.95, Math.min(0.95, out[i]));
  }
  return out;
}

function sequence(notes, noteDuration, volume, type, gap) {
  const buffers = [];
  let offset = 0;
  notes.forEach((item) => {
    if (item === '-') {
      offset += Math.floor((noteDuration + gap) * SAMPLE_RATE);
      return;
    }
    buffers.push({ offset, data: synthTone(note(item), noteDuration, volume, type) });
    offset += Math.floor((noteDuration + gap) * SAMPLE_RATE);
  });
  return mix(buffers);
}

function concat(buffers) {
  const length = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const out = new Float32Array(length);
  let offset = 0;
  buffers.forEach((buffer) => {
    out.set(buffer, offset);
    offset += buffer.length;
  });
  return out;
}

function writeWav(filename, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
}

function buildBgm() {
  const melody = sequence(['C5', 'E5', 'G5', 'E5', 'D5', 'F5', 'A5', 'F5', 'E5', 'G5', 'C6', 'G5', 'A5', 'G5', 'E5', 'D5'], 0.18, 0.16, 'triangle', 0.04);
  const bass = sequence(['C4', '-', 'G4', '-', 'A4', '-', 'F4', '-', 'C4', '-', 'G4', '-', 'F4', '-', 'G4', '-'], 0.32, 0.08, 'sine', 0.12);
  const loop = mix([
    { offset: 0, data: melody },
    { offset: 0, data: bass }
  ]);
  return concat([loop, loop, loop]);
}

function buildHit() {
  return sequence(['E5', 'G5'], 0.09, 0.42, 'triangle', 0.015);
}

function buildComplete() {
  return sequence(['C5', 'E5', 'G5', 'C6'], 0.12, 0.38, 'triangle', 0.02);
}

function buildRestart() {
  return sequence(['G4', 'E4'], 0.08, 0.22, 'sine', 0.01);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav('bgm-cheerful.wav', buildBgm());
writeWav('hit-correct.wav', buildHit());
writeWav('level-complete.wav', buildComplete());
writeWav('restart-soft.wav', buildRestart());

console.log('Generated original placeholder audio in assets/audio/.');
