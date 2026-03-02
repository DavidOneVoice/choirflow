// LineUps.jsx
import React, { useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PianoIcon from "@mui/icons-material/Piano";
import CloseIcon from "@mui/icons-material/Close";

import { db, auth } from "./firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import MiniKeyboard from "./Components/music/MiniKeyboard";
import "./styles/pages/lineup-create.css";

export default function LineUps({ onBack, onViewList }) {
  const [keySel, setKeySel] = useState("");
  const [title, setTitle] = useState("");

  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");
  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const [toastMsg, setToastMsg] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showKb, setShowKb] = useState(false);

  const keysList = useMemo(
    () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    [],
  );

  const showToast = (msg) => {
    setToastMsg(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastMsg(""), 2200);
  };

  const addWorship = () => {
    const v = worshipInput.trim();
    if (!v) return;
    setWorshipList((prev) => [...prev, v]);
    setWorshipInput("");
  };

  const addPraise = () => {
    const v = praiseInput.trim();
    if (!v) return;
    setPraiseList((prev) => [...prev, v]);
    setPraiseInput("");
  };

  const removeWorship = (idx) => {
    setWorshipList((prev) => prev.filter((_, i) => i !== idx));
  };

  const removePraise = (idx) => {
    setPraiseList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!keySel) return showToast("Select a key");
    if (worshipList.length === 0 && praiseList.length === 0)
      return showToast("Add at least one song");

    await addDoc(collection(db, "users", auth.currentUser.uid, "lineups"), {
      title: title.trim() || "",
      key: keySel,
      worship: worshipList,
      praise: praiseList,
      createdAt: serverTimestamp(),
    });

    setKeySel("");
    setTitle("");
    setWorshipList([]);
    setPraiseList([]);
    setWorshipInput("");
    setPraiseInput("");

    showToast("Line-Up Saved");
    setShowActions(true);
  };

  return (
    <div className="card lc">
      {/* Toast */}
      {toastMsg && <div className="lc__toast">{toastMsg}</div>}

      {/* Top Back */}
      <button className="btn small lc__back" onClick={onBack} aria-label="Back">
        <ArrowBackIcon />
      </button>

      {/* Header */}
      <div className="lc__header">
        <h1 className="lc__title">Create Line-Up</h1>
        <p className="lc__subtitle muted">Add songs, pick a key, then save.</p>
      </div>

      {/* Title */}
      <section className="lc__section">
        <label className="lc__label">Title (optional)</label>
        <input
          className="input lc__input"
          placeholder="e.g. Sunday Service - March 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </section>

      {/* Key + Keyboard */}
      <section className="lc__section">
        <div className="lc__row">
          <span className="lc__label">Select Key</span>

          <button
            type="button"
            className="lc__kbdBtn"
            onClick={() => setShowKb(true)}
          >
            <PianoIcon style={{ fontSize: 18 }} />
            <span>Keyboard</span>
          </button>
        </div>

        <select
          className="input lc__select"
          value={keySel}
          onChange={(e) => setKeySel(e.target.value)}
        >
          <option value="">Select Key</option>
          {keysList.map((k) => (
            <option key={k} value={k}>
              {k} Major
            </option>
          ))}
        </select>

        {keySel && (
          <div className="lc__chip">
            <span className="lc__chipLabel">Selected</span>
            <b className="lc__chipValue">{keySel} Major</b>
          </div>
        )}
      </section>

      {/* Worship */}
      <section className="lc__section">
        <div className="lc__row">
          <h3 className="lc__h3">Worship Songs</h3>
          <span className="lc__count muted">{worshipList.length}</span>
        </div>

        <div className="lc__adder">
          <input
            type="text"
            className="input lc__input"
            placeholder="Add worship song..."
            value={worshipInput}
            onChange={(e) => setWorshipInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWorship()}
          />
          <button
            type="button"
            className="lc__iconBtn"
            onClick={addWorship}
            aria-label="Add worship song"
          >
            <AddCircleIcon />
          </button>
        </div>

        <div className="lc__list">
          {worshipList.map((w, i) => (
            <div key={`${w}-${i}`} className="lc__item">
              <div className="lc__itemText">
                <span className="lc__index">{i + 1}.</span>
                <b className="lc__song">{w}</b>
              </div>

              <button
                type="button"
                className="lc__remove"
                onClick={() => removeWorship(i)}
                aria-label="Remove"
                title="Remove"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Praise */}
      <section className="lc__section">
        <div className="lc__row">
          <h3 className="lc__h3">Praise Songs</h3>
          <span className="lc__count muted">{praiseList.length}</span>
        </div>

        <div className="lc__adder">
          <input
            type="text"
            className="input lc__input"
            placeholder="Add praise song..."
            value={praiseInput}
            onChange={(e) => setPraiseInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPraise()}
          />
          <button
            type="button"
            className="lc__iconBtn"
            onClick={addPraise}
            aria-label="Add praise song"
          >
            <AddCircleIcon />
          </button>
        </div>

        <div className="lc__list">
          {praiseList.map((p, i) => (
            <div key={`${p}-${i}`} className="lc__item">
              <div className="lc__itemText">
                <span className="lc__index">{i + 1}.</span>
                <b className="lc__song">{p}</b>
              </div>

              <button
                type="button"
                className="lc__remove"
                onClick={() => removePraise(i)}
                aria-label="Remove"
                title="Remove"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <button className="btn primary lc__save" onClick={handleSave}>
        Save Line-Up
      </button>

      {/* After Save actions */}
      {showActions && (
        <div className="lc__actions">
          <button className="btn ghost" onClick={() => setShowActions(false)}>
            Create Another
          </button>

          <button className="btn primary" onClick={onViewList}>
            View Saved Line-Ups
          </button>
        </div>
      )}

      {/* Keyboard Modal */}
      {showKb && (
        <div
          className="lc__modalOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowKb(false)}
        >
          <div className="lc__modal" onClick={(e) => e.stopPropagation()}>
            <div className="lc__modalHead">
              <div>
                <h3 className="lc__modalTitle">Keyboard</h3>
                <p className="lc__modalSub muted">
                  Tap a note to hear it and set the key.
                </p>
              </div>

              <button
                className="lc__modalClose"
                onClick={() => setShowKb(false)}
                aria-label="Close keyboard"
              >
                <CloseIcon />
              </button>
            </div>

            <MiniKeyboard
              onPick={(note) => {
                setKeySel(note);
                setShowKb(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
