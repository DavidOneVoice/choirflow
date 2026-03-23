import { useEffect, useMemo, useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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

  return error?.message || "Unable to save announcement changes right now.";
}

export default function AdminAnnouncements({ user }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [adminStatus, setAdminStatus] = useState("checking");
  const [announcements, setAnnouncements] = useState([]);
  const [listError, setListError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const trimmedTitle = useMemo(() => title.trim(), [title]);
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const trimmedEditTitle = useMemo(() => editTitle.trim(), [editTitle]);
  const trimmedEditMessage = useMemo(() => editMessage.trim(), [editMessage]);
  const canPublish = adminStatus === "allowed";
  const canSubmit = canPublish && !!trimmedTitle && !!trimmedMessage && !isSending;

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

        const userProfile = userProfileSnap.exists() ? userProfileSnap.data() : null;
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

  useEffect(() => {
    if (!user?.uid || adminStatus !== "allowed") {
      setAnnouncements([]);
      setListError("");
      return undefined;
    }

    const announcementsQuery = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        setAnnouncements(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );
        setListError("");
      },
      (error) => {
        console.error("Failed to load admin announcements", error);
        setListError(buildPermissionErrorMessage(error));
      },
    );

    return () => unsubscribe();
  }, [adminStatus, user?.uid]);

  const resetEditor = () => {
    setEditingId("");
    setEditTitle("");
    setEditMessage("");
    setBusyId("");
  };

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
        updatedAt: serverTimestamp(),
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

  const startEditing = (announcement) => {
    setEditingId(announcement.id);
    setEditTitle(announcement.title || "");
    setEditMessage(announcement.message || "");
    setFeedback({ type: "", text: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !trimmedEditTitle || !trimmedEditMessage) return;

    setBusyId(editingId);
    setFeedback({ type: "", text: "" });

    try {
      await updateDoc(doc(db, "announcements", editingId), {
        title: trimmedEditTitle,
        message: trimmedEditMessage,
        updatedAt: serverTimestamp(),
      });

      resetEditor();
      setFeedback({
        type: "success",
        text: "Announcement updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update announcement", error);
      setBusyId("");
      setFeedback({
        type: "error",
        text: buildPermissionErrorMessage(error),
      });
    }
  };

  const handleDelete = async (announcementId) => {
    setBusyId(announcementId);
    setFeedback({ type: "", text: "" });

    try {
      await deleteDoc(doc(db, "announcements", announcementId));
      if (editingId === announcementId) {
        resetEditor();
      } else {
        setBusyId("");
      }
      setFeedback({
        type: "success",
        text: "Announcement deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete announcement", error);
      setBusyId("");
      setFeedback({
        type: "error",
        text: buildPermissionErrorMessage(error),
      });
    }
  };

  if (!user?.uid) return null;

  return (
    <section className="admin-announcements-shell">
      <div className="card admin-announcements">
        <div className="admin-announcements__header">
          <span className="admin-announcements__eyebrow">Choir Flow broadcasts</span>
          <h1>Manage announcements</h1>
          <p className="muted admin-announcements__subtitle">
            Create, review, edit, and remove choir-wide announcements from one dashboard.
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
              placeholder="Share the latest choir-wide update with everyone..."
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

        <section className="admin-announcements__history">
          <div className="admin-announcements__historyHeader">
            <h2>Published announcements</h2>
            <span>{announcements.length} total</span>
          </div>

          {listError ? <p className="admin-announcements__empty">{listError}</p> : null}
          {!listError && !announcements.length ? (
            <p className="admin-announcements__empty">No announcements have been created yet.</p>
          ) : null}

          {!listError && announcements.length ? (
            <div className="admin-announcements__list">
              {announcements.map((announcement) => {
                const isEditing = editingId === announcement.id;
                const isBusy = busyId === announcement.id;

                return (
                  <article key={announcement.id} className="admin-announcements__item">
                    <div className="admin-announcements__itemHeader">
                      <div>
                        <p className="admin-announcements__itemMeta">
                          {announcement.createdAt?.toDate
                            ? announcement.createdAt.toDate().toLocaleString()
                            : "Saving..."}
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            className="input admin-announcements__input"
                            value={editTitle}
                            maxLength={120}
                            onChange={(event) => setEditTitle(event.target.value)}
                            disabled={isBusy}
                          />
                        ) : (
                          <h3>{announcement.title}</h3>
                        )}
                      </div>

                      <div className="admin-announcements__itemActions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="admin-announcements__iconButton"
                              onClick={handleSaveEdit}
                              disabled={!trimmedEditTitle || !trimmedEditMessage || isBusy}
                              aria-label="Save announcement"
                            >
                              <SaveOutlinedIcon fontSize="small" />
                            </button>
                            <button
                              type="button"
                              className="admin-announcements__iconButton"
                              onClick={resetEditor}
                              disabled={isBusy}
                              aria-label="Cancel editing"
                            >
                              <CloseOutlinedIcon fontSize="small" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-announcements__iconButton"
                              onClick={() => startEditing(announcement)}
                              disabled={!!busyId}
                              aria-label="Edit announcement"
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </button>
                            <button
                              type="button"
                              className="admin-announcements__iconButton admin-announcements__iconButton--danger"
                              onClick={() => handleDelete(announcement.id)}
                              disabled={!!busyId}
                              aria-label="Delete announcement"
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        className="admin-announcements__textarea admin-announcements__textarea--compact"
                        rows={4}
                        value={editMessage}
                        onChange={(event) => setEditMessage(event.target.value)}
                        disabled={isBusy}
                      />
                    ) : (
                      <p className="admin-announcements__itemBody">{announcement.message}</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
