import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function SearchFilters() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  const praiseCategories = [
    "General Praise",
    "Fast Highlife",
    "Slow Highlife",
    "Makossa",
    "Woro [Igbo]",
    "Woro [Yoruba]",
    "Woro [Niger-Delta]",
    "Contemporary [Modern] Praise",
    "Prayer",
    "Communion",
    "Anointing",
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
    .filter((s) => (tierFilter ? String(s.tier) === String(tierFilter) : true));

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <h1>Search & Filters</h1>

      {/* Search Bar */}
      <input
        type="text"
        className="input"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter by Key */}
      <select
        className="input"
        value={keyFilter}
        onChange={(e) => setKeyFilter(e.target.value)}
      >
        <option value="">Filter by Key</option>
        {keysList.map((k) => (
          <option key={k} value={k}>
            {k} Major
          </option>
        ))}
      </select>

      {/* Filter by Tier */}
      <select
        className="input"
        value={tierFilter}
        onChange={(e) => setTierFilter(e.target.value)}
      >
        <option value="">Filter by Tier</option>
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
      </select>

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
              borderBottom: "1px solid #eee",
            }}
          >
            <h3 style={{ color: "var(--primary)" }}>{s.title}</h3>
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
