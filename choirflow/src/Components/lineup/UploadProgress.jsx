export default function UploadProgress({
  uploadProgress,
  onClearCompleted,
  className = "",
}) {
  const entries = Object.entries(uploadProgress || {});
  if (entries.length === 0) return null;

  return (
    <div className={`cf-rec__up ${className}`}>
      <div className="cf-rec__upHeader">
        <h4 className="cf-rec__upTitle">Upload Progress</h4>

        <button
          type="button"
          className="cf-rec__upClearBtn"
          onClick={onClearCompleted}
        >
          Clear Completed
        </button>
      </div>

      <div className="cf-rec__upList">
        {entries.map(([k, v]) => (
          <div key={k} className="cf-rec__upItem">
            <div className="cf-rec__upRow">
              <div className="cf-rec__upName" title={v.name}>
                {v.name}
              </div>

              <div className="cf-rec__upPct">
                {v.status === "done"
                  ? "Done"
                  : v.status === "error"
                    ? "Error"
                    : `${v.pct}%`}
              </div>
            </div>

            <div className="cf-rec__bar">
              <div
                className={`cf-rec__barFill ${
                  v.status === "error" ? "cf-rec__barFill--err" : ""
                }`}
                style={{
                  width: `${Math.min(Math.max(v.pct || 0, 0), 100)}%`,
                }}
              />
            </div>

            {v.status === "error" && (
              <div className="cf-rec__upErr">{v.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
