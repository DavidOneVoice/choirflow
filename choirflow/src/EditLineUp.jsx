import React, { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import PianoIcon from "@mui/icons-material/Piano";
import CloseIcon from "@mui/icons-material/Close";
import { db, auth } from "./firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import RecordingsEditor from "./Components/lineup/RecordingsEditor";
import MiniKeyboard from "./Components/music/MiniKeyboard";
import {
  getEditLineupDraftKey,
  saveDraft,
  loadDraft,
  clearDraft,
} from "./utils/lineupDraft";
import "./styles/pages/lineup-edit.css";

export default function EditLineUp({ id, onBack }) {
  const [loading, setLoading] = useState(true);
  const draftKey = getEditLineupDraftKey(id);
  const [title, setTitle] = useState("");
  const [keySel, setKeySel] = useState("");

  const [worshipList, setWorshipList] = useState([]);
  const [praiseList, setPraiseList] = useState([]);

  const [worshipInput, setWorshipInput] = useState("");
  const [praiseInput, setPraiseInput] = useState("");

  const [dragWorshipIndex, setDragWorshipIndex] = useState(null);
  const [dragPraiseIndex, setDragPraiseIndex] = useState(null);

  const [showKb, setShowKb] = useState(false);

  const keysList = useMemo(
    () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    [],
  );

  const moveItem = (list, from, to) => {
    const next = [...list];
    const [picked] = next.splice(from, 1);
    next.splice(to, 0, picked);
    return next;
  };

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

  useEffect(() => {
    if (!auth.currentUser || !id) return;

    const load = async () => {
      const ref = doc(db, "users", auth.currentUser.uid, "lineups", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        const draft = loadDraft(draftKey);

        if (draft) {
          setTitle(draft.title || "");
          setKeySel(draft.keySel || "");
          setWorshipInput(draft.worshipInput || "");
          setPraiseInput(draft.praiseInput || "");
          setWorshipList(
            Array.isArray(draft.worshipList) ? draft.worshipList : [],
          );
          setPraiseList(
            Array.isArray(draft.praiseList) ? draft.praiseList : [],
          );
        } else {
          setTitle(data.title || "");
          setKeySel(data.key || "");
          setWorshipList(Array.isArray(data.worship) ? data.worship : []);
          setPraiseList(Array.isArray(data.praise) ? data.praise : []);
        }
      }

      setLoading(false);
    };

    load();
  }, [id, draftKey]);

  useEffect(() => {
    if (!id) return;

    saveDraft(draftKey, {
      title,
      keySel,
      worshipInput,
      praiseInput,
      worshipList,
      praiseList,
    });
  }, [
    draftKey,
    id,
    title,
    keySel,
    worshipInput,
    praiseInput,
    worshipList,
    praiseList,
  ]);

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

  const removeWorship = (idx) => {
    if (!window.confirm("Remove this worship song?")) return;
    setWorshipList((prev) => prev.filter((_, i) => i !== idx));
  };

  const removePraise = (idx) => {
    if (!window.confirm("Remove this praise song?")) return;
    setPraiseList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdate = async () => {
    if (!keySel) return alert("Please select a key");

    await updateDoc(doc(db, "users", auth.currentUser.uid, "lineups", id), {
      title: title.trim() || "",
      key: keySel,
      worship: worshipList,
      praise: praiseList,
    });
    clearDraft(draftKey);

    alert("Line-up updated successfully!");
    onBack();
  };

  if (loading) {
    return (
      <div className="card lineup-edit">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="card lineup-edit">
      <button
        className="btn small lineup-edit__back"
        onClick={onBack}
        aria-label="Back"
        type="button"
      >
        <ArrowBackIcon />
      </button>

      <div className="lineup-edit__header">
        <h1 className="lineup-edit__title">Edit Line-Up</h1>
        <p className="muted lineup-edit__sub">
          Drag to reorder. Changes save to this line-up.
        </p>
      </div>

      {/* Title */}
      <section className="lineup-edit__section">
        <label className="lineup-edit__label">Title (optional)</label>
        <input
          className="input lineup-edit__input"
          placeholder="e.g. Covenant Night — Worship Set"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </section>

      {/* Key */}
      <section className="lineup-edit__section">
        <div className="lineup-edit__row">
          <label className="lineup-edit__label">Key</label>

          <button
            type="button"
            className="btn small lineup-edit__kbdBtn"
            onClick={() => setShowKb(true)}
          >
            <PianoIcon className="lineup-edit__kbdIcon" />
            <span>Keyboard</span>
          </button>
        </div>

        <select
          className="input lineup-edit__select"
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
          <div className="lineup-edit__chip">
            <span className="lineup-edit__chipMuted">Selected:</span>
            <b>{keySel} Major</b>
          </div>
        )}
      </section>

      {/* WORSHIP */}
      <section className="lineup-edit__section">
        <div className="lineup-edit__row">
          <h3 className="lineup-edit__h3">Worship Songs</h3>
          <span className="muted lineup-edit__count">{worshipList.length}</span>
        </div>

        <div className="lineup-edit__adder">
          <input
            className="input lineup-edit__input"
            placeholder="Add worship song..."
            value={worshipInput}
            onChange={(e) => setWorshipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addWorship();
            }}
          />

          <button
            type="button"
            className="btn small primary lineup-edit__addBtn"
            onClick={addWorship}
          >
            <AddCircleIcon />
          </button>
        </div>

        <div className="lineup-edit__list">
          {worshipList.map((w, i) => (
            <div
              key={`${w}-${i}`}
              className="lineup-edit__item"
              draggable
              onDragStart={() => setDragWorshipIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragWorshipIndex === null || dragWorshipIndex === i) return;
                setWorshipList((prev) => moveItem(prev, dragWorshipIndex, i));
                setDragWorshipIndex(null);
              }}
            >
              <span className="lineup-edit__grab" title="Drag to reorder">
                ☰
              </span>

              <input
                className="input lineup-edit__itemInput"
                value={w}
                onChange={(e) => updateWorshipText(i, e.target.value)}
              />

              <button
                type="button"
                className="btn small danger lineup-edit__delBtn"
                onClick={() => removeWorship(i)}
                aria-label="Delete worship song"
                title="Remove"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PRAISE */}
      <section className="lineup-edit__section">
        <div className="lineup-edit__row">
          <h3 className="lineup-edit__h3">Praise Songs</h3>
          <span className="muted lineup-edit__count">{praiseList.length}</span>
        </div>

        <div className="lineup-edit__adder">
          <input
            className="input lineup-edit__input"
            placeholder="Add praise song..."
            value={praiseInput}
            onChange={(e) => setPraiseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPraise();
            }}
          />

          <button
            type="button"
            className="btn small primary lineup-edit__addBtn"
            onClick={addPraise}
          >
            <AddCircleIcon />
          </button>
        </div>

        <div className="lineup-edit__list">
          {praiseList.map((p, i) => (
            <div
              key={`${p}-${i}`}
              className="lineup-edit__item"
              draggable
              onDragStart={() => setDragPraiseIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragPraiseIndex === null || dragPraiseIndex === i) return;
                setPraiseList((prev) => moveItem(prev, dragPraiseIndex, i));
                setDragPraiseIndex(null);
              }}
            >
              <span className="lineup-edit__grab" title="Drag to reorder">
                ☰
              </span>

              <input
                className="input lineup-edit__itemInput"
                value={p}
                onChange={(e) => updatePraiseText(i, e.target.value)}
              />

              <button
                type="button"
                className="btn small danger lineup-edit__delBtn"
                onClick={() => removePraise(i)}
                aria-label="Delete praise song"
                title="Remove"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* RECORDINGS */}
      <section className="lineup-edit__section">
        <div className="lineup-edit__row">
          <h3 className="lineup-edit__h3">Rehearsal Recordings</h3>
          <span className="muted lineup-edit__hint">Upload audio files</span>
        </div>
        <div className="lineup-edit__recordings">
          <RecordingsEditor lineupId={id} />
        </div>
      </section>

      <button
        className="btn primary lineup-edit__save"
        type="button"
        onClick={handleUpdate}
      >
        Save Changes
      </button>

      {/* Keyboard Modal */}
      {showKb && (
        <div
          className="lineup-edit__modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowKb(false)}
        >
          <div
            className="lineup-edit__modalSheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lineup-edit__modalTop">
              <div>
                <h3 className="lineup-edit__modalTitle">Keyboard</h3>
                <p className="muted lineup-edit__modalSub">
                  Tap a note to hear it and set the key.
                </p>
              </div>

              <button
                className="btn small lineup-edit__close"
                onClick={() => setShowKb(false)}
                type="button"
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
