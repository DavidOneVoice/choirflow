import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import "./styles/pages/categories.css";

export default function Categories({ onSelectCategory }) {
  const [counts, setCounts] = useState({});

  const categories = useMemo(
    () => [
      "Worship",
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
    ],
    [],
  );

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
      },
    );

    return () => unsub();
  }, []);

  return (
    <div className="card categories-page">
      <div className="categories-head">
        <div>
          <h1 className="categories-title">Categories</h1>
          <p className="categories-sub muted">
            Tap a category to view songs inside it.
          </p>
        </div>

        <div className="categories-pill">
          {Object.values(counts).reduce((a, b) => a + b, 0) || 0} total
        </div>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => {
          const count = counts[cat] || 0;
          return (
            <button
              key={cat}
              className="category-tile"
              onClick={() => onSelectCategory(cat)}
            >
              <div className="category-tile-top">
                <div className="category-tile-name">{cat}</div>
                <div className="category-tile-badge">{count}</div>
              </div>

              <div className="category-tile-meta">
                {count === 1 ? "1 song" : `${count} songs`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
