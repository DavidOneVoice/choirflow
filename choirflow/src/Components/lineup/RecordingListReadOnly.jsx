import { formatBytes, formatDuration } from "../../utils/format";

export default function RecordingListReadOnly({ recordings }) {
  if (!recordings || recordings.length === 0) {
    return (
      <p className="muted" style={{ marginTop: 10 }}>
        No recordings attached yet. To attach your rehearsal recordings and
        intro, click the Edit button and upload your recorded audio files or
        record directly from the app.
      </p>
    );
  }

  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {recordings.map((rec) => {
        const durationLabel =
          typeof rec.durationSeconds === "number" && rec.durationSeconds > 0
            ? formatDuration(rec.durationSeconds)
            : "—";

        return (
          <div
            key={rec.id}
            style={{ paddingTop: 12, borderTop: "2px solid #eee" }}
          >
            <p style={{ marginBottom: 6 }}>
              <b>{rec.name}</b>
            </p>

            <p
              className="muted"
              style={{ marginTop: 0, marginBottom: 10, fontSize: ".9rem" }}
            >
              Duration: {durationLabel}
              {rec.size ? ` • Size: ${formatBytes(rec.size)}` : ""}
            </p>

            <audio controls style={{ width: "100%" }} src={rec.url} />
          </div>
        );
      })}
    </div>
  );
}
