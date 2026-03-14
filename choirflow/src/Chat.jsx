import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "./firebase/firebase";
import SendIcon from "@mui/icons-material/Send";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
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
} from "firebase/firestore";

const CHAT_FILTERS = {
  all: "all",
  unread: "unread",
};

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

export default function Chat({ user }) {
  const [searchText, setSearchText] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [activeFilter, setActiveFilter] = useState(CHAT_FILTERS.all);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [userLoadError, setUserLoadError] = useState("");
  const [chatLoadError, setChatLoadError] = useState("");
  const [messageLoadError, setMessageLoadError] = useState("");
  const [isUserDirectoryBlocked, setIsUserDirectoryBlocked] = useState(false);

  /* -------------------- LOAD CHAT LIST -------------------- */
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
          const latestMessage = data.latestMessage || null;

          const unread =
            !!latestMessage &&
            latestMessage.senderId !== user.uid &&
            !(latestMessage.readBy || []).includes(user.uid);

          return {
            id: item.id,
            unread,
            profile,
            participants: data.participants || [],
            updatedAt: data.updatedAt,
            latestMessage,
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

  /* -------------------- LOAD ACTIVE CHAT MESSAGES -------------------- */
  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
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

  /* -------------------- MARK UNREAD MESSAGES AS READ -------------------- */
  useEffect(() => {
    if (!activeChat?.id || !messages.length || !user?.uid) return;

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
          "latestMessage.readBy": arrayUnion(user.uid),
        });
      } catch (error) {
        console.error("Failed to mark messages as read", error);
      }
    };

    markAsRead();
  }, [activeChat?.id, messages, user?.uid]);

  /* -------------------- FILTERED CHAT LIST -------------------- */
  const filteredChats = useMemo(() => {
    if (activeFilter === CHAT_FILTERS.unread) {
      return chatList.filter((item) => item.unread);
    }
    return chatList;
  }, [activeFilter, chatList]);

  /* -------------------- LOAD USERS FOR SEARCH -------------------- */
  const loadUsers = async (term = "") => {
    setLoadingUsers(true);
    setUserLoadError("");

    try {
      const usersRef = collection(db, "users");
      const normalized = term.trim().toLowerCase();

      let q;

      if (!normalized) {
        q = query(usersRef, orderBy("username"), limit(10));
      } else {
        q = query(
          usersRef,
          orderBy("username"),
          startAt(normalized),
          endAt(normalized + "\uf8ff"),
          limit(10),
        );
      }

      const snapshot = await getDocs(q);

      setAllUsers(
        snapshot.docs.map((item) => ({
          uid: item.id,
          ...item.data(),
        })),
      );
    } catch (error) {
      if (error?.code === "permission-denied") {
        setIsUserDirectoryBlocked(true);
        setUserLoadError(
          "User directory is blocked by Firestore rules. Please contact support.",
        );
      } else {
        setUserLoadError("Unable to load users right now. Please try again.");
      }
      console.error("Failed to load user directory", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* -------------------- SEARCH RESULTS -------------------- */
  const searchResults = useMemo(() => {
    const candidates = allUsers.filter((person) => person.uid !== user.uid);
    return candidates.slice(0, 8);
  }, [allUsers, user.uid]);

  const showSearchResults = isSearchActive || !!searchText.trim();

  /* -------------------- OPEN / CREATE CHAT -------------------- */
  const openChatWithUser = async (targetUser) => {
    try {
      const chatId = buildChatId(user.uid, targetUser.uid);
      const chatRef = doc(db, "chats", chatId);

      const me = {
        uid: user.uid,
        email: user.email || "",
        username:
          user.displayName ||
          localStorage.getItem("choirflow_username") ||
          user.email?.split("@")[0] ||
          "Unknown",
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setActiveChat({
        id: chatId,
        profile: peer,
      });
      setSearchText("");
      setIsSearchActive(false);
    } catch (error) {
      console.error("Failed to open chat", error);
      alert("Unable to open chat right now.");
    }
  };

  /* -------------------- SEND MESSAGE -------------------- */
  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeChat?.id) return;

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
        updatedAt: serverTimestamp(),
      });

      setDraft("");
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Unable to send message right now.");
    }
  };

  const closeActiveChat = () => {
    setActiveChat(null);
    setMessages([]);
  };

  const isChatOpen = !!activeChat;

  return (
    <div className="chat-page card">
      {!isChatOpen && (
        <>
          <div className="chat-searchBar">
            <SearchIcon />
            <input
              className="input chat-searchInput"
              placeholder="Search by username or email"
              value={searchText}
              autoComplete="off"
              onChange={(event) => {
                const value = event.target.value;
                setSearchText(value);
                if (!isUserDirectoryBlocked) {
                  loadUsers(value);
                }
              }}
              onFocus={() => {
                setIsSearchActive(true);
                if (
                  !loadingUsers &&
                  !isUserDirectoryBlocked &&
                  (!allUsers.length || userLoadError)
                ) {
                  loadUsers(searchText);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => setIsSearchActive(false), 250);
              }}
            />
          </div>

          {showSearchResults && (
            <div className="chat-searchResults">
              {loadingUsers && <p className="muted">Loading users…</p>}
              {!!userLoadError && <p className="muted">{userLoadError}</p>}
              {!loadingUsers && !userLoadError && !searchResults.length && (
                <p className="muted">No users found.</p>
              )}

              {searchResults.map((person) => (
                <button
                  key={person.uid}
                  type="button"
                  className="chat-searchItem"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    openChatWithUser(person);
                  }}
                >
                  <span className="chat-userName">
                    {person.username || person.email || "Unknown user"}
                  </span>
                  <span className="muted">
                    {person.isOnline
                      ? "Online"
                      : formatLastSeen(person.lastSeenAt)}
                  </span>
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
        </>
      )}

      <div className="chat-layout">
        {!isChatOpen && (
          <section className="chat-conversationList">
            {!!chatLoadError && <p className="muted">{chatLoadError}</p>}

            {filteredChats.length === 0 && (
              <p className="muted">
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
                onClick={() =>
                  setActiveChat({
                    id: item.id,
                    profile: item.profile,
                  })
                }
              >
                <div>
                  <p className="chat-userName">
                    {item.profile?.username || item.profile?.email || "Unknown"}
                  </p>
                  <p className="muted chat-userStatus">
                    {item.profile?.isOnline
                      ? "Online"
                      : formatLastSeen(item.profile?.lastSeenAt)}
                  </p>
                  <p className="muted">
                    {item.latestMessage?.text || "Start chatting"}
                  </p>
                </div>

                {item.unread && (
                  <span className="chat-unreadDot" aria-hidden="true" />
                )}
              </button>
            ))}
          </section>
        )}

        <section className="chat-messagesPane">
          {!activeChat && (
            <p className="muted">
              Select a chat from the list, or search a user above.
            </p>
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
                  <h3 className="chat-paneTitle">
                    {activeChat.profile?.username ||
                      activeChat.profile?.email ||
                      "Chat"}
                  </h3>
                </div>
                <p className="muted chat-userStatus">
                  {activeChat.profile?.isOnline
                    ? "Online"
                    : formatLastSeen(activeChat.profile?.lastSeenAt)}
                </p>
              </div>

              <div className="chat-messagesList">
                {!!messageLoadError && (
                  <p className="muted">{messageLoadError}</p>
                )}
                {messages.length === 0 && (
                  <p className="muted">No messages yet.</p>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-messageBubble ${
                      message.senderId === user.uid ? "is-me" : ""
                    }`}
                  >
                    <p>{message.text}</p>
                    <span className="muted chat-time">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="chat-composeRow">
                <input
                  className="input"
                  placeholder="Type a message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn primary"
                  onClick={sendMessage}
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
