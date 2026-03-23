import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminAnnouncements from "./AdminAnnouncements.jsx";
import logo from "./assets/logo.png";
import Auth from "./Auth.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import Categories from "./Categories.jsx";
import Home from "./Home";
import AddSong from "./AddSong";
import SearchFilters from "./SearchFilters.jsx";
import CategoryPage from "./CategoryPage.jsx";
import LineUps from "./LineUps.jsx";
import LineUpList from "./LineUpList.jsx";
import LineUpDetails from "./Components/lineup/LineUpDetails.jsx";
import Chat from "./Chat.jsx";
import EditLineUp from "./EditLineUp.jsx";
import ChatIcon from "@mui/icons-material/Chat";
import FilterListIcon from "@mui/icons-material/FilterList";
import { HomeIcon, AddIcon, CategoryIcon, ProfileIcon } from "./Icons";
import { ensureFirestoreUserProfile } from "./utils/userProfile";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components/cards.css";
import "./styles/components/inputs.css";
import "./styles/components/buttons.css";
import "./styles/components/nav.css";
import "./styles/pages/app.css";
import "./styles/pages/chat.css";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [unreadTotalCount, setUnreadTotalCount] = useState(0);
  const [unreadChatTargets, setUnreadChatTargets] = useState([]);
  const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0);
  const [chatRouteTarget, setChatRouteTarget] = useState(null);
  const [chatToast, setChatToast] = useState(null);
  const [pathname, setPathname] = useState(window.location.pathname);
  const isAdminRoute = pathname === "/admin-announcements";
  const hasShownInitialUnreadToast = useRef(false);
  const latestChatSignaturesRef = useRef(new Map());
  const announcementStorageKey = user?.uid
    ? `choirflow_last_seen_announcement_${user.uid}`
    : "";

  const readStoredAnnouncementId = useCallback(() => {
    if (!announcementStorageKey) return "";

    try {
      return window.localStorage.getItem(announcementStorageKey) || "";
    } catch (error) {
      console.error("Failed to read stored announcement state", error);
      return "";
    }
  }, [announcementStorageKey]);

  const writeStoredAnnouncementId = useCallback((announcementId) => {
    if (!announcementStorageKey || !announcementId) return;

    try {
      window.localStorage.setItem(announcementStorageKey, announcementId);
    } catch (error) {
      console.error("Failed to persist announcement state", error);
    }
  }, [announcementStorageKey]);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUnreadTotalCount(0);
        setUnreadChatTargets([]);
        setChatToast(null);
        hasShownInitialUnreadToast.current = false;
        latestChatSignaturesRef.current = new Map();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ensureProfile = async () => {
      if (!user?.uid) return;
      try {
        await ensureFirestoreUserProfile(db, user);
      } catch (error) {
        console.error("Failed to ensure Firestore user profile", error);
      }
    };

    ensureProfile();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);

    const markPresence = async (isOnline) => {
      try {
        await setDoc(
          userRef,
          {
            isOnline,
            lastSeenAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Failed to update presence", error);
      }
    };

    markPresence(true);

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") markPresence(true);
    }, 60000);

    const handleVisibility = () => {
      markPresence(document.visibilityState === "visible");
    };

    const handleBeforeUnload = () => {
      updateDoc(userRef, {
        isOnline: false,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      markPresence(false);
    };
  }, [user]);

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
        let totalUnread = 0;
        const nextSignatures = new Map();
        const unreadChats = [];

        snapshot.docs.forEach((chatDoc) => {
          const data = chatDoc.data();
          const unread = Number(data.unreadCounts?.[user.uid] || 0);
          totalUnread += unread;

          const latest = data.latestMessage;
          const otherId = (data.participants || []).find(
            (id) => id !== user.uid,
          );
          const profile = data.participantProfiles?.[otherId] || null;
          const createdAt = latest?.createdAt?.toMillis?.() || "no-time";
          const sortTime = latest?.createdAt?.toMillis?.() || data.updatedAt?.toMillis?.() || 0;
          const signature = latest
            ? `${latest.senderId || ""}:${latest.text || ""}:${createdAt}`
            : "";

          nextSignatures.set(chatDoc.id, signature);

          if (unread > 0) {
            unreadChats.push({
              chatId: chatDoc.id,
              profile,
              unreadCount: unread,
              sortTime,
            });
          }

          if (!latest || latest.senderId === user.uid || unread <= 0) return;

          const previous = latestChatSignaturesRef.current.get(chatDoc.id);
          if (previous && previous !== signature) {
            setChatToast({
              title: profile?.username || profile?.email || "New message",
              message: latest.text || "You have a new message.",
              chatId: chatDoc.id,
              profile,
            });
          }
        });

        unreadChats.sort((a, b) => b.sortTime - a.sortTime);

        if (!hasShownInitialUnreadToast.current && totalUnread > 0) {
          const onlyUnreadChat = unreadChats.length === 1 ? unreadChats[0] : null;
          setChatToast({
            title: "Unread messages",
            message: `You have ${totalUnread} unread message${totalUnread > 1 ? "s" : ""}.`,
            chatId: onlyUnreadChat?.chatId || null,
            profile: onlyUnreadChat?.profile || null,
          });
          hasShownInitialUnreadToast.current = true;
        }

        setUnreadChatTargets(unreadChats);
        setUnreadTotalCount(totalUnread);
        latestChatSignaturesRef.current = nextSignatures;
      },
      (error) => {
        console.error("Failed to load unread chats", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const announcementsQuery = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const activeAnnouncements = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.isActive !== false);

        const latestAnnouncement = [...activeAnnouncements].sort((left, right) => {
          const rightTime =
            right.updatedAt?.toMillis?.() ||
            right.createdAt?.toMillis?.() ||
            0;
          const leftTime =
            left.updatedAt?.toMillis?.() ||
            left.createdAt?.toMillis?.() ||
            0;

          return rightTime - leftTime;
        })[0];

        if (!latestAnnouncement?.id) {
          setAnnouncementUnreadCount(0);
          return;
        }

        const storedAnnouncementId = readStoredAnnouncementId();
        const isUnread = storedAnnouncementId !== latestAnnouncement.id;

        setAnnouncementUnreadCount(isUnread ? 1 : 0);

        if (!storedAnnouncementId) {
          writeStoredAnnouncementId(latestAnnouncement.id);
          return;
        }

        if (storedAnnouncementId === latestAnnouncement.id) return;

        setChatToast({
          title: "Choir Flow",
          message:
            latestAnnouncement.title ||
            latestAnnouncement.message ||
            "A new announcement is available.",
          chatId: "announcements-feed",
          profile: {
            uid: "announcements-feed",
            username: "Choir Flow",
            email: "",
            isOnline: true,
          },
        });
      },
      (error) => {
        console.error("Failed to load announcement notifications", error);
      },
    );

    return () => unsubscribe();
  }, [readStoredAnnouncementId, user?.uid, writeStoredAnnouncementId]);

  useEffect(() => {
    document.title = "ChoirFlow";

    const fadeTimer = setTimeout(() => {
      const splashEl = document.querySelector(".splash-root");
      if (splashEl) splashEl.classList.add("fade-out");
    }, 2700);

    const removeTimer = setTimeout(() => setShowSplash(false), 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const combinedUnreadCount = unreadTotalCount + announcementUnreadCount;

  const showChatUnreadBadge = useMemo(
    () => combinedUnreadCount > 0,
    [combinedUnreadCount],
  );

  const handleAnnouncementsViewed = (announcement) => {
    if (!announcement?.id) return;

    writeStoredAnnouncementId(announcement.id);
    setAnnouncementUnreadCount(0);
    setChatToast((currentToast) =>
      currentToast?.chatId === "announcements-feed" ? null : currentToast,
    );
  };

  const goToChatFromToast = () => {
    const targetChat =
      chatToast?.chatId
        ? { chatId: chatToast.chatId, profile: chatToast.profile }
        : unreadChatTargets.length === 1
          ? {
              chatId: unreadChatTargets[0].chatId,
              profile: unreadChatTargets[0].profile,
            }
          : null;

    setTab("chat");
    setChatRouteTarget(targetChat);
    setChatToast(null);
  };

  if (showSplash) {
    return (
      <div className="app-root splash-root">
        <div className="splash">
          <img src={logo} className="splash-logo" alt="ChoirFlow Logo" />
        </div>
        <h4>
          Powered by <b>OVTech</b>
        </h4>
      </div>
    );
  }

  if (!user) {
    if (isAdminRoute && window.location.pathname !== "/") {
      window.history.replaceState({}, "", "/");
      setPathname("/");
    }

    return <Auth onAuthSuccess={() => {}} />;
  }

  if (isAdminRoute) {
    return (
      <div className="app-root app-adminRoute">
        <main className="screen-center">
          <AdminAnnouncements user={user} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <header className="topbar app-topbar">
        <div className="brand">
          <img src={logo} className="topbar-logo" alt="ChoirFlow Logo" />
        </div>

        <button
          className="nav-btn app-topbar__iconBtn"
          onClick={() => setTab("search")}
        >
          <FilterListIcon style={{ fontSize: 40 }} />
        </button>
      </header>

      {chatToast && (
        <button className="app-chatToast" onClick={goToChatFromToast}>
          <div>
            <strong>{chatToast.title}</strong>
            <p>{chatToast.message}</p>
          </div>
          <span>Open</span>
        </button>
      )}

      <main className="screen-center">
        {(() => {
          if (tab === "home") return <Home />;
          if (tab === "add") return <AddSong onAdded={() => setTab("home")} />;
          if (tab === "chat") {
            return (
              <Chat
                user={user}
                routeTarget={chatRouteTarget}
                onClearRouteTarget={() => setChatRouteTarget(null)}
                onAnnouncementsViewed={handleAnnouncementsViewed}
              />
            );
          }
          if (tab === "categories") {
            return (
              <Categories onSelectCategory={(cat) => setTab(`cat_${cat}`)} />
            );
          }
          if (tab.startsWith("cat_")) {
            return (
              <CategoryPage
                category={tab.replace("cat_", "")}
                onBack={() => setTab("categories")}
              />
            );
          }
          if (tab === "lineups") {
            return (
              <LineUps
                onBack={() => setTab("profile")}
                onViewList={() => setTab("lineupsList")}
              />
            );
          }
          if (tab === "lineupsList")
            return <LineUpList onBack={() => setTab("profile")} />;
          if (tab.startsWith("lineup_")) {
            const lineupId = tab.replace("lineup_", "");
            return (
              <LineUpDetails
                id={lineupId}
                onBack={() => setTab("lineupsList")}
                onEdit={(id) => setTab(`editLineup_${id}`)}
              />
            );
          }
          if (tab.startsWith("editLineup_")) {
            const lineupId = tab.replace("editLineup_", "");
            return (
              <EditLineUp
                id={lineupId}
                onBack={() => setTab(`lineup_${lineupId}`)}
              />
            );
          }
          if (tab === "search") return <SearchFilters />;
          if (tab === "profile") {
            return (
              <div className="card app-profile">
                <h1>Profile</h1>
                <h4 className="muted app-profile__username">
                  Username:{" "}
                  {user.displayName ||
                    localStorage.getItem("choirflow_username") ||
                    "One Voice Tech"}
                </h4>

                <div className="app-profile__actions">
                  <button
                    className="app-profile__actionBtn"
                    onClick={() => setTab("lineups")}
                  >
                    <span>Create Line-Up</span>
                    <span className="app-profile__pill">New</span>
                  </button>

                  <button
                    className="app-profile__actionBtn"
                    onClick={() => setTab("lineupsList")}
                  >
                    <span>View Saved Line-Ups</span>
                    <span className="app-profile__pill">List</span>
                  </button>

                  <button
                    className="app-profile__actionBtn"
                    onClick={() =>
                      window.open(
                        "https://badrudavidportfolio.netlify.app/#contact",
                        "_blank",
                      )
                    }
                  >
                    <span>Contact Support Centre</span>
                    <span className="app-profile__pill">Help</span>
                  </button>

                  <button
                    className="app-profile__actionBtn"
                    onClick={async () => await auth.signOut()}
                  >
                    <span>Sign Out</span>
                    <span className="app-profile__pill">Exit</span>
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })()}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-btn ${tab === "home" ? "is-active" : ""}`}
          onClick={() => setTab("home")}
        >
          <HomeIcon active={tab === "home"} />
        </button>

        <button
          className={`nav-btn ${tab === "add" ? "is-active" : ""}`}
          onClick={() => setTab("add")}
        >
          <AddIcon active={tab === "add"} />
        </button>

        <button
          className={`nav-btn ${tab === "chat" ? "is-active" : ""}`}
          onClick={() => setTab("chat")}
        >
          <ChatIcon className="nav-chatIcon" />
          {showChatUnreadBadge && (
            <span
              className="nav-chatUnreadBadge"
              aria-label={`${combinedUnreadCount} unread messages`}
            >
              {combinedUnreadCount > 99 ? "99+" : combinedUnreadCount}
            </span>
          )}
        </button>

        <button
          className={`nav-btn ${tab === "categories" ? "is-active" : ""}`}
          onClick={() => setTab("categories")}
        >
          <CategoryIcon active={tab === "categories"} />
        </button>

        <button
          className={`nav-btn ${tab === "profile" ? "is-active" : ""}`}
          onClick={() => setTab("profile")}
        >
          <ProfileIcon active={tab === "profile"} />
        </button>
      </nav>
    </div>
  );
}
