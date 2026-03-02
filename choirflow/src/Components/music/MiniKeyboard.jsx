import React, { useMemo, useState } from "react";
import { playNote } from "../../utils/tone";
import "./MiniKeyboard.css";
// White keys in an octave
const WHITE = ["C", "D", "E", "F", "G", "A", "B"];

// Black keys positions relative to white keys
// (E-F and B-C have no black key)
const BLACK = [
  { note: "C#", leftPct: 10.5 },
  { note: "D#", leftPct: 24.5 },
  { note: "F#", leftPct: 52.5 },
  { note: "G#", leftPct: 66.5 },
  { note: "A#", leftPct: 80.5 },
];

export default function MiniKeyboard({ onPick }) {
  const [active, setActive] = useState("");

  const handlePress = async (note) => {
    setActive(note);
    try {
      await playNote(note);
    } finally {
      // quick “press” effect
      setTimeout(() => setActive(""), 120);
    }
    if (onPick) onPick(note);
  };

  const keyLabel = useMemo(() => {
    return (n) => n; // keep labels simple (C, C#, etc.)
  }, []);

  return (
    <div className="cf-kbd">
      <div className="cf-kbd__top">
        <div className="cf-kbd__title">Mini Keyboard</div>
        <div className="cf-kbd__hint">Tap any key to hear & select it</div>
      </div>

      <div
        className="cf-kbd__piano"
        role="group"
        aria-label="Mini Piano Keyboard"
      >
        {/* Black keys overlay */}
        <div className="cf-kbd__blacks" aria-hidden="true">
          {BLACK.map((b) => (
            <button
              key={b.note}
              type="button"
              className={`cf-kbd__black ${
                active === b.note ? "is-active" : ""
              }`}
              style={{ left: `${b.leftPct}%` }}
              onClick={() => handlePress(b.note)}
              aria-label={b.note}
            >
              <span className="cf-kbd__blackLabel">{keyLabel(b.note)}</span>
            </button>
          ))}
        </div>

        {/* White keys */}
        <div className="cf-kbd__whites">
          {WHITE.map((w) => (
            <button
              key={w}
              type="button"
              className={`cf-kbd__white ${active === w ? "is-active" : ""}`}
              onClick={() => handlePress(w)}
              aria-label={w}
            >
              <span className="cf-kbd__whiteLabel">{keyLabel(w)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cf-kbd__footer">
        <div className="cf-kbd__badge">C → B (1 octave)</div>
      </div>
    </div>
  );
}
