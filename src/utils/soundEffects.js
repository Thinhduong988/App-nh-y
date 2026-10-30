// HỆ THỐNG ÂM THANH VŨ KHÍ FREE FIRE & HIỆU ỨNG HEADSHOT (WEB & NATIVE)
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Web Audio Context Singleton
let audioCtx = null;
const getAudioContext = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }
  }
  return null;
};

// --- NATIVE WAV GENERATOR (Base64 Data URI) ---
// Tạo tệp âm thanh WAV trực tiếp trong RAM không phụ thuộc mạng
function generateWavUri(sampleRate, durationSec, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit mono
  const fileSize = 36 + dataSize;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF header
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // fmt subchunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // Subchunk1Size (16 for PCM)
  buffer[20] = 1; buffer[21] = 0; // AudioFormat (1 for PCM)
  buffer[22] = 1; buffer[23] = 0; // NumChannels (1 mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  const byteRate = sampleRate * 2;
  buffer[28] = byteRate & 0xff;
  buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff;
  buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = 2; buffer[33] = 0; // BlockAlign (2)
  buffer[34] = 16; buffer[35] = 0; // BitsPerSample (16)

  // data subchunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
  buffer[40] = dataSize & 0xff;
  buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff;
  buffer[43] = (dataSize >> 24) & 0xff;

  // Samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let val = sampleGenerator(t, i, numSamples);
    val = Math.max(-1, Math.min(1, val));
    const int16 = val < 0 ? val * 0x8000 : val * 0x7fff;
    const offset = 44 + i * 2;
    buffer[offset] = int16 & 0xff;
    buffer[offset + 1] = (int16 >> 8) & 0xff;
  }

  // Base64 encode
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + (typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(buffer).toString('base64'));
}

// Pre-generated Sound Data URIs for Native & Offline Playback
const SOUND_URIS = {
  shotgun: generateWavUri(11025, 0.45, (t) => {
    // Heavy explosive boom + metallic crack
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 22);
    const sub = Math.sin(2 * Math.PI * 85 * Math.exp(-t * 15) * t) * Math.exp(-t * 8);
    const mid = Math.sin(2 * Math.PI * 240 * t) * Math.exp(-t * 28);
    return noise * 0.7 + sub * 0.6 + mid * 0.3;
  }),

  smg: generateWavUri(11025, 0.28, (t) => {
    // Rapid metallic chatter (MP40)
    const tCycle = t % 0.08;
    const burst = (Math.random() * 2 - 1) * Math.exp(-tCycle * 45);
    const snap = Math.sin(2 * Math.PI * 450 * Math.exp(-tCycle * 25) * tCycle);
    return burst * 0.6 + snap * 0.4;
  }),

  rifle: generateWavUri(11025, 0.35, (t) => {
    // AK47 heavy punchy shot
    const punch = Math.sin(2 * Math.PI * 130 * Math.exp(-t * 12) * t) * Math.exp(-t * 10);
    const crack = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    return punch * 0.65 + crack * 0.5;
  }),

  sniper: generateWavUri(11025, 0.65, (t) => {
    // AWM Long reverberant cannon blast
    const blast = (Math.random() * 2 - 1) * Math.exp(-t * 8);
    const deepSub = Math.sin(2 * Math.PI * 65 * Math.exp(-t * 6) * t) * Math.exp(-t * 4);
    const ringing = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 14) * 0.2;
    return blast * 0.5 + deepSub * 0.7 + ringing;
  }),

  headshot: generateWavUri(11025, 0.4, (t) => {
    // Crispy high-pitched crit ding! (Free Fire Red Dame)
    const bell1 = Math.sin(2 * Math.PI * 1580 * t) * Math.exp(-t * 9);
    const bell2 = Math.sin(2 * Math.PI * 3160 * t) * Math.exp(-t * 18);
    return (bell1 * 0.7 + bell2 * 0.4);
  }),
};

// Play helper
async function playNativeSound(dataUri) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: dataUri },
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (err) {
    // fallback gracefully
  }
}

// WEB AUDIO SYNTHESIZERS (0ms latency on web)
function playWebShotgun(ctx) {
  const t = ctx.currentTime;
  // Noise buffer for blast
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1600, t);
  filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.2, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);

  // Sub bass kick
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  oscGain.gain.setValueAtTime(0.9, t);
  oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.35);
}

function playWebSMG(ctx) {
  const t = ctx.currentTime;
  // 3 quick burst clicks for MP40
  for (let b = 0; b < 2; b++) {
    const bt = t + b * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, bt);
    osc.frequency.exponentialRampToValueAtTime(80, bt + 0.05);
    gain.gain.setValueAtTime(0.7, bt);
    gain.gain.exponentialRampToValueAtTime(0.01, bt + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(bt);
    osc.stop(bt + 0.06);
  }
}

function playWebRifle(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(260, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);
  gain.gain.setValueAtTime(0.8, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

function playWebSniper(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.55);
  gain.gain.setValueAtTime(1.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.6);
}

function playWebHeadshot(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
  gain.gain.setValueAtTime(0.8, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.38);
}

// MAIN EXPORTED SOUND API
export const SOUNDS = {
  playWeaponShot: (weaponId) => {
    const ctx = getAudioContext();
    if (ctx) {
      if (weaponId === 'shotgun') playWebShotgun(ctx);
      else if (weaponId === 'smg') playWebSMG(ctx);
      else if (weaponId === 'sniper') playWebSniper(ctx);
      else playWebRifle(ctx);
    } else {
      const uri =
        weaponId === 'shotgun'
          ? SOUND_URIS.shotgun
          : weaponId === 'smg'
          ? SOUND_URIS.smg
          : weaponId === 'sniper'
          ? SOUND_URIS.sniper
          : SOUND_URIS.rifle;
      playNativeSound(uri);
    }
  },

  playHeadshotCrit: () => {
    const ctx = getAudioContext();
    if (ctx) {
      playWebHeadshot(ctx);
    } else {
      playNativeSound(SOUND_URIS.headshot);
    }
  },
};
