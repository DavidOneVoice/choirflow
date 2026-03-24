import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import option1 from "./assets/option1.jpg";
import SongItem from "./Components/SongItem";
import { useConfirmDialog } from "./hooks/useConfirmDialog";
import "./styles/pages/home.css";
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
  const [sortBy, setSortBy] = useState("createdAt_desc");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    key: "",
    category: "",
    tier: "",
  });
  const { confirm, confirmDialog } = useConfirmDialog();

  /* ---------------- FETCH SONGS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
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
      tier: praiseCategories.includes(editData.category) ? editData.tier : null,
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
    const ref = doc(db, "users", auth.currentUser.uid, "songs", id);
    await deleteDoc(ref);
  };

  return (
    <div className="card home-card">
      <div className="home-head">
        <div>
          <h1 className="home-title">All Songs</h1>
          <p className="muted home-sub">
            {sortedSongs.length} song{sortedSongs.length === 1 ? "" : "s"} saved
          </p>
        </div>

        <div className="home-sortWrap">
          <select
            className="input home-sort"
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
        </div>
      </div>

      {sortedSongs.length === 0 && (
        <div className="home-empty">
          <img src={option1} className="home-emptyImg" alt="Image of singers" />
          <p className="home-emptyTitle">No songs yet</p>
          <p className="muted home-emptyText">
            Add your first song and it will appear here.
          </p>
        </div>
      )}

      <div className="home-list">
        {sortedSongs.map((s) =>
          editId === s.id ? (
            <div key={s.id} className="home-editBlock">
              <div className="home-editGrid">
                <input
                  className="input"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  placeholder="Title"
                />

                <select
                  className="input"
                  value={editData.key}
                  onChange={(e) =>
                    setEditData({ ...editData, key: e.target.value })
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
                  className="input"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      category: e.target.value,
                      tier: praiseCategories.includes(e.target.value)
                        ? editData.tier
                        : "",
                    })
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
                    className="input"
                    value={editData.tier}
                    onChange={(e) =>
                      setEditData({ ...editData, tier: e.target.value })
                    }
                  >
                    <option value="">Select Tier</option>
                    <option value="1">Tier 1 [Starting Songs]</option>
                    <option value="2">Tier 2 [Mid-Level Energy Songs]</option>
                    <option value="3">Tier 3 [High-Level Energy Songs]</option>
                  </select>
                )}
              </div>

              <div className="home-editActions">
                <button className="btn primary" onClick={saveEdit}>
                  Save
                </button>
                <button className="btn" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <SongItem
              key={s.id}
              song={s}
              onEdit={startEdit}
              onDelete={removeSong}
              showActions={true}
            />
          ),
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
