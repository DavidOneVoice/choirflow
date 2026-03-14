import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "./firebase/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((item) => {
        const data = item.data();
        const otherParticipantId = (data.participants || []).find(
          (id) => id !== user.uid,
        );
        const profile = data.participantProfiles?.[otherParticipantId] || null;
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

      setChatList(docs);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setMessages(entries);
    });

    return () => unsubscribe();
  }, [activeChat?.id]);

  useEffect(() => {
    if (!activeChat?.id || !messages.length) return;

    const unreadIncoming = messages.filter(
      (message) =>
        message.senderId !== user.uid && !(message.readBy || []).includes(user.uid),
    );

    if (!unreadIncoming.length) return;

    const markAsRead = async () => {
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
    };

    markAsRead();
  }, [activeChat?.id, messages, user.uid]);

  const filteredChats = useMemo(() => {
    if (activeFilter === CHAT_FILTERS.unread) {
      return chatList.filter((item) => item.unread);
    }

    return chatList;
  }, [activeFilter, chatList]);

  const searchResults = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const candidates = allUsers.filter((person) => person.uid !== user.uid);

    if (!term) return candidates.slice(0, 8);

    return candidates
      .filter((person) => {
        const username = (person.username || "").toLowerCase();
        const email = (person.email || "").toLowerCase();
        return username.includes(term) || email.includes(term);
      })
      .slice(0, 8);
  }, [allUsers, searchText, user.uid]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUserLoadError("");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setAllUsers(
        snapshot.docs.map((item) => ({
          uid: item.id,
          ...item.data(),
        })),
      );
    } catch (error) {
      setUserLoadError("Unable to load users right now. Please try again.");
      console.error("Failed to load user directory", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSearchResults = isSearchActive || !!searchText.trim();

  const openChatWithUser = async (targetUser) => {
    const chatId = buildChatId(user.uid, targetUser.uid);
    const chatRef = doc(db, "chats", chatId);
    const existing = await getDoc(chatRef);

    const me = {
      uid: user.uid,
      email: user.email || "",
      username:
        user.displayName || localStorage.getItem("choirflow_username") || "Unknown",
    };

    const peer = {
      uid: targetUser.uid,
      email: targetUser.email || "",
      username: targetUser.username || targetUser.email || "Unknown",
    };

    if (!existing.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, targetUser.uid],
        participantProfiles: {
          [user.uid]: me,
          [targetUser.uid]: peer,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        participantProfiles: {
          ...(existing.data().participantProfiles || {}),
          [user.uid]: me,
          [targetUser.uid]: peer,
        },
      });
    }

    setActiveChat({
      id: chatId,
      profile: peer,
    });
    setSearchText("");
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeChat?.id) return;

    const message = {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
    };

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
  };

  return (
    <div className="chat-page card">
      <div className="chat-searchBar">
        <SearchIcon />
        <input
          className="input chat-searchInput"
          placeholder="Search by username or email"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onFocus={() => setIsSearchActive(true)}
          onBlur={() => {
            window.setTimeout(() => setIsSearchActive(false), 120);
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
              className="chat-searchItem"
              onClick={() => openChatWithUser(person)}
            >
              <span className="chat-userName">
                {person.username || person.email || "Unknown user"}
              </span>
              <span className="muted">{person.email}</span>
            </button>
          ))}
        </div>
      )}

      <div className="chat-filters">
        <button
          className={`chat-filterBtn ${
            activeFilter === CHAT_FILTERS.all ? "is-active" : ""
          }`}
          onClick={() => setActiveFilter(CHAT_FILTERS.all)}
        >
          All Messages
        </button>
        <button
          className={`chat-filterBtn ${
            activeFilter === CHAT_FILTERS.unread ? "is-active" : ""
          }`}
          onClick={() => setActiveFilter(CHAT_FILTERS.unread)}
        >
          Unread
        </button>
      </div>

      <div className="chat-layout">
        <section className="chat-conversationList">
          {filteredChats.length === 0 && (
            <p className="muted">No conversations yet. Search for a user above.</p>
          )}

          {filteredChats.map((item) => (
            <button
              key={item.id}
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
                <p className="muted">{item.latestMessage?.text || "Start chatting"}</p>
              </div>
              {item.unread && <span className="chat-unreadDot" aria-hidden="true" />}
            </button>
          ))}
        </section>

        <section className="chat-messagesPane">
          {!activeChat && (
            <p className="muted">Select a chat from the left, or search a user above.</p>
          )}

          {activeChat && (
            <>
              <h3 className="chat-paneTitle">
                {activeChat.profile?.username || activeChat.profile?.email || "Chat"}
              </h3>

              <div className="chat-messagesList">
                {messages.length === 0 && <p className="muted">No messages yet.</p>}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-messageBubble ${
                      message.senderId === user.uid ? "is-me" : ""
                    }`}
                  >
                    <p>{message.text}</p>
                    <span className="muted chat-time">{formatTime(message.createdAt)}</span>
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
                    if (event.key === "Enter") sendMessage();
                  }}
                />
                <button className="btn primary" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
