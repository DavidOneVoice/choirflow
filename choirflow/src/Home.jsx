import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import singers from "./assets/singers.png";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [sortBy, setSortBy] = useState("createdAt_desc");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    key: "",
    category: "",
    tier: "",
  });

  /* ---------------- FETCH SONGS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSongs(list);
    });

    return () => unsub();
  }, []);

  /* ---------------- SORT LOGIC ---------------- */
  const sortedSongs = [...songs].sort((a, b) => {
    switch (sortBy) {
      case "title_asc":
        return a.title.localeCompare(b.title);
      case "title_desc":
        return b.title.localeCompare(a.title);
      case "key_asc":
        return a.key.localeCompare(b.key);
      case "key_desc":
        return b.key.localeCompare(a.key);
      case "tier_asc":
        return (a.tier || 0) - (b.tier || 0);
      case "tier_desc":
        return (b.tier || 0) - (a.tier || 0);
      case "createdAt_asc":
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      default:
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
  });

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
      <h1>All Songs</h1>

      {/* SORT SELECTOR */}
      <select
        className="input"
        style={{ marginBottom: 12 }}
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="createdAt_desc">Newest First</option>
        <option value="createdAt_asc">Oldest First</option>

        <option value="title_asc">Title A–Z</option>
        <option value="title_desc">Title Z–A</option>

        <option value="key_asc">Key A–Z</option>
        <option value="key_desc">Key Z–A</option>

        <option value="tier_asc">Tier Low–High</option>
        <option value="tier_desc">Tier High–Low</option>
      </select>

      {sortedSongs.length === 0 && (
        <img src={singers} className="singers" alt="Image of singers" />
      )}

      {sortedSongs.map((s) => (
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
                  setEditData({ ...editData, category: e.target.value })
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
                Key: {s.key} {s.tier && <> • Tier {s.tier}</>}
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
                {/* EDIT BUTTON */}
                <button className="btn small" onClick={() => startEdit(s)}>
                  Edit
                </button>

                {/* DELETE BUTTON */}
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
