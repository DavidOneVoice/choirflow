import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Correct Firestore path:
    // users / userUid / songs
    const songsRef = collection(db, "users", user.uid, "songs");

    const q = query(songsRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSongs(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Loading songs...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: 12,
          color: "var(--primary)",
        }}
      >
        Your Songs
      </h1>

      {songs.length === 0 && (
        <div className="card">
          <p className="muted">No songs saved yet.</p>
          <p className="muted">
            Tap the + button below to add your first song.
          </p>
        </div>
      )}

      {songs.map((s) => (
        <div key={s.id} className="song-card">
          <h3>{s.title}</h3>
          <p className="muted">
            Key: {s.key} • Category: {s.category}
            {s.tier && <> • Tier {s.tier}</>}
          </p>
        </div>
      ))}
    </div>
  );
}
