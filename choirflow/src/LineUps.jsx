import React, { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { db, auth } from "./firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function LineUps({ onBack, onViewList }) {
  const [keySel, setKeySel] = useState("");
  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");

  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const [toastMsg, setToastMsg] = useState("");
  const [showActions, setShowActions] = useState(false);

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

  /* ---------------- SMALL TOAST ---------------- */
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const addWorship = () => {
    if (!worshipInput.trim()) return;
    setWorshipList([...worshipList, worshipInput.trim()]);
    setWorshipInput("");
  };

  const addPraise = () => {
    if (!praiseInput.trim()) return;
    setPraiseList([...praiseList, praiseInput.trim()]);
    setPraiseInput("");
  };

  const handleSave = async () => {
    if (!keySel) return showToast("Select a key");
    if (worshipList.length === 0 && praiseList.length === 0)
      return showToast("Add at least one song");

    await addDoc(collection(db, "users", auth.currentUser.uid, "lineups"), {
      key: keySel,
      worship: worshipList,
      praise: praiseList,
      createdAt: serverTimestamp(),
    });

    setKeySel("");
    setWorshipList([]);
    setPraiseList([]);

    showToast("Line-Up Saved");
    setShowActions(true);
  };

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      {/* Toast Message */}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      <button
        className="btn small"
        onClick={onBack}
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <ArrowBackIcon /> <span>Back</span>
      </button>

      <h1 style={{ marginTop: 10 }}>Create Line-Up</h1>

      {/* Key selection */}
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

      {/* Worship */}
      <h3 style={{ marginTop: 18 }}>Worship Songs</h3>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <input
          type="text"
          className="input"
          placeholder="Add worship song..."
          value={worshipInput}
          onChange={(e) => setWorshipInput(e.target.value)}
        />
        <AddCircleIcon style={{ cursor: "pointer" }} onClick={addWorship} />
      </div>

      {worshipList.map((w, i) => (
        <div
          key={i}
          className="song-item"
          style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}
        >
          <b>{i + 1}.</b> {w}
        </div>
      ))}

      {/* Praise */}
      <h3 style={{ marginTop: 18 }}>Praise Songs</h3>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <input
          type="text"
          className="input"
          placeholder="Add praise song..."
          value={praiseInput}
          onChange={(e) => setPraiseInput(e.target.value)}
        />
        <AddCircleIcon style={{ cursor: "pointer" }} onClick={addPraise} />
      </div>

      {praiseList.map((p, i) => (
        <div
          key={i}
          className="song-item"
          style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}
        >
          <b>{i + 1}.</b> {p}
        </div>
      ))}

      {/* Save Button */}
      <button
        className="btn primary"
        style={{ marginTop: 20 }}
        onClick={handleSave}
      >
        Save Line-Up
      </button>

      {/* Extra Buttons after saving */}
      {showActions && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn ghost"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={() => setShowActions(false)}
          >
            Create Another
          </button>

          <button
            className="btn primary"
            style={{ width: "100%" }}
            onClick={onViewList}
          >
            View Saved Line-Ups
          </button>
        </div>
      )}
    </div>
  );
}
