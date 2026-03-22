import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase";

export default function AdminAnnouncements({ user }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const trimmedTitle = useMemo(() => title.trim(), [title]);
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const canSubmit = !!user?.uid && !!trimmedTitle && !!trimmedMessage && !isSending;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSending(true);
    setFeedback({ type: "", text: "" });

    try {
      await addDoc(collection(db, "announcements"), {
        title: trimmedTitle,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isActive: true,
      });

      setTitle("");
      setMessage("");
      setFeedback({
        type: "success",
        text: "Announcement sent successfully. Everyone in chat will see it instantly.",
      });
    } catch (error) {
      console.error("Failed to create announcement", error);
      setFeedback({
        type: "error",
        text: error?.message || "Unable to send announcement right now.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!user?.uid) return null;

  return (
    <section className="admin-announcements-shell">
      <div className="card admin-announcements">
        <div className="admin-announcements__header">
          <span className="admin-announcements__eyebrow">Global broadcasts</span>
          <h1>Send announcement</h1>
          <p className="muted admin-announcements__subtitle">
            Publish a polished, read-only announcement to every user in real time.
          </p>
        </div>

        <form className="admin-announcements__form" onSubmit={handleSubmit}>
          <label className="admin-announcements__field">
            <span className="admin-announcements__label">Title</span>
            <input
              type="text"
              className="input admin-announcements__input"
              value={title}
              maxLength={120}
              onChange={(event) => {
                setTitle(event.target.value);
                if (feedback.text) setFeedback({ type: "", text: "" });
              }}
              placeholder="Sunday rehearsal update"
            />
          </label>

          <label className="admin-announcements__field">
            <span className="admin-announcements__label">Message</span>
            <textarea
              className="admin-announcements__textarea"
              rows={7}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (feedback.text) setFeedback({ type: "", text: "" });
              }}
              placeholder="Share the latest choir-wide update with everyone..."
            />
          </label>

          <div className="admin-announcements__actions">
            <button
              type="submit"
              className="btn primary admin-announcements__button"
              disabled={!canSubmit}
            >
              {isSending ? "Sending announcement..." : "Send announcement"}
            </button>
          </div>

          {feedback.text ? (
            <p
              className={`admin-announcements__feedback admin-announcements__feedback--${feedback.type || "info"}`}
              role="status"
            >
              {feedback.text}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
