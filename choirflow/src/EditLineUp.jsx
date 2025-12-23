import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { db, auth } from "./firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditLineUp({ id, onBack }) {
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [keySel, setKeySel] = useState("");

  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");

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

  /* ---------------- FETCH EXISTING LINE-UP ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const load = async () => {
      const ref = doc(db, "users", auth.currentUser.uid, "lineups", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setTitle(data.title || "");
        setKeySel(data.key || "");

        // match LineUpDetails structure (worship & praise)
        setWorshipList(data.worship || []);
        setPraiseList(data.praise || []);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  /* ---------------- ADD SONGS ---------------- */
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

  /* ---------------- REMOVE SONG ---------------- */
  const removeWorship = (idx) => {
    setWorshipList(worshipList.filter((_, i) => i !== idx));
  };

  const removePraise = (idx) => {
    setPraiseList(praiseList.filter((_, i) => i !== idx));
  };

  /* ---------------- SAVE CHANGES ---------------- */
  const handleUpdate = async () => {
    if (!title.trim()) return alert("Title cannot be empty");
    if (!keySel) return alert("Please select a key");

    await updateDoc(doc(db, "users", auth.currentUser.uid, "lineups", id), {
      title,
      key: keySel,
      worship: worshipList,
      praise: praiseList,
    });

    alert("Line-up updated successfully!");
    onBack();
  };

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
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

      <h1>Edit Line-Up</h1>

      {/* Title */}
      <input
        className="input"
        placeholder="Line-Up Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: 12 }}
      />

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

      <div style={{ display: "flex", gap: 4 }}>
        <input
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
          style={{
            padding: "6px 0",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <b>{i + 1}.</b> {w}
          </span>
          <button className="btn small danger" onClick={() => removeWorship(i)}>
            Remove
          </button>
        </div>
      ))}

      {/* Praise Section */}
      <h3 style={{ marginTop: 18 }}>Praise Songs</h3>

      <div style={{ display: "flex", gap: 4 }}>
        <input
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
          style={{
            padding: "6px 0",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <b>{i + 1}.</b> {p}
          </span>
          <button className="btn small danger" onClick={() => removePraise(i)}>
            Remove
          </button>
        </div>
      ))}

      <button
        className="btn primary"
        style={{ marginTop: 20 }}
        onClick={handleUpdate}
      >
        Save Changes
      </button>
    </div>
  );
}
