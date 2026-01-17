import DeleteIcon from "@mui/icons-material/Delete";

export default function SongItem({
  song,
  onEdit,
  onDelete,
  showActions = true,
}) {
  return (
    <div
      style={{
        padding: "10px 0",
        borderTop: "2px solid #eee",
        marginBottom: 10,
      }}
    >
      <h3>{song.title}</h3>

      <p className="muted" style={{ fontSize: ".9rem" }}>
        Key: {song.key}
        {song.tier && <> • Tier {song.tier}</>}
        <br />
        {song.category}
      </p>

      {showActions && (
        <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
          <button className="btn small" onClick={() => onEdit(song)}>
            Edit
          </button>

          <button
            className="btn small danger"
            onClick={() => onDelete(song.id)}
          >
            <DeleteIcon />
          </button>
        </div>
      )}
    </div>
  );
}
