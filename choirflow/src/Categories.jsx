import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Categories({ onSelectCategory }) {
  const [counts, setCounts] = useState({});

  const categories = [
    "Worship",
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

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(
      collection(db, "users", auth.currentUser.uid, "songs"),
      (snap) => {
        const data = {};
        snap.forEach((doc) => {
          const song = doc.data();
          const category = song.category || "Others";
          data[category] = (data[category] || 0) + 1;
        });
        setCounts(data);
      }
    );

    return () => unsub();
  }, []);

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <h1 style={{ marginBottom: 12 }}>Categories</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className="category-card"
            onClick={() => onSelectCategory(cat)}
          >
            <div className="cat-name">{cat}</div>
            <div className="cat-count">
              {counts[cat] ? `${counts[cat]} songs` : "0 songs"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
