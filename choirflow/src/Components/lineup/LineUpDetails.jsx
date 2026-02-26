import React from "react";
import { auth, db } from "../../firebase/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLineupRecordings } from "../../hooks/useLineupRecordings";
import RecordingListReadOnly from "../../Components/lineup/RecordingListReadOnly";
import { useLineupDetails } from "../../hooks/useLineupDetails";

export default function LineUpDetails({ id, onBack, onEdit }) {
  const { lineup, loading } = useLineupDetails(id);
  const { recordings } = useLineupRecordings(id);
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
      <h1 style={{ marginBottom: 4 }}>Line-Up</h1>

      <p className="muted" style={{ marginBottom: 12 }}>
        Key: <strong>{lineup.key}</strong>
      </p>

      {lineup.worship?.length > 0 && (
        <>
          <h3 style={{ marginTop: 12 }}>Worship Songs</h3>
          {lineup.worship.map((w, idx) => (
            <div
              key={idx}
              style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
            >
              <b>{idx + 1}.</b> {w}
            </div>
          ))}
        </>
      )}

      {lineup.praise?.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Praise Songs</h3>
          {lineup.praise.map((p, idx) => (
            <div
              key={idx}
              style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
            >
              <b>{idx + 1}.</b> {p}
            </div>
          ))}
        </>
      )}
      <h3 style={{ marginTop: 20 }}>Rehearsal Recordings</h3>
      <RecordingListReadOnly recordings={recordings} />
      <div
        style={{
          marginTop: 60,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          className="btn primary"
          style={{ flex: 1 }}
          onClick={() => onEdit(lineup.id)}
        >
          Edit
        </button>

        <section
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <button className="btn ghost" style={{ flex: 1 }} onClick={onBack}>
            <ArrowBackIcon
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
          </button>

          <button
            className="btn ghost"
            style={{ flex: 1 }}
            onClick={deleteLineup}
          >
            <DeleteIcon style={{ verticalAlign: "middle", marginRight: 6 }} />
          </button>
        </section>
      </div>
    </div>
  );
}
