import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { uploadAudioToCloudinary } from "../lib/cloudinaryUpload";

function makeFileKey(file) {
  // deterministic key: prevents duplicate 0% entries
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function getAudioDurationFromFile(file) {
  return new Promise((resolve) => {
    try {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve(duration || 0);
      };

      audio.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export function useAudioUploader(lineupId) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const MAX_FILE_MB = 10;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const uploadOne = async (file) => {
    const key = makeFileKey(file);

    // type check
    if (!(file.type || "").startsWith("audio/")) {
      setUploadProgress((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          pct: 0,
          status: "error",
          error: "Not an audio file",
        },
      }));
      return;
    }

    // size limit
    if (file.size > MAX_FILE_BYTES) {
      setUploadProgress((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          pct: 0,
          status: "error",
          error: `File too large. Max ${MAX_FILE_MB}MB`,
        },
      }));
      return;
    }

    setUploadProgress((prev) => ({
      ...prev,
      [key]: { name: file.name, pct: 0, status: "uploading" },
    }));

    try {
      // Duration (optional but good UX)
      const durationSeconds = await getAudioDurationFromFile(file);

      // Upload to Cloudinary
      const data = await uploadAudioToCloudinary(file); // returns secure_url, public_id, bytes...

      // Save metadata in Firestore
      await addDoc(
        collection(
          db,
          "users",
          auth.currentUser.uid,
          "lineups",
          lineupId,
          "recordings",
        ),
        {
          name: file.name,
          type: file.type || "audio/*",
          size: file.size,
          durationSeconds,
          url: data.secure_url,
          publicId: data.public_id,
          createdAt: serverTimestamp(),
        },
      );

      setUploadProgress((prev) => ({
        ...prev,
        [key]: { name: file.name, pct: 100, status: "done" },
      }));
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setUploadProgress((prev) => ({
        ...prev,
        [key]: { name: file.name, pct: 0, status: "error", error: err.message },
      }));
    }
  };

  const uploadFiles = async (fileList) => {
    if (!auth.currentUser) return alert("Not logged in");
    if (!lineupId) return alert("Missing lineup id");

    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const audioFiles = files.filter((f) => (f.type || "").startsWith("audio/"));
    if (audioFiles.length === 0)
      return alert("Please select audio files only.");

    setUploading(true);

    // init queue (no duplicates because key is deterministic)
    const init = {};
    audioFiles.forEach((f) => {
      init[makeFileKey(f)] = { name: f.name, pct: 0, status: "queued" };
    });
    setUploadProgress((prev) => ({ ...prev, ...init }));

    // Sequential upload is safer for phones + many users
    for (const f of audioFiles) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(f);
    }

    setUploading(false);
  };

  const clearCompleted = () => {
    setUploadProgress((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v.status !== "done") next[k] = v;
      }
      return next;
    });
  };

  // IMPORTANT: with unsigned Cloudinary uploads, deleting from Cloudinary requires server-side signature.
  // So we delete from Firestore (removes from UI). Later we’ll add a cloud function to delete in Cloudinary too.
  const deleteRecording = async (rec) => {
    if (!auth.currentUser) return alert("Not logged in");
    if (!window.confirm("Delete this recording?")) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "lineups",
          lineupId,
          "recordings",
          rec.id,
        ),
      );
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const renameRecording = async (recId, newName) => {
    if (!auth.currentUser) return alert("Not logged in");
    if (!lineupId) return alert("Missing lineup id");

    const name = (newName || "").trim();
    if (!name) return alert("Name cannot be empty");

    try {
      await updateDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "lineups",
          lineupId,
          "recordings",
          recId,
        ),
        { name },
      );
    } catch (err) {
      alert("Rename failed: " + err.message);
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadFiles,
    clearCompleted,
    deleteRecording,
    renameRecording,
  };
}
