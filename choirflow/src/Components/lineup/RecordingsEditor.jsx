import { useLineupRecordings } from "../../hooks/useLineupRecordings";
import { useAudioUploader } from "../../hooks/useAudioUploader";
import UploadProgress from "./UploadProgress";
import RecordingList from "./RecordingList";
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
    const files = e.target.files;
    if (files && files.length > 0) uploadFiles(files);
    e.target.value = ""; // allow picking same file again
  };

  return (
    <div className="cf-recEd">
      <div className="cf-recEd__top">
        {/* Hidden native input */}
        <input
          id="cf-recEd-file"
          className="cf-recEd__fileInput"
          type="file"
          accept="audio/*"
          multiple
          onChange={handlePickFiles}
        />

        {/* Styled trigger */}
        <label htmlFor="cf-recEd-file" className="cf-recEd__fileBtn">
          <span className="cf-recEd__fileIcon">🎵</span>
          <span>Add audio files</span>
        </label>
      </div>

      <div className="cf-recEd__section">
        <UploadProgress
          uploadProgress={uploadProgress}
          onClearCompleted={clearCompleted}
          className="cf-recEd__progress"
        />
      </div>

      <div className="cf-recEd__section">
        <RecordingList
          recordings={recordings}
          onDelete={deleteRecording}
          onRename={renameRecording}
        />
      </div>
    </div>
  );
}
