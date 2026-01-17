import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { db, auth } from "./firebase/firebase";
import DeleteIcon from "@mui/icons-material/Delete";
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

  /* ---------------- FETCH LINE-UP ---------------- */
  useEffect(() => {
    if (!auth.currentUser || !id) return;

    const load = async () => {
      const ref = doc(db, "users", auth.currentUser.uid, "lineups", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setKeySel(data.key || "");
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

  /* ---------------- EDIT SONG TEXT ---------------- */
  const updateWorshipText = (idx, value) => {
    const updated = [...worshipList];
    updated[idx] = value;
    setWorshipList(updated);
  };

  const updatePraiseText = (idx, value) => {
    const updated = [...praiseList];
    updated[idx] = value;
    setPraiseList(updated);
  };

  /* ---------------- REMOVE SONG (WITH CONFIRM) ---------------- */
  const removeWorship = (idx) => {
    if (!window.confirm("Remove this worship song?")) return;
    setWorshipList(worshipList.filter((_, i) => i !== idx));
  };

  const removePraise = (idx) => {
    if (!window.confirm("Remove this praise song?")) return;
    setPraiseList(praiseList.filter((_, i) => i !== idx));
  };

  /* ---------------- SAVE ---------------- */
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

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <button
        className="btn small"
        onClick={onBack}
        style={{ marginBottom: 10, display: "flex", gap: 4 }}
      >
        <ArrowBackIcon />
      </button>

      <h1>Edit Line-Up</h1>

      <input
        className="input"
        placeholder="Line-Up Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <select
        className="input"
        value={keySel}
        onChange={(e) => setKeySel(e.target.value)}
        style={{ marginTop: 10 }}
      >
        <option value="">Select Key</option>
        {keysList.map((k) => (
          <option key={k} value={k}>
            {k} Major
          </option>
        ))}
      </select>

      {/* WORSHIP */}
      <h3 style={{ marginTop: 20 }}>Worship Songs</h3>

      <div style={{ display: "flex", gap: 6 }}>
        <input
          className="input"
          placeholder="Add worship song..."
          value={worshipInput}
          onChange={(e) => setWorshipInput(e.target.value)}
        />
        <AddCircleIcon style={{ cursor: "pointer" }} onClick={addWorship} />
      </div>

      {worshipList.map((w, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input
            className="input"
            value={w}
            onChange={(e) => updateWorshipText(i, e.target.value)}
          />
          <button className="btn small danger" onClick={() => removeWorship(i)}>
            Delete
          </button>
        </div>
      ))}

      {/* PRAISE */}
      <h3 style={{ marginTop: 20 }}>Praise Songs</h3>

      <div style={{ display: "flex", gap: 6 }}>
        <input
          className="input"
          placeholder="Add praise song..."
          value={praiseInput}
          onChange={(e) => setPraiseInput(e.target.value)}
        />
        <AddCircleIcon style={{ cursor: "pointer" }} onClick={addPraise} />
      </div>

      {praiseList.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input
            className="input"
            value={p}
            onChange={(e) => updatePraiseText(i, e.target.value)}
          />
          <button className="btn small danger" onClick={() => removePraise(i)}>
            <DeleteIcon />
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
