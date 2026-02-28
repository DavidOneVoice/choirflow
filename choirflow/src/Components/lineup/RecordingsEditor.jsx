import { useLineupRecordings } from "../../hooks/useLineupRecordings";
import { useAudioUploader } from "../../hooks/useAudioUploader";
import UploadProgress from "./UploadProgress";
import RecordingList from "./RecordingList";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import "./RecordingsEditor.css";
export default function RecordingsEditor({ lineupId }) {
  const { recordings } = useLineupRecordings(lineupId);

  const {
    uploadProgress,
    uploadFiles,
    clearCompleted,
    deleteRecording,
    renameRecording,
  } = useAudioUploader(lineupId);

  const handlePickFiles = (e) => {
    uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleStop = async () => {
    const file = await stop();
    if (file) await uploadFiles([file]);
  };

  return (
    <div className="cf-rec">
      <div className="cf-rec__top">
        {/* Hidden native input */}
        <input
          id="cf-rec-file"
          className="cf-rec__fileInput"
          type="file"
          accept="audio/*"
          multiple
          onChange={handlePickFiles}
        />

        {/* Styled trigger */}
        <label htmlFor="cf-rec-file" className="cf-rec__fileBtn">
          <span className="cf-rec__fileIcon">🎵</span>
          <span>Add audio files</span>
        </label>
      </div>

      <div className="cf-rec__section">
        <UploadProgress
          uploadProgress={uploadProgress}
          onClearCompleted={clearCompleted}
          wrapperClassName="cf-rec__progress"
        />
      </div>

      <div className="cf-rec__section">
        <RecordingList
          recordings={recordings}
          onDelete={deleteRecording}
          onRename={renameRecording}
        />
      </div>
    </div>
  );
}
