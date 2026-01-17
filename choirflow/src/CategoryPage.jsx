import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const [songs, setSongs] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    key: "",
    category: "",
    tier: "",
  });

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

  /* ---------------- START EDIT ---------------- */
  const startEdit = (song) => {
    setEditId(song.id);
    setEditData({
      title: song.title,
      key: song.key,
      category: song.category,
      tier: song.tier || "",
    });
  };

  /* ---------------- SAVE EDIT ---------------- */
  const saveEdit = async () => {
    const ref = doc(db, "users", auth.currentUser.uid, "songs", editId);

    await updateDoc(ref, {
      ...editData,
    });

    setEditId(null);
  };

  /* ---------------- DELETE SONG ---------------- */
  const removeSong = async (id) => {
    if (!window.confirm("Delete this song?")) return;

    const ref = doc(db, "users", auth.currentUser.uid, "songs", id);

    await deleteDoc(ref);
  };

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      {/* BACK BUTTON */}
      <button
        className="btn ghost"
        style={{
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        onClick={onBack}
      >
        <ArrowBackIcon /> <span>Back</span>
      </button>

      <h1 style={{ marginBottom: 10 }}>{category}</h1>

      {songs.length === 0 && (
        <p className="muted">No songs found in this category.</p>
      )}

      {songs.map((s) => (
        <div
          key={s.id}
          style={{
            padding: "10px 0",
            borderTop: "2px solid #eee",
            marginBottom: 10,
          }}
        >
          {/* ---------- EDIT MODE ---------- */}
          {editId === s.id ? (
            <div>
              <input
                className="input"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                placeholder="Title"
              />

              <input
                className="input"
                value={editData.key}
                onChange={(e) =>
                  setEditData({ ...editData, key: e.target.value })
                }
                placeholder="Key"
              />

              <input
                className="input"
                value={editData.category}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    category: e.target.value,
                  })
                }
                placeholder="Category"
              />

              <input
                className="input"
                value={editData.tier}
                onChange={(e) =>
                  setEditData({ ...editData, tier: e.target.value })
                }
                placeholder="Tier"
              />

              <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                <button className="btn primary" onClick={saveEdit}>
                  Save
                </button>
                <button className="btn" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ---------- NORMAL VIEW ---------- */
            <div>
              <h3>{s.title}</h3>
              <p className="muted" style={{ fontSize: ".9rem" }}>
                Key: {s.key}
                {s.tier && <> • Tier {s.tier}</>}
                <br />
                {s.category}
              </p>

              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 10,
                }}
              >
                <button className="btn small" onClick={() => startEdit(s)}>
                  Edit
                </button>

                <button
                  className="btn small danger"
                  onClick={() => removeSong(s.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
