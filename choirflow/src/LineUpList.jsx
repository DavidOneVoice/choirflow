import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db, auth } from "./firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import LineUpDetails from "./LineUpDetails";

export default function LineUpList({ onBack }) {
  const [lineups, setLineups] = useState([]);
  const [viewId, setViewId] = useState(null);

  /* ---------- FETCH SAVED LINE-UPS ---------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, "users", auth.currentUser.uid, "lineups");

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort by createdAt, fallback to 0 if missing
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setLineups(list);

      console.log("Fetched lineups:", list); // Debug old & new entries
    });

    return () => unsub();
  }, [auth.currentUser]);

  /* ---------- DETAILS SCREEN ---------- */
  if (viewId) {
    return <LineUpDetails id={viewId} onBack={() => setViewId(null)} />;
  }

  /* ---------- MAIN LIST PAGE ---------- */
  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <button
        className="btn small"
        onClick={onBack}
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <ArrowBackIcon /> <span>Back</span>
      </button>

      <h1>Saved Line-Ups</h1>

      {lineups.length === 0 ? (
        <p className="muted" style={{ marginTop: 15 }}>
          No line-ups saved yet.
        </p>
      ) : (
        lineups.map((lu) => (
          <div
            key={lu.id}
            className="song-item"
            style={{
              borderBottom: "1px solid #eee",
              padding: "12px 0",
              cursor: "pointer",
            }}
            onClick={() => setViewId(lu.id)}
          >
            <h3 style={{ fontWeight: 600, marginBottom: 4 }}>
              Key: {lu.key || "Unknown"}
            </h3>
            <p className="muted">
              {lu.worship?.length || 0} Worship • {lu.praise?.length || 0}{" "}
              Praise
            </p>
          </div>
        ))
      )}
    </div>
  );
}
