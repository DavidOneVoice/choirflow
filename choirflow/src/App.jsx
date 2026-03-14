import React, { useEffect, useState } from "react";
import logo from "./assets/logo.png";
import Auth from "./Auth.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
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
import { HomeIcon, AddIcon, CategoryIcon, ProfileIcon } from "./Icons";
import FilterListIcon from "@mui/icons-material/FilterList";
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

  /* -------------------- WATCH LOGIN STATE -------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /* -------------------- ENSURE FIRESTORE USER PROFILE -------------------- */
  useEffect(() => {
    const ensureUserProfile = async () => {
      if (!user?.uid) return;

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        const savedUsername = localStorage.getItem("choirflow_username") || "";
        const derivedUsername =
          user.displayName ||
          savedUsername ||
          user.email?.split("@")[0] ||
          "Unknown";

        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            email: (user.email || "").trim().toLowerCase(),
            username: derivedUsername,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const data = snap.data() || {};

          await setDoc(
            ref,
            {
              uid: user.uid,
              email: (user.email || data.email || "").trim().toLowerCase(),
              username: data.username || derivedUsername,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      } catch (error) {
        console.error("Failed to ensure Firestore user profile", error);
      }
    };

    ensureUserProfile();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);

    const markOnline = async () => {
      try {
        await setDoc(
          userRef,
          {
            isOnline: true,
            lastSeenAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Failed to mark user online", error);
      }
    };

    const markOffline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: false,
          lastSeenAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to mark user offline", error);
      }
    };

    markOnline();

    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      markOffline();
    };
  }, [user]);

  /* ------------------ SPLASH SCREEN TIMERS ------------------- */
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

  /* ----------------- SCROLL TO TOP ON TAB CHANGE ----------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  /* ------------------------- SHOW SPLASH ------------------------- */
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

  /* ------------------------- SHOW AUTH ------------------------- */
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  /* ------------------------ MAIN CONTENT ------------------------ */
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

      <main className="screen-center">
        {(() => {
          if (tab === "home") return <Home />;

          if (tab === "add") return <AddSong onAdded={() => setTab("home")} />;

          if (tab === "chat") return <Chat user={user} />;

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

          if (tab === "lineupsList") {
            return <LineUpList onBack={() => setTab("profile")} />;
          }

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
          <ChatIcon />
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
