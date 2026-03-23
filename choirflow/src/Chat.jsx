import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
  endAt,
  updateDoc,
  where,
  increment,
} from "firebase/firestore";
import { db } from "./firebase/firebase";
import { deriveUsername } from "./utils/userProfile";

const CHAT_FILTERS = {
  all: "all",
  unread: "unread",
};

const ANNOUNCEMENTS_CHAT_ID = "announcements-feed";
const SEARCH_DEBOUNCE_MS = 220;

function getDisplayName(profile) {
  return profile?.username || profile?.email || "Unknown user";
}

function getAvatarLabel(profile) {
  const label = getDisplayName(profile);
  const parts = label.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

function buildChatId(userA, userB) {
  return [userA, userB].sort().join("__");
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp
    .toDate()
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(timestamp) {
  if (!timestamp?.toDate) return "Offline";
  const date = timestamp.toDate();
  return `Last seen ${date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getMessageDateLabel(timestamp) {
  if (!timestamp?.toDate) return "";

  const date = timestamp.toDate();
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / msPerDay,
  );

  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function formatAnnouncementDate(timestamp) {
  if (!timestamp?.toDate) return "";

  const date = timestamp.toDate();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / msPerDay,
  );

  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getConversationSortTime(item) {
  return (
    item?.latestMessage?.createdAt?.toMillis?.() ||
    item?.updatedAt?.toMillis?.() ||
    0
  );
}

function formatConversationTimestamp(timestamp) {
  if (!timestamp?.toDate) return "";

  const date = timestamp.toDate();
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function Chat({ user, routeTarget, onClearRouteTarget }) {
  const [searchText, setSearchText] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [activeFilter, setActiveFilter] = useState(CHAT_FILTERS.all);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [userLoadError, setUserLoadError] = useState("");
  const [chatLoadError, setChatLoadError] = useState("");
  const [messageLoadError, setMessageLoadError] = useState("");
  const [composeError, setComposeError] = useState("");
  const [showLineupModal, setShowLineupModal] = useState(false);
  const messagesEndRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const announcementsChat = useMemo(() => {
    if (!announcements.length) return null;

    const latestAnnouncement = announcements[0];

    return {
      id: ANNOUNCEMENTS_CHAT_ID,
      type: "announcement",
      unreadCount: 0,
      profile: {
        uid: ANNOUNCEMENTS_CHAT_ID,
        username: "Choir Flow",
        email: "",
        isOnline: true,
      },
      updatedAt: latestAnnouncement.createdAt || null,
      latestMessage: {
        text: latestAnnouncement.message,
        createdAt: latestAnnouncement.createdAt || null,
      },
    };
  }, [announcements]);

  const sortedChatList = useMemo(() => {
    return [...chatList].sort(
      (left, right) =>
        getConversationSortTime(right) - getConversationSortTime(left),
    );
  }, [chatList]);

  const filteredChats = useMemo(() => {
    const items =
      announcementsChat && activeFilter === CHAT_FILTERS.all
        ? [announcementsChat, ...sortedChatList]
        : sortedChatList;

    if (activeFilter === CHAT_FILTERS.unread) {
      return items.filter((item) => item.unreadCount > 0);
    }
    return items;
  }, [activeFilter, announcementsChat, sortedChatList]);

  const showSearchResults =
    isSearchActive || (!!searchText.trim() && searchText.trim().length >= 2);

  useEffect(() => {
    const announcementsQuery = query(
      collection(db, "announcements"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setAnnouncements(entries);
      },
      (error) => {
        console.error("Failed to load announcements", error);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((item) => {
          const data = item.data();
          const otherParticipantId = (data.participants || []).find(
            (id) => id !== user.uid,
          );
          const profile =
            data.participantProfiles?.[otherParticipantId] || null;
          const unreadCount = Number(data.unreadCounts?.[user.uid] || 0);

          return {
            id: item.id,
            unreadCount,
            profile,
            participants: data.participants || [],
            updatedAt: data.updatedAt,
            latestMessage: data.latestMessage || null,
          };
        });

        setChatLoadError("");
        setChatList(docs);
      },
      (error) => {
        if (error?.code === "permission-denied") {
          setChatLoadError(
            "Chat access is blocked by Firestore rules for this account.",
          );
          return;
        }

        if (error?.code === "failed-precondition") {
          setChatLoadError(
            "Chats need a Firestore index before they can load.",
          );
          return;
        }

        setChatLoadError("Unable to load chats right now. Please try again.");
        console.error("Failed to load chats", error);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!activeChat?.id || activeChat.id === ANNOUNCEMENTS_CHAT_ID) {
      setMessages([]);
      setMessageLoadError("");
      return;
    }

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setMessageLoadError("");
        setMessages(entries);
      },
      (error) => {
        if (error?.code === "permission-denied") {
          setMessageLoadError(
            "Message history is blocked by Firestore rules for this conversation.",
          );
          return;
        }

        setMessageLoadError(
          "Unable to load messages right now. Please try again.",
        );
        console.error("Failed to load messages", error);
      },
    );

    return () => unsubscribe();
  }, [activeChat?.id]);

  useEffect(() => {
    if (
      !activeChat?.id ||
      activeChat.id === ANNOUNCEMENTS_CHAT_ID ||
      !messages.length ||
      !user?.uid
    )
      return;

    const unreadIncoming = messages.filter(
      (message) =>
        message.senderId !== user.uid &&
        !(message.readBy || []).includes(user.uid),
    );

    if (!unreadIncoming.length) return;

    const markAsRead = async () => {
      try {
        await Promise.all(
          unreadIncoming.map((message) =>
            updateDoc(doc(db, "chats", activeChat.id, "messages", message.id), {
              readBy: arrayUnion(user.uid),
            }),
          ),
        );

        await updateDoc(doc(db, "chats", activeChat.id), {
          [`unreadCounts.${user.uid}`]: 0,
          "latestMessage.readBy": arrayUnion(user.uid),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to mark messages as read", error);
      }
    };

    markAsRead();
  }, [activeChat?.id, messages, user?.uid]);

  useEffect(() => {
    if (!activeChat?.id) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, activeChat?.id]);

  useEffect(() => {
    if (!activeChat?.id || activeChat.id === ANNOUNCEMENTS_CHAT_ID) return;

    const targetId = activeChat?.profile?.uid;
    if (!targetId) return;

    const unsubscribe = onSnapshot(doc(db, "users", targetId), (snapshot) => {
      if (!snapshot.exists()) return;
      const peer = snapshot.data();
      setActiveChat((prev) =>
        !prev
          ? prev
          : {
              ...prev,
              profile: {
                ...prev.profile,
                uid: targetId,
                username: peer.username || prev.profile?.username,
                email: peer.email || prev.profile?.email,
                isOnline: !!peer.isOnline,
                lastSeenAt: peer.lastSeenAt || prev.profile?.lastSeenAt || null,
              },
            },
      );
    });

    return () => unsubscribe();
  }, [activeChat?.id, activeChat?.profile?.uid]);

  const openConversation = useCallback((chat) => {
    setActiveChat({ id: chat.id, profile: chat.profile });
  }, []);

  useEffect(() => {
    if (!routeTarget?.chatId) return;

    const matching = chatList.find((item) => item.id === routeTarget.chatId);
    if (matching) {
      openConversation(matching);
      onClearRouteTarget?.();
      return;
    }

    if (routeTarget.profile) {
      openConversation({
        id: routeTarget.chatId,
        profile: routeTarget.profile,
      });
      onClearRouteTarget?.();
    }
  }, [chatList, routeTarget, onClearRouteTarget, openConversation]);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId) return;

    const latest = chatList.find((item) => item.id === chatId);
    if (!latest?.profile) return;

    setActiveChat((prev) =>
      prev
        ? { ...prev, profile: { ...prev.profile, ...latest.profile } }
        : prev,
    );
  }, [chatList, activeChat?.id]);

  const loadUsers = async (term = "") => {
    const normalized = term.trim().toLowerCase();
    if (normalized.length < 2) {
      setAllUsers([]);
      setUserLoadError("");
      return;
    }

    setLoadingUsers(true);
    setUserLoadError("");

    try {
      const usersRef = collection(db, "users");

      const [usernameResults, emailResults] = await Promise.all([
        getDocs(
          query(
            usersRef,
            orderBy("usernameLower"),
            startAt(normalized),
            endAt(normalized + "\uf8ff"),
            limit(8),
          ),
        ),
        getDocs(
          query(
            usersRef,
            orderBy("emailPrefix"),
            startAt(normalized),
            endAt(normalized + "\uf8ff"),
            limit(8),
          ),
        ),
      ]);

      const merged = new Map();
      [...usernameResults.docs, ...emailResults.docs].forEach((item) => {
        merged.set(item.id, { uid: item.id, ...item.data() });
      });

      setAllUsers(Array.from(merged.values()).slice(0, 8));
    } catch (error) {
      if (error?.code === "permission-denied") {
        setUserLoadError(
          "User directory is blocked by Firestore rules. Please contact support.",
        );
      } else if (error?.code === "failed-precondition") {
        setUserLoadError(
          "Search needs a Firestore index to run. Please contact support.",
        );
      } else {
        setUserLoadError("Unable to load users right now. Please try again.");
      }
      console.error("Failed to load user directory", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const searchResults = useMemo(() => {
    const candidates = allUsers.filter((person) => person.uid !== user.uid);
    return candidates.slice(0, 8);
  }, [allUsers, user.uid]);

  const openChatWithUser = async (targetUser) => {
    try {
      const chatId = buildChatId(user.uid, targetUser.uid);
      const chatRef = doc(db, "chats", chatId);

      const myUsername = deriveUsername({
        displayName: user.displayName,
        storedUsername: localStorage.getItem("choirflow_username") || "",
        email: user.email,
      });

      const me = {
        uid: user.uid,
        email: user.email || "",
        username: myUsername,
        isOnline: true,
      };

      const peer = {
        uid: targetUser.uid,
        email: targetUser.email || "",
        username: targetUser.username || targetUser.email || "Unknown",
        isOnline: !!targetUser.isOnline,
        lastSeenAt: targetUser.lastSeenAt || null,
      };

      await setDoc(
        chatRef,
        {
          participants: [user.uid, targetUser.uid],
          participantProfiles: {
            [user.uid]: me,
            [targetUser.uid]: peer,
          },
          unreadCounts: {
            [user.uid]: 0,
            [targetUser.uid]: 0,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setActiveChat({ id: chatId, profile: peer });
      setSearchText("");
      setAllUsers([]);
      setIsSearchActive(false);
      setComposeError("");
    } catch (error) {
      console.error("Failed to open chat", error);
      setComposeError("Unable to open chat right now. Please try again.");
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();

    if (!activeChat?.id) {
      setComposeError("Open a conversation before sending a message.");
      return;
    }

    if (!text) {
      setComposeError("Message cannot be blank.");
      return;
    }

    const recipientId = activeChat.profile?.uid;
    if (!recipientId) {
      setComposeError("Unable to identify the recipient for this chat.");
      return;
    }

    const message = {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
    };

    try {
      await addDoc(collection(db, "chats", activeChat.id, "messages"), message);

      await updateDoc(doc(db, "chats", activeChat.id), {
        latestMessage: {
          text,
          senderId: user.uid,
          createdAt: serverTimestamp(),
          readBy: [user.uid],
        },
        [`unreadCounts.${user.uid}`]: 0,
        [`unreadCounts.${recipientId}`]: increment(1),
        updatedAt: serverTimestamp(),
      });

      setDraft("");
      setComposeError("");
    } catch (error) {
      console.error("Failed to send message", error);
      setComposeError("Unable to send message right now. Please try again.");
    }
  };

  const closeActiveChat = () => {
    setActiveChat(null);
    setMessages([]);
    setComposeError("");
  };

  const messageItems = useMemo(() => {
    let previousDateLabel = "";

    return messages.map((message) => {
      const dateLabel = getMessageDateLabel(message.createdAt);
      const showDateDivider = dateLabel && dateLabel !== previousDateLabel;
      previousDateLabel = dateLabel || previousDateLabel;

      return {
        ...message,
        dateLabel,
        showDateDivider,
      };
    });
  }, [messages]);

  const isChatOpen = !!activeChat;
  const isAnnouncementChat = activeChat?.id === ANNOUNCEMENTS_CHAT_ID;

  return (
    <div className="chat-page">
      <div className={`chat-layout ${isChatOpen ? "is-chatOpen" : ""}`}>
        {!isChatOpen && (
          <aside className="chat-sidebar">
            <div className="chat-sidebarHeader">
              <span className="chat-eyebrow">Messages</span>
              <h2 className="chat-sidebarTitle">Conversations</h2>
              <p className="chat-sidebarSubtitle">
                Search, manage, and respond with a clean WhatsApp-inspired
                workspace.
              </p>
            </div>
            <div className="chat-searchBar">
              <SearchIcon />
              <input
                className="input chat-searchInput"
                placeholder="Search users (min. 2 letters)"
                value={searchText}
                autoComplete="off"
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchText(value);

                  window.clearTimeout(searchDebounceRef.current);
                  searchDebounceRef.current = window.setTimeout(() => {
                    loadUsers(value);
                  }, SEARCH_DEBOUNCE_MS);
                }}
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => {
                  window.setTimeout(() => setIsSearchActive(false), 220);
                }}
              />
            </div>

            {showSearchResults && (
              <div className="chat-searchResults">
                {searchText.trim().length < 2 && (
                  <p className="muted">Type at least 2 letters to search.</p>
                )}
                {loadingUsers && <p className="muted">Loading users…</p>}
                {!!userLoadError && <p className="muted">{userLoadError}</p>}
                {!loadingUsers &&
                  !userLoadError &&
                  searchText.trim().length >= 2 &&
                  !searchResults.length && (
                    <p className="muted">No users found.</p>
                  )}

                {searchResults.map((person) => (
                  <button
                    key={person.uid}
                    type="button"
                    className="chat-searchItem"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openChatWithUser(person)}
                  >
                    <div className="chat-avatar" aria-hidden="true">
                      {getAvatarLabel(person)}
                    </div>
                    <div className="chat-searchMeta">
                      <div className="chat-searchRow">
                        <span className="chat-userName">
                          {getDisplayName(person)}
                        </span>
                        <span
                          className={`chat-searchDetail ${person.isOnline ? "is-online" : ""}`}
                        >
                          {person.isOnline
                            ? "Online"
                            : formatLastSeen(person.lastSeenAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-filters">
              <button
                type="button"
                className={`chat-filterBtn ${
                  activeFilter === CHAT_FILTERS.all ? "is-active" : ""
                }`}
                onClick={() => setActiveFilter(CHAT_FILTERS.all)}
              >
                All Messages
              </button>

              <button
                type="button"
                className={`chat-filterBtn ${
                  activeFilter === CHAT_FILTERS.unread ? "is-active" : ""
                }`}
                onClick={() => setActiveFilter(CHAT_FILTERS.unread)}
              >
                Unread
              </button>
            </div>

            <section className="chat-conversationList">
              {!!chatLoadError && <p className="muted">{chatLoadError}</p>}

              {filteredChats.length === 0 && (
                <p className="muted chat-emptyConversation">
                  No conversations yet. Search for a user above.
                </p>
              )}

              {filteredChats.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chat-conversationItem ${
                    activeChat?.id === item.id ? "is-active" : ""
                  }`}
                  onClick={() => openConversation(item)}
                >
                  <div className="chat-avatar" aria-hidden="true">
                    {getAvatarLabel(item.profile)}
                  </div>

                  <div className="chat-conversationBody">
                    <div className="chat-userRow">
                      <p className="chat-userName">
                        {item.type === "announcement"
                          ? "Choir Flow"
                          : getDisplayName(item.profile)}
                      </p>
                      <span
                        className={`chat-userStatus ${item.profile?.isOnline ? "is-online" : ""}`}
                      >
                        {item.type === "announcement"
                          ? "CF"
                          : item.profile?.isOnline
                            ? "Online"
                            : "Offline"}
                      </span>
                    </div>

                    <p className="chat-preview">
                      {item.latestMessage?.text || "Start chatting"}
                    </p>
                  </div>

                  <div className="chat-conversationMeta">
                    <span className="chat-conversationTime">
                      {formatConversationTimestamp(
                        item.latestMessage?.createdAt || item.updatedAt,
                      )}
                    </span>

                    {item.unreadCount > 0 && (
                      <span
                        className="chat-unreadBadge"
                        aria-label={`${item.unreadCount} unread`}
                      >
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </section>
          </aside>
        )}

        <section className="chat-messagesPane">
          {!activeChat && (
            <div className="chat-paneEmpty">
              <div className="chat-emptyState">
                <div className="chat-emptyIcon" aria-hidden="true">
                  <ForumOutlinedIcon fontSize="large" />
                </div>
                <h3>Your inbox, refined.</h3>
                <p className="muted chat-emptyHint">
                  Select a conversation from the left, or search for a choir
                  member above to begin a polished, distraction-free chat.
                </p>
              </div>
            </div>
          )}

          {activeChat && (
            <>
              <div className="chat-paneHeader">
                <div className="chat-paneTitleRow">
                  <button
                    type="button"
                    className="chat-backBtn"
                    onClick={closeActiveChat}
                    aria-label="Back to conversations"
                  >
                    <KeyboardBackspaceIcon />
                  </button>
                  <div className="chat-avatar" aria-hidden="true">
                    {getAvatarLabel(activeChat.profile)}
                  </div>
                  <h3 className="chat-paneTitle">
                    {isAnnouncementChat
                      ? "Choir Flow"
                      : getDisplayName(activeChat.profile)}
                  </h3>
                </div>
                <div className="chat-panePresence">
                  <span
                    className={`chat-statusDot ${activeChat.profile?.isOnline ? "is-online" : ""}`}
                    aria-hidden="true"
                  />
                  <p className="chat-userStatus">
                    {isAnnouncementChat
                      ? "CF"
                      : activeChat.profile?.isOnline
                        ? "Online"
                        : formatLastSeen(activeChat.profile?.lastSeenAt)}
                  </p>
                </div>
              </div>

              <div className="chat-messagesList">
                {isAnnouncementChat &&
                  announcements.map((announcement) => (
                    <article
                      key={announcement.id}
                      className="announcement-card"
                    >
                      <div className="announcement-card__meta">CF</div>
                      <h4>{announcement.title}</h4>
                      <p>{announcement.message}</p>
                      <span>
                        {formatAnnouncementDate(announcement.createdAt)}
                      </span>
                    </article>
                  ))}
                {!!messageLoadError && (
                  <p className="muted">{messageLoadError}</p>
                )}
                {!isAnnouncementChat && messages.length === 0 && (
                  <p className="muted">No messages yet.</p>
                )}
                {!isAnnouncementChat &&
                  messageItems.map((message) => (
                    <div key={message.id}>
                      {message.showDateDivider && (
                        <div className="chat-dateDivider">
                          {message.dateLabel}
                        </div>
                      )}

                      <div
                        className={`chat-messageGroup ${
                          message.senderId === user.uid ? "is-me" : ""
                        }`}
                      >
                        <div
                          className={`chat-messageBubble ${
                            message.senderId === user.uid ? "is-me" : ""
                          }`}
                        >
                          {message.text}
                        </div>

                        <div
                          className={`chat-metaRow ${
                            message.senderId === user.uid ? "is-me" : ""
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>

                          {message.senderId === user.uid && (
                            <span className="chat-tick">
                              {message.readBy?.length > 1 ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {isAnnouncementChat && announcements.length === 0 && (
                  <p className="muted">
                    No announcements have been published yet.
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {isAnnouncementChat ? null : (
                <div className="chat-composeShell">
                  <div className="chat-composeRow">
                    <button
                      type="button"
                      className="chat-iconBtn"
                      onClick={() => setShowLineupModal(true)}
                      aria-label="Share lineup"
                    >
                      <AttachFileIcon />
                    </button>

                    <input
                      className="input chat-composeInput"
                      placeholder="Type a message"
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        if (composeError) setComposeError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="chat-sendBtn"
                      onClick={sendMessage}
                    >
                      <SendIcon />
                    </button>
                  </div>
                  {!!composeError && (
                    <p className="muted chat-composeError">{composeError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showLineupModal && (
        <div className="chat-modalOverlay" role="dialog" aria-modal="true">
          <div className="chat-modalCard">
            <h3>Line-up sharing is coming soon</h3>
            <p className="muted">
              We&apos;re finalizing secure line-up sharing in chat. Setup is in
              progress.
            </p>
            <button
              className="btn primary"
              onClick={() => setShowLineupModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
