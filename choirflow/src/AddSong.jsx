import React, { useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import PianoIcon from "@mui/icons-material/Piano";
import CloseIcon from "@mui/icons-material/Close";
import MiniKeyboard from "./Components/music/MiniKeyboard";

export default function AddSong({ onAdded }) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKb, setShowKb] = useState(false);

  const praiseCategories = [
    "General Praise",
    "Fast Highlife",
    "Slow Highlife",
    "Makossa",
    "Jazz",
    "Afrobeat",
    "Fuji",
    "Juju",
    "Folk",
    "FunK",
    "Apala",
    "Raggae",
    "Non-Nigerian Songs",
    "Contemporary [Modern] Praise",
    "Prayer Songs",
    "Communion Praise",
    "Anointing Praise",
    "Woro [Igbo]",
    "Woro [Yoruba]",
    "Woro [Niger-Delta]",
    "Revival Songs",
    "Soul Winning Songs",
    "Others",
  ];

  const allCategories = [
    "Worship",
    "General Praise",
    "Fast Highlife",
    "Slow Highlife",
    "Makossa",
    "Jazz",
    "Afrobeat",
    "Fuji",
    "Juju",
    "Folk",
    "FunK",
    "Apala",
    "Raggae",
    "Non-Nigerian Songs",
    "Contemporary [Modern] Praise",
    "Prayer Songs",
    "Communion Praise",
    "Anointing Praise",
    "Woro [Igbo]",
    "Woro [Yoruba]",
    "Woro [Niger-Delta]",
    "Revival Songs",
    "Soul Winning Songs",
    "Others",
  ];

  const musicalKeys = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) return alert("Not logged in");

    setLoading(true);

    try {
      await addDoc(collection(db, "users", auth.currentUser.uid, "songs"), {
        title,
        key,
        category,
        tier: praiseCategories.includes(category) ? tier : null,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setKey("");
      setCategory("");
      setTier("");

      onAdded();
    } catch (err) {
      console.error(err);
      alert("Error saving song: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <h1 style={{ marginBottom: 14 }}>Add Song</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Song Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

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
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          >
            <option value="">Select Key</option>
            {musicalKeys.map((k) => (
              <option key={k} value={k}>
                {k} Major
              </option>
            ))}
          </select>

          {key && (
            <div style={{ marginBottom: "1rem" }} className="lc__chip">
              <span className="lc__chipLabel">Selected</span>
              <b className="lc__chipValue">{key} Major</b>
            </div>
          )}
        </section>

        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {praiseCategories.includes(category) && (
          <select
            className="input"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            required
          >
            <option value="">Select Tier</option>
            <option value="1">Tier 1 [Starting Songs]</option>
            <option value="2">Tier 2 [Mid-Level Energy Songs]</option>
            <option value="3">Tier 3 [High-Level Energy Songs]</option>
          </select>
        )}

        <button
          className="btn primary"
          type="submit"
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Saving..." : "Save Song"}
        </button>
      </form>

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
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <MiniKeyboard
              onPick={(note) => {
                setKey(note);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
