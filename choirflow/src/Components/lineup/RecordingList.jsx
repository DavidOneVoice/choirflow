import { useState } from "react";
import { formatBytes, formatDuration } from "../../utils/format";
import DeleteIcon from "@mui/icons-material/Delete";

export default function RecordingList({ recordings, onDelete, onRename }) {
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  if (!recordings || recordings.length === 0) {
    return <p className="cf-rec__empty">No recordings attached yet.</p>;
  }

  const startRename = (rec) => {
    setEditId(rec.id);
    setEditName(rec.name || "");
  };

  const cancelRename = () => {
    setEditId(null);
    setEditName("");
  };

  const saveRename = async (rec) => {
    if (!onRename) return;
    await onRename(rec.id, editName);
    cancelRename();
  };

  return (
    <div className="cf-rec__list">
      {recordings.map((rec) => {
        const durationLabel =
          typeof rec.durationSeconds === "number" && rec.durationSeconds > 0
            ? formatDuration(rec.durationSeconds)
            : "—";

        return (
          <div key={rec.id} className="cf-rec__item">
            {editId === rec.id ? (
              <>
                <input
                  className="cf-rec__renameInput"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Recording name"
                />

                <div className="cf-rec__renameActions">
                  <button
                    className="cf-rec__btn cf-rec__btn--primary"
                    onClick={() => saveRename(rec)}
                    type="button"
                  >
                    Save
                  </button>

                  <button
                    className="cf-rec__btn"
                    onClick={cancelRename}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="cf-rec__itemTop">
                  <p className="cf-rec__name">
                    <b>{rec.name}</b>
                  </p>

                  <button
                    className="cf-rec__btn cf-rec__btn--ghost"
                    onClick={() => startRename(rec)}
                    type="button"
                  >
                    Rename
                  </button>
                </div>

                <p className="cf-rec__meta">
                  Duration: {durationLabel}
                  {rec.size ? ` • Size: ${formatBytes(rec.size)}` : ""}
                </p>

                <audio className="cf-rec__audio" controls src={rec.url} />

                <button
                  className="cf-rec__btn cf-rec__btn--danger"
                  onClick={() => onDelete(rec)}
                  type="button"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  <DeleteIcon /> <span>Delete Recording</span>
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
