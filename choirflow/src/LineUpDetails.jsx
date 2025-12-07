import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function LineUpDetails({ id, onBack }) {
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !id) return;

    const fetchData = async () => {
      const ref = doc(db, "users", auth.currentUser.uid, "lineups", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setLineup({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  /* ----------------------- DELETE LINEUP ----------------------- */
  const deleteLineup = async () => {
    if (!window.confirm("Delete this lineup permanently?")) return;

    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "lineups", id));
      onBack();
    } catch (err) {
      alert("Error deleting lineup: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Loading lineup...</p>
      </div>
    );
  }

  if (!lineup) {
    return (
      <div className="card">
        <p className="muted">Line-up not found.</p>
        <button className="btn primary" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
      <h1 style={{ marginBottom: 10 }}>{lineup.title}</h1>

      <p className="muted" style={{ marginBottom: 10 }}>
        Key: <strong>{lineup.key}</strong>
      </p>

      {/* Worship Songs */}
      {lineup.worshipSongs?.length > 0 && (
        <>
          <h3 style={{ color: "var(--primary)", marginTop: 16 }}>
            Worship Songs
          </h3>
          {lineup.worshipSongs.map((w, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              {w}
            </div>
          ))}
        </>
      )}

      {/* Praise Songs */}
      {lineup.praiseSongs?.length > 0 && (
        <>
          <h3 style={{ color: "var(--primary)", marginTop: 16 }}>
            Praise Songs
          </h3>
          {lineup.praiseSongs.map((p, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              {p}
            </div>
          ))}
        </>
      )}

      {/* Back & Delete */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={onBack}>
          Back
        </button>

        <button
          className="btn primary"
          style={{ flex: 1 }}
          onClick={deleteLineup}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
