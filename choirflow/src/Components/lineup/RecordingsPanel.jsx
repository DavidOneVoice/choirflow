import UploadProgress from "./UploadProgress";
import RecordingList from "./RecordingList";

export default function RecordingsPanel({
  uploading,
  uploadProgress,
  onPickFiles,
  onClearCompleted,
  recording,
  recordError,
  onStartRecording,
  onStopRecording,
  recordings,
  onDeleteRecording,
  onRenameRecording,
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ marginTop: 10 }}>Rehearsal Recordings</h3>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <input type="file" accept="audio/*" multiple onChange={onPickFiles} />
        <button className="btn primary" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {!recording ? (
          <button className="btn primary" onClick={onStartRecording}>
            Record Voice Note
          </button>
        ) : (
          <button className="btn danger" onClick={onStopRecording}>
            Stop Recording
          </button>
        )}
      </div>

      {recordError && (
        <p className="muted" style={{ color: "crimson", marginTop: 8 }}>
          {recordError}
        </p>
      )}

      <UploadProgress
        uploadProgress={uploadProgress}
        onClearCompleted={onClearCompleted}
      />

      <RecordingList
        recordings={recordings}
        onDelete={onDeleteRecording}
        onRename={onRenameRecording}
      />
    </div>
  );
}
