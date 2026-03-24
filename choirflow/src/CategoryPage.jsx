import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "./firebase/firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useConfirmDialog } from "./hooks/useConfirmDialog";
import "./styles/pages/category-page.css";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function CategoryPage({ category, onBack }) {
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

  const allCategories = ["Worship", ...praiseCategories];

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

  const [songs, setSongs] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    key: "",
    category: "",
    tier: "",
  });
  const { confirm, confirmDialog } = useConfirmDialog();

  /* ---------------- FETCH CATEGORY SONGS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setSongs(list);
    });

    return () => unsub();
  }, [category]);

  const total = useMemo(() => songs.length, [songs]);

  /* ---------------- START EDIT ---------------- */
  const startEdit = (song) => {
    setEditId(song.id);
    setEditData({
      title: song.title || "",
      key: song.key || "",
      category: song.category || category || "",
      tier: song.tier || "",
    });
  };

  /* ---------------- SAVE EDIT ---------------- */
  const saveEdit = async () => {
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid, "songs", editId);

    await updateDoc(ref, {
      ...editData,
      title: (editData.title || "").trim(),
      key: (editData.key || "").trim(),
      category: (editData.category || "").trim(),
      tier: praiseCategories.includes(editData.category)
        ? (editData.tier || "").trim()
        : null,
    });

    setEditId(null);
  };

  /* ---------------- DELETE SONG ---------------- */
  const removeSong = async (id) => {
    const shouldDelete = await confirm({
      title: "Delete song",
      message: "Are you sure you want to delete this song?",
      confirmText: "Yes, delete",
      cancelText: "No",
      tone: "danger",
    });
    if (!shouldDelete) return;
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid, "songs", id);
    await deleteDoc(ref);
  };

  return (
    <div className="card catpage">
      {/* Header */}
      <div className="catpage-head">
        <button className="catpage-back" onClick={onBack}>
          <ArrowBackIcon />
          <span>Back</span>
        </button>

        <div className="catpage-meta">
          <div className="catpage-titleRow">
            <h1 className="catpage-title">{category}</h1>
            <span className="catpage-pill">{total} songs</span>
          </div>
          <p className="catpage-sub muted">
            Edit quickly, keep your library clean.
          </p>
        </div>
      </div>

      {/* Empty */}
      {songs.length === 0 && (
        <div className="catpage-empty">
          <p className="muted">No songs found in this category.</p>
        </div>
      )}

      {/* List */}
      <div className="catpage-list">
        {songs.map((s) => {
          const isEditing = editId === s.id;

          return (
            <div
              key={s.id}
              className={`catpage-item ${isEditing ? "is-edit" : ""}`}
            >
              {isEditing ? (
                <div className="catpage-edit">
                  <div className="catpage-editGrid">
                    <input
                      className="input catpage-input"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Title"
                    />

                    <select
                      className="input catpage-input"
                      value={editData.key}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          key: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Key</option>
                      {musicalKeys.map((k) => (
                        <option key={k} value={k}>
                          {k} Major
                        </option>
                      ))}
                    </select>

                    <select
                      className="input catpage-input"
                      value={editData.category}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          category: e.target.value,
                          tier: praiseCategories.includes(e.target.value)
                            ? prev.tier
                            : "",
                        }))
                      }
                    >
                      <option value="">Select Category</option>
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {praiseCategories.includes(editData.category) && (
                      <select
                        className="input catpage-input"
                        value={editData.tier}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            tier: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Tier</option>
                        <option value="1">Tier 1 [Starting Songs]</option>
                        <option value="2">Tier 2 [Mid-Level Energy Songs]</option>
                        <option value="3">Tier 3 [High-Level Energy Songs]</option>
                      </select>
                    )}
                  </div>

                  <div className="catpage-actions">
                    <button className="btn primary" onClick={saveEdit}>
                      Save
                    </button>
                    <button className="btn" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="catpage-view">
                  <div className="catpage-main">
                    <h3 className="catpage-songTitle">{s.title}</h3>

                    <div className="catpage-badges">
                      {s.key ? (
                        <span className="catpage-badge">Key: {s.key}</span>
                      ) : null}
                      {s.tier ? (
                        <span className="catpage-badge">Tier {s.tier}</span>
                      ) : null}
                    </div>

                    <p className="catpage-mini muted">
                      {s.category || category}
                    </p>
                  </div>

                  <div className="catpage-actionsRow">
                    <button className="btn small" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    <button
                      className="btn small danger"
                      onClick={() => removeSong(s.id)}
                      aria-label="Delete song"
                      title="Delete"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirmDialog}
    </div>
  );
}
