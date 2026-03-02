import DeleteIcon from "@mui/icons-material/Delete";
import "../styles/components/song-item.css";

export default function SongItem({
  song,
  onEdit,
  onDelete,
  showActions = true,
}) {
  return (
    <div className="cf-songItem">
      <div className="cf-songItem__main">
        <div className="cf-songItem__text">
          <h3 className="cf-songItem__title">{song.title}</h3>

          <p className="cf-songItem__meta">
            <span className="cf-songItem__key">{song.key}</span>
            {song.tier && (
              <span className="cf-songItem__tier">Tier {song.tier}</span>
            )}
          </p>

          <p className="cf-songItem__category">{song.category}</p>
        </div>
      </div>

      {showActions && (
        <div className="cf-songItem__actions">
          <button
            className="btn small cf-songItem__editBtn"
            onClick={() => onEdit(song)}
          >
            Edit
          </button>

          <button
            className="btn small danger cf-songItem__delBtn"
            onClick={() => onDelete(song.id)}
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      )}
    </div>
  );
}
