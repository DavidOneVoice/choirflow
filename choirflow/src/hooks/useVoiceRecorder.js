import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setRecordError("");
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      const mr = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 48000,
      });

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      setRecordError(
        "Mic access denied or not available on this device/browser.",
      );
    }
  };

  // returns File|null
  const stop = async () => {
    if (!mediaRecorderRef.current) return null;

    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;

      mr.onstop = () => {
        try {
          const mime = mr.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mime });

          // stop mic tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }

          const ext = mime.includes("mp4") ? "m4a" : "webm";
          const fileName = `VoiceNote_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.${ext}`;

          const file = new File([blob], fileName, { type: blob.type || mime });

          setRecording(false);
          resolve(file);
        } catch (e) {
          setRecording(false);
          resolve(null);
        }
      };

      mr.stop();
    });
  };

  return { recording, recordError, start, stop };
}
