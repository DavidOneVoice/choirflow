import { useRef, useState } from "react";

function pickBestMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4", // many Android WebViews support this
    "audio/aac",
    "audio/3gpp", // older Android fallback
  ];

  const isSupported = (t) =>
    typeof window !== "undefined" &&
    window.MediaRecorder &&
    typeof window.MediaRecorder.isTypeSupported === "function" &&
    window.MediaRecorder.isTypeSupported(t);

  const chosen = candidates.find(isSupported);
  return chosen || ""; // empty = let browser choose
}

function extFromMime(mime) {
  const m = (mime || "").toLowerCase();
  if (m.includes("mp4")) return "m4a";
  if (m.includes("aac")) return "aac";
  if (m.includes("3gpp")) return "3gp";
  if (m.includes("webm")) return "webm";
  return "webm";
}

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
      if (!navigator?.mediaDevices?.getUserMedia) {
        setRecordError("Recording not supported on this device/browser.");
        return;
      }
      if (!window.MediaRecorder) {
        setRecordError("Recording not supported on this device/browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const picked = pickBestMimeType();

      // Try with options first, then fallback to default
      let mr;
      try {
        const opts = {};
        if (picked) opts.mimeType = picked;

        // compression hint (some browsers ignore)
        opts.audioBitsPerSecond = 48000;

        mr = new MediaRecorder(stream, opts);
      } catch (e) {
        // last resort: no options
        mr = new MediaRecorder(stream);
      }

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onerror = () => {
        setRecordError("Recording failed on this device.");
        setRecording(false);
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

          const ext = extFromMime(mime);
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

      try {
        mr.stop();
      } catch (e) {
        setRecording(false);
        resolve(null);
      }
    });
  };

  return { recording, recordError, start, stop };
}
