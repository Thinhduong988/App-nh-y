// BỘ ÂM THANH CHUẨN FREE FIRE 100% ESPORTS (MP40, M1887, AK47, AWM & HEADSHOT CRIT)
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

let audioCtx = null;
const getAudioContext = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
  }
  return null;
};

// --- NATIVE 16-BIT PCM WAV GENERATOR (Chạy 100% Offline trên Android / iOS) ---
function generateWavUri(sampleRate, durationSec, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const fileSize = 36 + dataSize;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF header
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46;
  buffer[4] = fileSize & 0xff; buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff; buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45;

  // fmt subchunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0;
  buffer[20] = 1; buffer[21] = 0;
  buffer[22] = 1; buffer[23] = 0;
  buffer[24] = sampleRate & 0xff; buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff; buffer[27] = (sampleRate >> 24) & 0xff;
  const byteRate = sampleRate * 2;
  buffer[28] = byteRate & 0xff; buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff; buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = 2; buffer[33] = 0;
  buffer[34] = 16; buffer[35] = 0;

  // data subchunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61;
  buffer[40] = dataSize & 0xff; buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff; buffer[43] = (dataSize >> 24) & 0xff;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let val = sampleGenerator(t, i, numSamples);
    val = Math.max(-1, Math.min(1, val));
    const int16 = val < 0 ? val * 0x8000 : val * 0x7fff;
    const offset = 44 + i * 2;
    buffer[offset] = int16 & 0xff;
    buffer[offset + 1] = (int16 >> 8) & 0xff;
  }

  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + (typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(buffer).toString('base64'));
}

// 1. MP40: Tiếng sấy liên thanh đanh giòn đặc trưng Free Fire
const WAV_MP40 = generateWavUri(16000, 0.32, (t) => {
  const cycle = t % 0.062;
  const blast = (Math.random() * 2 - 1) * Math.exp(-cycle * 60);
  const snap = Math.sin(2 * Math.PI * 520 * Math.exp(-cycle * 35) * cycle);
  const metal = Math.sin(2 * Math.PI * 1920 * cycle) * Math.exp(-cycle * 80) * 0.45;
  return (blast * 0.55 + snap * 0.35 + metal * 0.25);
});

// 2. Shotgun M1887: Cú nổ kép uy lực + âm cơ khí lên đạn
const WAV_SHOTGUN = generateWavUri(16000, 0.54, (t) => {
  const subKick = Math.sin(2 * Math.PI * 50 * Math.exp(-t * 10) * t) * Math.exp(-t * 6);
  const powderBlast = (Math.random() * 2 - 1) * Math.exp(-t * 16);
  const crack = Math.sin(2 * Math.PI * 320 * Math.exp(-t * 20) * t) * Math.exp(-t * 14);
  const cocking = t > 0.27 ? Math.sin(2 * Math.PI * 960 * (t - 0.27)) * Math.exp(-(t - 0.27) * 45) * 0.4 : 0;
  return subKick * 0.7 + powderBlast * 0.55 + crack * 0.3 + cocking;
});

// 3. Súng trường AK47: Đanh thép, đập nổ chắc nịch
const WAV_RIFLE = generateWavUri(16000, 0.4, (t) => {
  const kick = Math.sin(2 * Math.PI * 115 * Math.exp(-t * 12) * t) * Math.exp(-t * 8);
  const noise = (Math.random() * 2 - 1) * Math.exp(-t * 22);
  const brass = Math.sin(2 * Math.PI * 750 * t) * Math.exp(-t * 25) * 0.35;
  return kick * 0.65 + noise * 0.5 + brass * 0.25;
});

// 4. AWM Sniper: Uy lực xé gió + vang dội tầm xa
const WAV_SNIPER = generateWavUri(16000, 0.7, (t) => {
  const concussive = (Math.random() * 2 - 1) * Math.exp(-t * 5.5);
  const sub = Math.sin(2 * Math.PI * 42 * Math.exp(-t * 4.5) * t) * Math.exp(-t * 3);
  const highEcho = Math.sin(2 * Math.PI * 680 * t) * Math.exp(-t * 9) * 0.3;
  const bolt = t > 0.36 ? Math.sin(2 * Math.PI * 1250 * (t - 0.36)) * Math.exp(-(t - 0.36) * 35) * 0.45 : 0;
  return concussive * 0.55 + sub * 0.75 + highEcho + bolt;
});

// 5. HEADSHOT CRIT DING: Tiếng chuông đỏ chói Free Fire cực giòn!
const WAV_HEADSHOT = generateWavUri(16000, 0.45, (t) => {
  const chime1 = Math.sin(2 * Math.PI * 2150 * t) * Math.exp(-t * 7);
  const chime2 = Math.sin(2 * Math.PI * 4300 * t) * Math.exp(-t * 14) * 0.5;
  const chime3 = Math.sin(2 * Math.PI * 6450 * t) * Math.exp(-t * 22) * 0.25;
  const punch = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 30) * 0.4;
  return chime1 * 0.7 + chime2 + chime3 + punch;
});

// Play native helper with expo-av
async function playNative(uri) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync().catch(() => {});
    });
  } catch (e) {}
}

// WEB AUDIO SYNTHESIZERS VỚI NOISE BURST & FILTER CHUẨN 100% GAME
function playWebSound(type, ctx) {
  const t = ctx.currentTime;

  // Helper tạo tiếng nổ thuốc súng (Gunpowder Noise Burst)
  const triggerNoiseBurst = (startTime, duration, filterFreq, gainVal) => {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(100, startTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  };

  // 1. TIẾNG ĐỎ ĐẦU HEADSHOT FREE FIRE ("KENG!" GIÒN TAN)
  if (type === 'headshot') {
    // Chime 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2150, t);
    gain1.gain.setValueAtTime(1.0, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.45);

    // Chime 2 (Harmonic octave)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4300, t);
    gain2.gain.setValueAtTime(0.6, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.3);

    // Punch helmet impact
    const punch = ctx.createOscillator();
    const pGain = ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(180, t);
    punch.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    pGain.gain.setValueAtTime(0.7, t);
    pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    punch.connect(pGain);
    pGain.connect(ctx.destination);
    punch.start(t);
    punch.stop(t + 0.1);
    return;
  }

  // 2. SHOTGUN M1887 (NỔ KÉP SUB-BASS + NOISE + LÊN ĐẠN)
  if (type === 'shotgun') {
    // Noise blast
    triggerNoiseBurst(t, 0.4, 1800, 1.4);

    // Sub-kick
    const kick = ctx.createOscillator();
    const kGain = ctx.createGain();
    kick.type = 'triangle';
    kick.frequency.setValueAtTime(75, t);
    kick.frequency.exponentialRampToValueAtTime(32, t + 0.35);
    kGain.gain.setValueAtTime(1.5, t);
    kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    kick.connect(kGain);
    kGain.connect(ctx.destination);
    kick.start(t);
    kick.stop(t + 0.4);

    // Lever-action cocking sound at t + 0.26s
    const cock = ctx.createOscillator();
    const cGain = ctx.createGain();
    cock.type = 'sawtooth';
    cock.frequency.setValueAtTime(980, t + 0.26);
    cock.frequency.exponentialRampToValueAtTime(350, t + 0.34);
    cGain.gain.setValueAtTime(0.35, t + 0.26);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    cock.connect(cGain);
    cGain.connect(ctx.destination);
    cock.start(t + 0.26);
    cock.stop(t + 0.36);
    return;
  }

  // 3. MP40 (SẤY LIÊN THANH 3 VIÊN ĐANH TAI)
  if (type === 'smg') {
    for (let i = 0; i < 3; i++) {
      const shotTime = t + i * 0.062;
      triggerNoiseBurst(shotTime, 0.06, 3200, 0.9);

      const snap = ctx.createOscillator();
      const sGain = ctx.createGain();
      snap.type = 'sawtooth';
      snap.frequency.setValueAtTime(540, shotTime);
      snap.frequency.exponentialRampToValueAtTime(90, shotTime + 0.05);
      sGain.gain.setValueAtTime(0.65, shotTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, shotTime + 0.055);
      snap.connect(sGain);
      sGain.connect(ctx.destination);
      snap.start(shotTime);
      snap.stop(shotTime + 0.06);
    }
    return;
  }

  // 4. AK47 (SÚNG TRƯỜNG CHẮC NỊCH)
  if (type === 'rifle') {
    triggerNoiseBurst(t, 0.28, 2600, 1.2);

    const kick = ctx.createOscillator();
    const kGain = ctx.createGain();
    kick.type = 'square';
    kick.frequency.setValueAtTime(140, t);
    kick.frequency.exponentialRampToValueAtTime(50, t + 0.25);
    kGain.gain.setValueAtTime(0.8, t);
    kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    kick.connect(kGain);
    kGain.connect(ctx.destination);
    kick.start(t);
    kick.stop(t + 0.3);
    return;
  }

  // 5. AWM SNIPER (VANG VỌNG XÉ GIÓ)
  if (type === 'sniper') {
    triggerNoiseBurst(t, 0.65, 1600, 1.6);

    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(65, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.55);
    sGain.gain.setValueAtTime(1.4, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(t);
    sub.stop(t + 0.65);
    return;
  }
}

export const SOUNDS = {
  playWeaponShot: (weaponId) => {
    const ctx = getAudioContext();
    if (ctx) {
      playWebSound(weaponId, ctx);
    } else {
      const uri =
        weaponId === 'shotgun'
          ? WAV_SHOTGUN
          : weaponId === 'smg'
          ? WAV_MP40
          : weaponId === 'sniper'
          ? WAV_SNIPER
          : WAV_RIFLE;
      playNative(uri);
    }
  },

  playHeadshotCrit: () => {
    const ctx = getAudioContext();
    if (ctx) {
      playWebSound('headshot', ctx);
    } else {
      playNative(WAV_HEADSHOT);
    }
  },
};
