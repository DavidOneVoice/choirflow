import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useLineupDetails(lineupId) {
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !lineupId) return;

    let alive = true;

    async function fetchData() {
      setLoading(true);
      const ref = doc(db, "users", auth.currentUser.uid, "lineups", lineupId);
      const snap = await getDoc(ref);

      if (!alive) return;

      if (snap.exists()) setLineup({ id: snap.id, ...snap.data() });
      else setLineup(null);

      setLoading(false);
    }

    fetchData();

    return () => {
      alive = false;
    };
  }, [lineupId]);

  return { lineup, loading };
}
