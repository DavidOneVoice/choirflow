import { formatBytes, formatDuration } from "../../utils/format";
import "./RecordingListReadOnly.css";

export default function RecordingListReadOnly({ recordings }) {
  if (!recordings || recordings.length === 0) {
    return (
      <p className="cf-rec-ro__empty">
        No recordings attached yet. To attach your rehearsal recordings and
        intro, click the <b>Edit</b> button and upload your recorded audio
        files.
      </p>
    );
  }

  return (
    <div className="cf-rec-ro__list">
      {recordings.map((rec) => {
        const durationLabel =
          typeof rec.durationSeconds === "number" && rec.durationSeconds > 0
            ? formatDuration(rec.durationSeconds)
            : "—";

        return (
          <div key={rec.id} className="cf-rec-ro__item">
            <div className="cf-rec-ro__top">
              <p className="cf-rec-ro__name" title={rec.name}>
                {rec.name}
              </p>
              <span className="cf-rec-ro__badge">Audio</span>
            </div>

            <p className="cf-rec-ro__meta">
              <span>Duration: {durationLabel}</span>
              {rec.size ? <span> • Size: {formatBytes(rec.size)}</span> : null}
            </p>

            <audio className="cf-rec-ro__audio" controls src={rec.url} />
          </div>
        );
      })}
    </div>
  );
}
