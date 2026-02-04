import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import SearchIcon from "@mui/icons-material/Search";
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

export default function SearchFilters() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    key: "",
    category: "",
    tier: "",
  });

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

  /* ---------------- FETCH SONGS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSongs(list);
    });

    return () => unsub();
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */
  const filtered = songs
    .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => (keyFilter ? s.key === keyFilter : true))
    .filter((s) => (tierFilter ? String(s.tier) === String(tierFilter) : true))
    .filter((s) => (categoryFilter ? s.category === categoryFilter : true));

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

    await updateDoc(ref, { ...editData });
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
      <h1>Search & Filters</h1>

      {/* SEARCH */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <SearchIcon
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999",
            pointerEvents: "none",
          }}
        />

        <input
          className="input"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* FILTERS */}
      <select
        className="input"
        value={keyFilter}
        onChange={(e) => setKeyFilter(e.target.value)}
      >
        <option value="">All Keys</option>
        {keysList.map((k) => (
          <option key={k} value={k}>
            {k} Major
          </option>
        ))}
      </select>

      <select
        className="input"
        value={tierFilter}
        onChange={(e) => setTierFilter(e.target.value)}
      >
        <option value="">All Tiers</option>
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
      </select>

      <select
        className="input"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="">All Categories</option>
        {allCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* RESULTS */}
      <div style={{ marginTop: 20 }}>
        {filtered.length === 0 && (
          <p className="muted">No songs match these filters.</p>
        )}

        {filtered.map((s) => (
          <div
            key={s.id}
            style={{ padding: "10px 0", borderTop: "2px solid #eee" }}
          >
            {editId === s.id ? (
              <>
                <input
                  className="input"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                />
                <input
                  className="input"
                  value={editData.key}
                  onChange={(e) =>
                    setEditData({ ...editData, key: e.target.value })
                  }
                />
                <input
                  className="input"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                />
                <input
                  className="input"
                  value={editData.tier}
                  onChange={(e) =>
                    setEditData({ ...editData, tier: e.target.value })
                  }
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn primary" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="btn" onClick={() => setEditId(null)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{s.title}</h3>
                <p className="muted" style={{ fontSize: ".9rem" }}>
                  Key: {s.key}
                  {s.tier && <> • Tier {s.tier}</>}
                  {s.category && <> • {s.category}</>}
                </p>

                <div style={{ display: "flex", gap: 10 }}>
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
