import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import LineUpDetails from "./LineUpDetails";

export default function LineUps({ onBack }) {
  const [lineups, setLineups] = useState([]);
  const [viewId, setViewId] = useState(null);

  // Inputs
  const [keySel, setKeySel] = useState("");
  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");

  // Stored lists
  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const keysList = [
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

  /* ---------------- FETCH SAVED LINE-UPS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, "users", auth.currentUser.uid, "lineups");

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setLineups(list);
    });

    return () => unsub();
  }, []);

  /* ---------------- ADD WORSHIP SONG ---------------- */
  const addWorship = () => {
    if (!worshipInput.trim()) return;
    setWorshipList([...worshipList, worshipInput.trim()]);
    setWorshipInput("");
  };

  /* ---------------- ADD PRAISE SONG ---------------- */
  const addPraise = () => {
    if (!praiseInput.trim()) return;
    setPraiseList([...praiseList, praiseInput.trim()]);
    setPraiseInput("");
  };

  /* ---------------- SAVE LINE-UP ---------------- */
  const handleSave = async () => {
    if (!keySel) return alert("Please select a key");
    if (worshipList.length === 0 && praiseList.length === 0)
      return alert("Add at least one song");

    await addDoc(collection(db, "users", auth.currentUser.uid, "lineups"), {
      key: keySel,
      worship: worshipList,
      praise: praiseList,
      createdAt: serverTimestamp(),
    });

    // Reset
    setKeySel("");
    setWorshipList([]);
    setPraiseList([]);
    alert("Line-up saved!");
  };

  /* ---------------- SHOW DETAILS PAGE ---------------- */
  if (viewId) {
    return <LineUpDetails id={viewId} onBack={() => setViewId(null)} />;
  }

  /* ---------------- MAIN PAGE ---------------- */
  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <button className="btn small" onClick={onBack}>
        ⬅ Back
      </button>

      <h1 style={{ marginTop: 10 }}>Line-Ups</h1>

      {/* Select Key */}
      <select
        className="input"
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

      {/* Worship Section */}
      <h3 style={{ marginTop: 18 }}>Worship Songs</h3>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          className="input"
          placeholder="Add worship song..."
          value={worshipInput}
          onChange={(e) => setWorshipInput(e.target.value)}
        />
        <button className="btn primary" onClick={addWorship}>
          +
        </button>
      </div>

      {/* Worship List */}
      {worshipList.length > 0 &&
        worshipList.map((w, i) => (
          <div
            key={i}
            className="song-item"
            style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}
          >
            <b>{i + 1}.</b> {w}
          </div>
        ))}

      {/* Praise Section */}
      <h3 style={{ marginTop: 18 }}>Praise Songs</h3>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          className="input"
          placeholder="Add praise song..."
          value={praiseInput}
          onChange={(e) => setPraiseInput(e.target.value)}
        />
        <button className="btn primary" onClick={addPraise}>
          +
        </button>
      </div>

      {/* Praise List */}
      {praiseList.length > 0 &&
        praiseList.map((p, i) => (
          <div
            key={i}
            className="song-item"
            style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}
          >
            <b>{i + 1}.</b> {p}
          </div>
        ))}

      <button
        className="btn primary"
        style={{ marginTop: 20 }}
        onClick={handleSave}
      >
        Save Line-Up
      </button>

      {/* Saved Line-Ups */}
      <h2 style={{ marginTop: 25 }}>Saved Line-Ups</h2>

      {lineups.length === 0 && <p className="muted">No line-ups saved yet.</p>}

      {lineups.map((lu) => (
        <div
          key={lu.id}
          className="song-item"
          style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}
          onClick={() => setViewId(lu.id)}
        >
          <h3 style={{ fontWeight: 600 }}>Key: {lu.key}</h3>
          <p className="muted">
            {lu.worship.length} Worship • {lu.praise.length} Praise
          </p>
        </div>
      ))}
    </div>
  );
}
