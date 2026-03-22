import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase";

export const ADMIN_UID = "REPLACE_WITH_ADMIN_UID";

export default function AdminAnnouncements({ user }) {
  const [announcement, setAnnouncement] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isAdmin = user?.uid === ADMIN_UID;
  const trimmedAnnouncement = useMemo(() => announcement.trim(), [announcement]);

  const sendBroadcastMessage = async (text) => {
    const nextText = text.trim();
    if (!nextText) {
      throw new Error("Announcement text is required.");
    }

    await addDoc(collection(db, "chats", "broadcast_global", "messages"), {
      text: nextText,
      senderId: "system",
      createdAt: serverTimestamp(),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!trimmedAnnouncement || isSending) return;

    setIsSending(true);
    setFeedback("");

    try {
      await sendBroadcastMessage(trimmedAnnouncement);
      setAnnouncement("");
      setFeedback("Announcement sent.");
    } catch (error) {
      console.error("Failed to send announcement", error);
      setFeedback(error?.message || "Unable to send announcement right now.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="card admin-announcements admin-announcements--denied">
        <h1>Send Announcement</h1>
        <p>Access denied</p>
      </section>
    );
  }

  return (
    <section className="card admin-announcements">
      <div className="admin-announcements__header">
        <h1>Send Announcement</h1>
        <p className="muted">Broadcast a message to the global announcements channel.</p>
      </div>

      <form className="admin-announcements__form" onSubmit={handleSubmit}>
        <label className="admin-announcements__label" htmlFor="announcement-text">
          Message
        </label>
        <textarea
          id="announcement-text"
          className="admin-announcements__textarea"
          rows={7}
          value={announcement}
          onChange={(event) => {
            setAnnouncement(event.target.value);
            if (feedback) setFeedback("");
          }}
          placeholder="Type an announcement to send to everyone..."
        />

        <button
          type="submit"
          className="admin-announcements__button"
          disabled={!trimmedAnnouncement || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>

        {feedback ? <p className="admin-announcements__feedback">{feedback}</p> : null}
      </form>
    </section>
  );
}
