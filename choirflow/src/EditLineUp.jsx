import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { db, auth } from "./firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import RecordingsEditor from "./Components/lineup/RecordingsEditor";

export default function EditLineUp({ id, onBack }) {
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [keySel, setKeySel] = useState("");

  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");

  const [dragWorshipIndex, setDragWorshipIndex] = useState(null);
  const [dragPraiseIndex, setDragPraiseIndex] = useState(null);

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

  const moveItem = (list, from, to) => {
    const next = [...list];
    const [picked] = next.splice(from, 1);
    next.splice(to, 0, picked);
    return next;
  };

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
        setWorshipList(Array.isArray(data.worship) ? data.worship : []);
        setPraiseList(Array.isArray(data.praise) ? data.praise : []);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  /* ---------------- ADD SONGS ---------------- */
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

  /* ---------------- EDIT SONG TEXT ---------------- */
  const updateWorshipText = (idx, value) => {
    setWorshipList((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const updatePraiseText = (idx, value) => {
    setPraiseList((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  /* ---------------- REMOVE SONG (WITH CONFIRM) ---------------- */
  const removeWorship = (idx) => {
    if (!window.confirm("Remove this worship song?")) return;
    setWorshipList((prev) => prev.filter((_, i) => i !== idx));
  };

  const removePraise = (idx) => {
    if (!window.confirm("Remove this praise song?")) return;
    setPraiseList((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------------- SAVE ---------------- */
  const handleUpdate = async () => {
    if (!keySel) return alert("Please select a key");

    await updateDoc(doc(db, "users", auth.currentUser.uid, "lineups", id), {
      title: title.trim() || "",
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
        placeholder="Line-Up Title (optional)"
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

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          key={`${w}-${i}`}
          draggable
          onDragStart={() => setDragWorshipIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragWorshipIndex === null || dragWorshipIndex === i) return;
            setWorshipList((prev) => moveItem(prev, dragWorshipIndex, i));
            setDragWorshipIndex(null);
          }}
          style={{
            display: "flex",
            gap: 6,
            marginTop: 6,
            alignItems: "center",
          }}
        >
          <span
            title="Drag to reorder"
            style={{
              cursor: "grab",
              userSelect: "none",
              padding: "0 6px",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            ☰
          </span>

          <input
            className="input"
            value={w}
            onChange={(e) => updateWorshipText(i, e.target.value)}
          />

          <button className="btn small danger" onClick={() => removeWorship(i)}>
            <DeleteIcon />
          </button>
        </div>
      ))}

      {/* PRAISE */}
      <h3 style={{ marginTop: 20 }}>Praise Songs</h3>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          key={`${p}-${i}`}
          draggable
          onDragStart={() => setDragPraiseIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragPraiseIndex === null || dragPraiseIndex === i) return;
            setPraiseList((prev) => moveItem(prev, dragPraiseIndex, i));
            setDragPraiseIndex(null);
          }}
          style={{
            display: "flex",
            gap: 6,
            marginTop: 6,
            alignItems: "center",
          }}
        >
          <span
            title="Drag to reorder"
            style={{
              cursor: "grab",
              userSelect: "none",
              padding: "0 6px",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            ☰
          </span>

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

      <h3 style={{ marginTop: 24 }}>Rehearsal Recordings</h3>
      <RecordingsEditor lineupId={id} />

      <button
        className="btn primary"
        style={{ marginTop: 20, marginBottom: 10 }}
        onClick={handleUpdate}
      >
        Save Changes
      </button>
    </div>
  );
}
