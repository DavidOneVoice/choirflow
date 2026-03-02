import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "./firebase/firebase";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import "./styles/pages/search-filters.css";
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
  const [showFilters, setShowFilters] = useState(false);

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
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (songs || [])
      .filter((s) => (s.title || "").toLowerCase().includes(q))
      .filter((s) => (keyFilter ? s.key === keyFilter : true))
      .filter((s) =>
        tierFilter ? String(s.tier || "") === String(tierFilter) : true,
      )
      .filter((s) => (categoryFilter ? s.category === categoryFilter : true));
  }, [songs, search, keyFilter, tierFilter, categoryFilter]);

  const activeFiltersCount =
    (keyFilter ? 1 : 0) + (tierFilter ? 1 : 0) + (categoryFilter ? 1 : 0);

  const clearFilters = () => {
    setKeyFilter("");
    setTierFilter("");
    setCategoryFilter("");
  };

  /* ---------------- START EDIT ---------------- */
  const startEdit = (song) => {
    setEditId(song.id);
    setEditData({
      title: song.title || "",
      key: song.key || "",
      category: song.category || "",
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
      tier: (editData.tier || "").trim(),
    });

    setEditId(null);
  };

  /* ---------------- DELETE SONG ---------------- */
  const removeSong = async (id) => {
    if (!window.confirm("Delete this song?")) return;
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid, "songs", id);
    await deleteDoc(ref);
  };

  return (
    <div className="card sf">
      {/* Header */}
      <div className="sf-head">
        <div className="sf-titleWrap">
          <h1 className="sf-title">Search</h1>
          <p className="sf-sub muted">
            Find songs fast. Filter by key, tier, and category.
          </p>
        </div>

        <button
          className="sf-filterBtn"
          onClick={() => setShowFilters((p) => !p)}
          title="Toggle filters"
        >
          {showFilters ? <CloseIcon /> : <TuneIcon />}
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="sf-badge">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="sf-search">
        <SearchIcon className="sf-searchIcon" />
        <input
          className="sf-searchInput"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.trim() && (
          <button className="sf-clearSearch" onClick={() => setSearch("")}>
            Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="sf-panel">
          <div className="sf-grid">
            <div className="sf-field">
              <label className="sf-label">Key</label>
              <select
                className="sf-select"
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
            </div>

            <div className="sf-field">
              <label className="sf-label">Tier</label>
              <select
                className="sf-select"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
              </select>
            </div>

            <div className="sf-field sf-span2">
              <label className="sf-label">Category</label>
              <select
                className="sf-select"
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
            </div>
          </div>

          <div className="sf-panelActions">
            <button className="btn" onClick={clearFilters}>
              Reset Filters
            </button>
            <button
              className="btn primary"
              onClick={() => setShowFilters(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="sf-summary">
        <span className="sf-pill">
          Showing <b>{filtered.length}</b> of <b>{songs.length}</b>
        </span>

        {(keyFilter || tierFilter || categoryFilter) && (
          <div className="sf-chips">
            {keyFilter && (
              <span className="sf-chip" onClick={() => setKeyFilter("")}>
                Key: {keyFilter} <b>×</b>
              </span>
            )}
            {tierFilter && (
              <span className="sf-chip" onClick={() => setTierFilter("")}>
                Tier: {tierFilter} <b>×</b>
              </span>
            )}
            {categoryFilter && (
              <span className="sf-chip" onClick={() => setCategoryFilter("")}>
                {categoryFilter} <b>×</b>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="sf-list">
        {filtered.length === 0 ? (
          <div className="sf-empty">
            <p className="muted">No songs match these filters.</p>
          </div>
        ) : (
          filtered.map((s) => {
            const isEditing = editId === s.id;

            return (
              <div
                key={s.id}
                className={`sf-item ${isEditing ? "is-edit" : ""}`}
              >
                {isEditing ? (
                  <div className="sf-edit">
                    <div className="sf-editGrid">
                      <input
                        className="input sf-input"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="Title"
                      />

                      <input
                        className="input sf-input"
                        value={editData.key}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, key: e.target.value }))
                        }
                        placeholder="Key (e.g. F#)"
                      />

                      <input
                        className="input sf-input"
                        value={editData.category}
                        onChange={(e) =>
                          setEditData((p) => ({
                            ...p,
                            category: e.target.value,
                          }))
                        }
                        placeholder="Category"
                      />

                      <input
                        className="input sf-input"
                        value={editData.tier}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, tier: e.target.value }))
                        }
                        placeholder="Tier (optional)"
                      />
                    </div>

                    <div className="sf-actions">
                      <button className="btn primary" onClick={saveEdit}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sf-view">
                    <div className="sf-main">
                      <h3 className="sf-songTitle">{s.title}</h3>

                      <div className="sf-badges">
                        {s.key ? (
                          <span className="sf-badge">Key: {s.key}</span>
                        ) : null}
                        {s.tier ? (
                          <span className="sf-badge">Tier {s.tier}</span>
                        ) : null}
                        {s.category ? (
                          <span className="sf-badge sf-badgeSoft">
                            {s.category}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="sf-rowActions">
                      <button
                        className="btn small"
                        onClick={() => startEdit(s)}
                      >
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
          })
        )}
      </div>
    </div>
  );
}
