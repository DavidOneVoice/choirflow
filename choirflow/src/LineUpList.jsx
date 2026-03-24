import React, { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db, auth } from "./firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import LineUpDetails from "./Components/lineup/LineUpDetails";
import EditLineUp from "./EditLineUp";

import "./styles/pages/lineup-list.css";

export default function LineUpList({ onBack, onShareInChat }) {
  const [lineups, setLineups] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, "users", auth.currentUser.uid, "lineups");

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setLineups(list);
    });

    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const total = lineups.length;
    const worship = lineups.reduce(
      (acc, l) => acc + (l.worship?.length || 0),
      0,
    );
    const praise = lineups.reduce((acc, l) => acc + (l.praise?.length || 0), 0);
    return { total, worship, praise };
  }, [lineups]);

  /* ---------- EDIT SCREEN ---------- */
  if (editId) {
    return (
      <EditLineUp
        id={editId}
        onBack={() => {
          setEditId(null);
          setViewId(null);
        }}
      />
    );
  }

  /* ---------- DETAILS SCREEN ---------- */
  if (viewId) {
    return (
      <LineUpDetails
        id={viewId}
        onBack={() => setViewId(null)}
        onEdit={(id) => setEditId(id)}
        onShareInChat={onShareInChat}
      />
    );
  }

  return (
    <div className="card ll">
      <button className="btn small ll__back" onClick={onBack} aria-label="Back">
        <ArrowBackIcon />
      </button>

      <div className="ll__header">
        <h1 className="ll__title">Saved Line-Ups</h1>
        <p className="muted ll__sub">
          {stats.total} line-up{stats.total === 1 ? "" : "s"} • {stats.worship}{" "}
          worship • {stats.praise} praise
        </p>
      </div>

      {lineups.length === 0 ? (
        <div className="ll__empty">
          <div className="ll__emptyIcon" aria-hidden="true">
            ♫
          </div>
          <h3 className="ll__emptyTitle">No line-ups yet</h3>
          <p className="muted ll__emptyText">
            Create your first line-up and it will show here.
          </p>
        </div>
      ) : (
        <div className="ll__list">
          {lineups.map((lu) => {
            const title = (lu.title || "").trim();
            const key = lu.key || "Unknown";

            return (
              <button
                key={lu.id}
                type="button"
                className="ll__item"
                onClick={() => setViewId(lu.id)}
              >
                <div className="ll__itemTop">
                  <h3 className="ll__itemTitle">
                    {title ? title : `Line-Up (Key: ${key})`}
                  </h3>

                  <span className="ll__pill">
                    {key}
                    <span className="ll__pillSub">Maj</span>
                  </span>
                </div>

                <p className="muted ll__meta">
                  {lu.worship?.length || 0} Worship • {lu.praise?.length || 0}{" "}
                  Praise
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
