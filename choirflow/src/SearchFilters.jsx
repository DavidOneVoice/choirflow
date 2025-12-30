import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchFilters() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const allCategories = [
    "Worship",
    "General Praise",
    "Fast Highlife",
    "Slow Highlife",
    "Makossa",
    "Woro [Igbo]",
    "Woro [Yoruba]",
    "Woro [Niger-Delta]",
    "Revival Songs",
    "Soul Winning Songs",
    "Non-Nigerian Songs",
    "Contemporary [Modern] Praise",
    "Prayer Songs",
    "Communion Praise",
    "Anointing Praise",
    "Raggae",
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

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
      orderBy("createdAt", "desc")
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

  return (
    <div
      className="card"
      style={{ width: "100%", maxWidth: 420, background: "#fff" }}
    >
      <h1>Search & Filters</h1>

      {/* SEARCH */}
      <div
        style={{
          position: "relative",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        <SearchIcon
          style={{
            position: "absolute",
            left: 12,
            top: "40%",
            transform: "translateY(-50%)",
            color: "#999",
            pointerEvents: "none",
          }}
        />

        <input
          type="text"
          className="input"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            paddingLeft: 40, // space for icon
          }}
        />
      </div>

      {/* FILTER BY KEY */}
      <label style={{ marginTop: 15, marginBottom: 5, fontWeight: 600 }}>
        Filter by Key
      </label>
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

      {/* FILTER BY TIER */}
      <label style={{ marginTop: 15, marginBottom: 5, fontWeight: 600 }}>
        Filter by Tier
      </label>
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

      <label
        style={{
          marginTop: 15,
          marginBottom: 5,
          fontWeight: "600",
        }}
      >
        Filter by Category
      </label>
      <select
        className="input"
        style={{ background: "#f8f8f8" }}
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
            className="song-item"
            style={{
              padding: "10px 0",
              borderTop: "2px solid #eee",
            }}
          >
            <h3>{s.title}</h3>
            <p className="muted" style={{ fontSize: ".9rem" }}>
              Key: {s.key}
              {s.tier && <> • Tier {s.tier}</>}
              {s.category && <> • {s.category}</>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
