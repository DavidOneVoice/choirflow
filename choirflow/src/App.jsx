import React, { useEffect, useState } from "react";
import Auth from "./Auth.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";

import Home from "./Home";
import AddSong from "./AddSong";
import { HomeIcon, AddIcon, CategoryIcon, ProfileIcon } from "./Icons";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");

  /* -------------------- WATCH FIREBASE LOGIN STATE -------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /* ----------------------- SPLASH ANIMATION TIMER ---------------------- */
  useEffect(() => {
    document.title = "ChoirFlow";

    const fadeTimer = setTimeout(() => {
      const splashEl = document.querySelector(".splash-root");
      if (splashEl) splashEl.classList.add("fade-out");
    }, 2700);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  /* ---------------------------- SHOW SPLASH ---------------------------- */
  if (showSplash) {
    return (
      <div className="app-root splash-root">
        <div className="splash">
          <img
            src="/src/assets/logo.png"
            className="splash-logo"
            alt="ChoirFlow Logo"
          />
          <h1 className="splash-title">ChoirFlow</h1>
        </div>
      </div>
    );
  }

  /* --------------------------- SHOW AUTH PAGE --------------------------- */
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  /* -------------------------- MAIN APP LAYOUT -------------------------- */
  return (
    <div className="app-root">
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <img
            src="/src/assets/logo.png"
            className="topbar-logo"
            alt="ChoirFlow Logo"
          />
          <span className="brand-text">ChoirFlow</span>
        </div>
      </header>

      {/* Page Content */}
      <main className="screen-center">
        {tab === "home" && <Home />}

        {tab === "add" && <AddSong onAdded={() => setTab("home")} />}

        {tab === "categories" && (
          <div className="card">
            <h1>Categories</h1>
            <p className="muted">Coming soon</p>
          </div>
        )}

        {tab === "profile" && (
          <div className="card">
            <h1>Profile</h1>
            <p className="muted">
              Username:{" "}
              {user.displayName ||
                localStorage.getItem("choirflow_username") ||
                "One Voice"}
            </p>

            <button
              className="btn primary"
              style={{ width: "100%", marginTop: 14 }}
              onClick={async () => {
                await auth.signOut();
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => setTab("home")}>
          <HomeIcon active={tab === "home"} />
        </button>

        <button className="nav-btn" onClick={() => setTab("add")}>
          <AddIcon active={tab === "add"} />
        </button>

        <button className="nav-btn" onClick={() => setTab("categories")}>
          <CategoryIcon active={tab === "categories"} />
        </button>

        <button className="nav-btn" onClick={() => setTab("profile")}>
          <ProfileIcon active={tab === "profile"} />
        </button>
      </nav>
    </div>
  );
}
