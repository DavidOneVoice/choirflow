import { useLineupRecordings } from "../../hooks/useLineupRecordings";
import { useAudioUploader } from "../../hooks/useAudioUploader";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import UploadProgress from "./UploadProgress";
import RecordingList from "./RecordingList";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import "./RecordingsEditor.css";
export default function RecordingsEditor({ lineupId }) {
  const { recordings } = useLineupRecordings(lineupId);

  const {
    uploading,
    uploadProgress,
    uploadFiles,
    clearCompleted,
    deleteRecording,
    renameRecording,
  } = useAudioUploader(lineupId);

  const { recording, recordError, start, stop } = useVoiceRecorder();

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

        {/* Record button */}
        {!recording ? (
          <button
            className="cf-rec__micBtn"
            onClick={start}
            type="button"
            title="Record"
          >
            <MicIcon />
          </button>
        ) : (
          <button
            className="cf-rec__micBtn cf-rec__micBtn--stop"
            onClick={handleStop}
            type="button"
            title="Stop recording"
          >
            <MicOffIcon />
          </button>
        )}
      </div>

      {recordError && <p className="cf-rec__error">{recordError}</p>}

      <div className="cf-rec__section">
        <UploadProgress
          uploadProgress={uploadProgress}
          onClearCompleted={clearCompleted}
          wrapperClassName="cf-rec__progress" // only if your component supports it
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
