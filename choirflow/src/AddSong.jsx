import React, { useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddSong({ onAdded }) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [loading, setLoading] = useState(false);

  const praiseCategories = [
    "General Praise",
    "Fast Highlife",
    "Slow Highlife",
    "Makossa",
    "Gospel Jazz",
    "Afrobeat",
    "Fuji",
    "Juju",
    "Folk",
    "FuNK",
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
    "Gospel Jazz",
    "Afrobeat",
    "Fuji",
    "Juju",
    "Folk",
    "FuNK",
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

      onAdded(); // Switch back to Home after save
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
        {/* Song Title */}
        <input
          type="text"
          className="input"
          placeholder="Song Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Key */}
        <select
          className="input"
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

        {/* Category */}
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

        {/* Tier (Only visible for Praise categories) */}
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
    </div>
  );
}
