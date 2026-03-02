let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function noteToFreq(note) {
  const map = {
    C: -9,
    "C#": -8,
    D: -7,
    "D#": -6,
    E: -5,
    F: -4,
    "F#": -3,
    G: -2,
    "G#": -1,
    A: 0,
    "A#": 1,
    B: 2,
  };

  const semitone = map[note];
  const a4 = 440;
  return a4 * Math.pow(2, semitone / 12);
}

export async function playNote(note, durationMs = 500) {
  const ctx = getCtx();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const freq = noteToFreq(note);
  const now = ctx.currentTime;
  const duration = Math.max(200, durationMs) / 1000;
  const mix = ctx.createGain();
  mix.gain.value = 0.9;

  // Subtle saturation (waveshaper)
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeSoftClipCurve(0.8);
  shaper.oversample = "4x";

  // Gentle lowpass to remove harshness
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 5200;
  toneFilter.Q.value = 0.6;

  // Simple limiter-ish: keep volume safe
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.knee.value = 18;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.01;
  limiter.release.value = 0.12;

  mix.connect(shaper);
  shaper.connect(toneFilter);
  toneFilter.connect(limiter);
  limiter.connect(ctx.destination);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, now);

  const attack = 0.008;
  const decay = 0.18;
  const sustainLevel = 0.16; // keep it present
  const release = 0.7; // tail

  // Peak loudness (keep safe for phones)
  const peak = 0.42;

  // Attack to peak
  amp.gain.exponentialRampToValueAtTime(peak, now + attack);
  // Decay down to sustain
  amp.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, sustainLevel),
    now + attack + decay,
  );
  // Hold-ish until near end, then release
  const releaseStart = now + Math.max(attack + decay + 0.05, duration - 0.25);
  amp.gain.setValueAtTime(Math.max(0.0001, sustainLevel), releaseStart);
  amp.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

  // Connect amp into master mix
  amp.connect(mix);

  // Subtle vibrato (very light so it doesn't sound like synth)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 5.2; // Hz
  lfoGain.gain.value = 1.2; // Hz amount (tiny)
  lfo.connect(lfoGain);

  // Layered oscillators for richer timbre (fundamental + harmonics)
  const o1 = ctx.createOscillator(); // fundamental
  const o2 = ctx.createOscillator(); // +1 octave, softer
  const o3 = ctx.createOscillator(); // + perfect fifth-ish, very soft

  o1.type = "triangle";
  o2.type = "sine";
  o3.type = "sine";

  o1.frequency.value = freq;
  o2.frequency.value = freq * 2;
  o3.frequency.value = freq * 1.498;

  lfoGain.connect(o1.frequency);
  lfoGain.connect(o2.frequency);
  lfoGain.connect(o3.frequency);

  const g1 = ctx.createGain();
  const g2 = ctx.createGain();
  const g3 = ctx.createGain();

  g1.gain.value = 0.9;
  g2.gain.value = 0.22;
  g3.gain.value = 0.12;

  o1.connect(g1);
  o2.connect(g2);
  o3.connect(g3);

  g1.connect(amp);
  g2.connect(amp);
  g3.connect(amp);

  const stopAt = releaseStart + release + 0.05;

  lfo.start(now);
  o1.start(now);
  o2.start(now);
  o3.start(now);

  lfo.stop(stopAt);
  o1.stop(stopAt);
  o2.stop(stopAt);
  o3.stop(stopAt);

  const cleanup = () => {
    try {
      lfo.disconnect();
      lfoGain.disconnect();
      o1.disconnect();
      o2.disconnect();
      o3.disconnect();
      g1.disconnect();
      g2.disconnect();
      g3.disconnect();
      amp.disconnect();
      mix.disconnect();
      shaper.disconnect();
      toneFilter.disconnect();
      limiter.disconnect();
    } catch {
      // ignore
    }
  };

  // Schedule cleanup
  setTimeout(cleanup, Math.ceil((stopAt - now) * 1000) + 50);
}

function makeSoftClipCurve(amount = 0.7) {
  // amount: 0..1
  const k = 1 + amount * 50;
  const n = 44100;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
