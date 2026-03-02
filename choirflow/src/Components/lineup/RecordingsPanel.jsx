import "./RecordingsPanel.css";
import UploadProgress from "./UploadProgress";
import RecordingList from "./RecordingList";

export default function RecordingsPanel({
  uploading,
  uploadProgress,
  onPickFiles,
  onClearCompleted,
  recordings,
  onDeleteRecording,
  onRenameRecording,
}) {
  return (
    <section className="cf-rec-panel">
      <div className="cf-rec-panel__head">
        <h3 className="cf-rec-panel__title">Rehearsal Recordings</h3>
        <p className="cf-rec-panel__sub">
          Upload audio files for rehearsal or intro.
        </p>
      </div>

      <div className="cf-rec-panel__uploader">
        <label className="cf-rec-panel__fileBtn">
          <input
            className="cf-rec-panel__fileInput"
            type="file"
            accept="audio/*"
            multiple
            onChange={onPickFiles}
          />
          Select Audio Files
        </label>

        <button
          className="btn primary cf-rec-panel__uploadBtn"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <UploadProgress
        uploadProgress={uploadProgress}
        onClearCompleted={onClearCompleted}
        className="cf-rec-panel__progress"
      />

      <RecordingList
        recordings={recordings}
        onDelete={onDeleteRecording}
        onRename={onRenameRecording}
      />
    </section>
  );
}
