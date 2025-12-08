import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function CategoryPage({ category, onBack }) {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "songs"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSongs(list);
    });

    return () => unsub();
  }, [category]);

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
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

      <h1 style={{ marginBottom: 6 }}>{category}</h1>

      {songs.length === 0 && (
        <p className="muted" style={{ marginTop: 10 }}>
          No songs found in this category.
        </p>
      )}

      <div style={{ marginTop: 10 }}>
        {songs.map((s) => (
          <div
            key={s.id}
            className="song-item"
            style={{
              padding: "10px 0",
              borderBottom: "2px solid #eee",
              borderTop: "2px solid #eee",
            }}
          >
            <h3>{s.title}</h3>
            <p className="muted" style={{ fontSize: ".9rem" }}>
              Key: {s.key}
              {s.tier && <> • Tier {s.tier}</>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
