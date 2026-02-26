import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useLineupRecordings(lineupId) {
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    if (!auth.currentUser || !lineupId) return;

    const recCol = collection(
      db,
      "users",
      auth.currentUser.uid,
      "lineups",
      lineupId,
      "recordings",
    );

    const q = query(recCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecordings(list);
    });

    return () => unsub();
  }, [lineupId]);

  return { recordings };
}
