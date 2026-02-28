import React, { useRef } from "react";

const KEY_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

const semitoneToFrequency = (semitone, octave = 4) => {
  const midi = 12 * (octave + 1) + semitone;
  return 440 * 2 ** ((midi - 69) / 12);
};

const playNote = (ctx, frequency, startAt, duration, volume = 0.14) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
};

export default function KeyPreviewButton({ selectedKey }) {
  const audioContextRef = useRef(null);

  const handlePreview = () => {
    if (!selectedKey) {
      alert("Select a key first to preview the sound.");
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      alert("Your browser does not support audio preview.");
      return;
    }

    const ctx =
      audioContextRef.current ||
      new AudioContextClass({ latencyHint: "interactive" });
    audioContextRef.current = ctx;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const rootSemitone = KEY_TO_SEMITONE[selectedKey];
    const root = semitoneToFrequency(rootSemitone);
    const majorThird = semitoneToFrequency((rootSemitone + 4) % 12, 4);
    const perfectFifth = semitoneToFrequency((rootSemitone + 7) % 12, 4);

    const start = ctx.currentTime + 0.01;
    playNote(ctx, root, start, 0.65);
    playNote(ctx, majorThird, start + 0.08, 0.6);
    playNote(ctx, perfectFifth, start + 0.16, 0.55);
  };

  return (
    <button className="btn small" type="button" onClick={handlePreview}>
      🎹 Hear Key
    </button>
  );
}

