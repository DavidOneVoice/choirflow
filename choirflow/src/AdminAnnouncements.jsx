import { useEffect, useMemo, useState } from "react";
import { getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase/firebase";

function hasAdminAccess(userProfile, tokenClaims) {
  if (tokenClaims?.admin === true) return true;

  const role = userProfile?.role;
  if (typeof role === "string" && role.toLowerCase() === "admin") return true;

  if (userProfile?.isAdmin === true || userProfile?.admin === true) return true;

  const roles = userProfile?.roles;
  if (Array.isArray(roles)) {
    return roles.some((entry) => String(entry).toLowerCase() === "admin");
  }

  if (roles && typeof roles === "object") {
    return Object.entries(roles).some(
      ([key, value]) => key.toLowerCase() === "admin" && value === true,
    );
  }

  return false;
}

function buildPermissionErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Your account does not currently have announcement publish permissions in Firestore. Ask an administrator to add the admin role or custom admin claim for this account, then sign out and back in.";
  }

  return error?.message || "Unable to send announcement right now.";
}

export default function AdminAnnouncements({ user }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [adminStatus, setAdminStatus] = useState("checking");

  const trimmedTitle = useMemo(() => title.trim(), [title]);
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const canPublish = adminStatus === "allowed";
  const canSubmit =
    canPublish && !!trimmedTitle && !!trimmedMessage && !isSending;

  useEffect(() => {
    let isMounted = true;

    const resolveAdminAccess = async () => {
      if (!user?.uid) {
        if (isMounted) setAdminStatus("denied");
        return;
      }

      setAdminStatus("checking");

      try {
        const [tokenResult, userProfileSnap] = await Promise.all([
          getIdTokenResult(user),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const userProfile = userProfileSnap.exists()
          ? userProfileSnap.data()
          : null;
        const isAdmin = hasAdminAccess(userProfile, tokenResult.claims);

        if (!isMounted) return;

        setAdminStatus(isAdmin ? "allowed" : "denied");

        if (!isAdmin) {
          setFeedback({
            type: "error",
            text: "This signed-in account is missing the admin role required to publish announcements.",
          });
        }
      } catch (error) {
        console.error("Failed to resolve admin announcement access", error);

        if (!isMounted) return;

        setAdminStatus("error");
        setFeedback({
          type: "error",
          text: "We could not verify announcement permissions for this account. Please refresh and try again.",
        });
      }
    };

    resolveAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
        text: buildPermissionErrorMessage(error),
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
          <span className="admin-announcements__eyebrow">
            Global broadcasts
          </span>
          <h1>Send announcement</h1>
          <p className="muted admin-announcements__subtitle">
            Publish a polished, read-only announcement to every user in real
            time.
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
                if (feedback.text && adminStatus === "allowed") {
                  setFeedback({ type: "", text: "" });
                }
              }}
              placeholder="Sunday rehearsal update"
              disabled={!canPublish}
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
                if (feedback.text && adminStatus === "allowed") {
                  setFeedback({ type: "", text: "" });
                }
              }}
              placeholder="Share the latest update with everyone..."
              disabled={!canPublish}
            />
          </label>

          <div className="admin-announcements__actions">
            <button
              type="submit"
              className="btn primary admin-announcements__button"
              disabled={!canSubmit}
            >
              {isSending
                ? "Sending announcement..."
                : adminStatus === "checking"
                  ? "Checking permissions..."
                  : "Send announcement"}
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
