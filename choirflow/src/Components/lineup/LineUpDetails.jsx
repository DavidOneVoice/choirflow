import React, { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import { useLineupRecordings } from "../../hooks/useLineupRecordings";
import RecordingListReadOnly from "../../Components/lineup/RecordingListReadOnly";
import { useLineupDetails } from "../../hooks/useLineupDetails";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import "./LineUpDetails.css";

export default function LineUpDetails({ id, onBack, onEdit }) {
  const { lineup, loading } = useLineupDetails(id);
  const { recordings } = useLineupRecordings(id);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [showShareModal, setShowShareModal] = useState(false);

  const deleteLineup = async () => {
    const shouldDelete = await confirm({
      title: "Delete line-up",
      message:
        "Are you sure you want to delete this line-up permanently? This action cannot be undone.",
      confirmText: "Yes, delete",
      cancelText: "No",
      tone: "danger",
    });
    if (!shouldDelete) return;

    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "lineups", id));
      onBack();
    } catch (err) {
      alert("Error deleting lineup: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="card lineup-details">
        <p className="muted">Loading lineup...</p>
      </div>
    );
  }

  if (!lineup) {
    return (
      <div className="card lineup-details">
        <p className="muted">Line-up not found.</p>
        <button className="btn primary" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const title = lineup.title?.trim() ? lineup.title : "Line-Up";

  return (
    <div className="card lineup-details">
      <header className="lineup-details__header">
        <div className="lineup-details__titleWrap">
          <h1 className="lineup-details__title">{title}</h1>

          <div className="lineup-details__meta">
            <span className="lineup-details__pill">
              Key: <b>{lineup.key}</b>
            </span>
            <span className="lineup-details__counts muted">
              {lineup.worship?.length || 0} Worship • {lineup.praise?.length || 0} Praise
            </span>
          </div>
        </div>
      </header>

      {lineup.worship?.length > 0 && (
        <section className="lineup-details__section">
          <div className="lineup-details__sectionHead">
            <h3 className="lineup-details__sectionTitle">Worship Songs</h3>
            <span className="lineup-details__badge">{lineup.worship.length}</span>
          </div>

          <div className="lineup-details__list">
            {lineup.worship.map((w, idx) => (
              <div key={idx} className="lineup-details__row">
                <span className="lineup-details__index">{idx + 1}</span>
                <b className="lineup-details__text">{w}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {lineup.praise?.length > 0 && (
        <section className="lineup-details__section">
          <div className="lineup-details__sectionHead">
            <h3 className="lineup-details__sectionTitle">Praise Songs</h3>
            <span className="lineup-details__badge">{lineup.praise.length}</span>
          </div>

          <div className="lineup-details__list">
            {lineup.praise.map((p, idx) => (
              <div key={idx} className="lineup-details__row">
                <span className="lineup-details__index">{idx + 1}</span>
                <b className="lineup-details__text">{p}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="lineup-details__section">
        <div className="lineup-details__sectionHead">
          <h3 className="lineup-details__sectionTitle">Rehearsal Recordings</h3>
          <span className="lineup-details__badge">{recordings?.length || 0}</span>
        </div>

        <div className="lineup-details__recordings">
          <RecordingListReadOnly recordings={recordings} />
        </div>
      </section>

      <footer className="lineup-details__footer">
        <button className="btn primary lineup-details__primaryBtn" onClick={() => onEdit(lineup.id)}>
          Edit
        </button>

        <button className="btn ghost lineup-details__shareBtn" onClick={() => setShowShareModal(true)}>
          <ShareIcon fontSize="small" />
          Share in Chat
        </button>

        <div className="lineup-details__actionsRow">
          <button className="btn ghost lineup-details__iconBtn" onClick={onBack} title="Back">
            <ArrowBackIcon />
          </button>

          <button
            className="btn ghost lineup-details__iconBtn lineup-details__deleteBtn"
            onClick={deleteLineup}
            title="Delete"
          >
            <DeleteIcon />
          </button>
        </div>
      </footer>

      {showShareModal && (
        <div className="lineup-details__modalOverlay" role="dialog" aria-modal="true">
          <div className="lineup-details__modalCard">
            <h3>Line-up sharing is on the way</h3>
            <p className="muted">
              Secure lineup sharing in chat is being set up. This button will go live soon.
            </p>
            <button className="btn primary" onClick={() => setShowShareModal(false)}>
              Understood
            </button>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
