// At the top of App.jsx
import React, { useEffect, useState } from "react";
import logo from "./assets/logo.png"; // <-- fixed import

import Auth from "./Auth.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import Categories from "./Categories.jsx";
import Home from "./Home";
import AddSong from "./AddSong";
import SearchFilters from "./SearchFilters.jsx";
import CategoryPage from "./CategoryPage.jsx";
import LineUps from "./LineUps.jsx";

import { HomeIcon, AddIcon, CategoryIcon, ProfileIcon } from "./Icons";
import SearchIcon from "@mui/icons-material/Search";

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

  /* ----------------------- SCROLL TO TOP ON TAB SWITCH -------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  /* ---------------------------- SHOW SPLASH ---------------------------- */
  if (showSplash) {
    return (
      <div className="app-root splash-root">
        <div className="splash">
          <img
            src={logo} // <-- use imported logo
            className="splash-logo"
            alt="ChoirFlow Logo"
          />
        </div>
        <h4>
          Powered by <b>OVTech</b>
        </h4>
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
            src={logo} // <-- use imported logo
            className="topbar-logo"
            alt="ChoirFlow Logo"
          />
        </div>

        <button className="nav-btn" onClick={() => setTab("search")}>
          <SearchIcon />
        </button>
      </header>

      {/* Page Content */}
      <main className="screen-center">
        {tab === "home" && <Home />}
        {tab === "add" && <AddSong onAdded={() => setTab("home")} />}
        {tab === "categories" && (
          <Categories onSelectCategory={(cat) => setTab(`cat_${cat}`)} />
        )}
        {tab.startsWith("cat_") && (
          <CategoryPage
            category={tab.replace("cat_", "")}
            onBack={() => setTab("categories")}
          />
        )}
        {tab === "search" && <SearchFilters />}
        {tab === "lineups" && (
          <LineUps
            onBack={() => setTab("profile")}
            onViewList={() => setTab("lineupsList")}
          />
        )}
        {tab === "lineupsList" && (
          <LineUpList onBack={() => setTab("profile")} />
        )}

        {tab === "profile" && (
          <div className="card">
            <h1>Profile</h1>
            <h4 className="muted" style={{ marginBottom: 40 }}>
              Username:{" "}
              {user.displayName ||
                localStorage.getItem("choirflow_username") ||
                "One Voice"}
            </h4>

            <button
              className="btn primary"
              style={{
                width: "100%",
                marginBottom: 14,
                paddingTop: 30,
                paddingBottom: 30,
                backgroundColor: "#fff",
                color: "#000",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              onClick={() => setTab("lineups")} // Create
            >
              Create Line-Up
            </button>

            <button
              className="btn primary"
              style={{
                width: "100%",
                paddingTop: 30,
                paddingBottom: 30,
                backgroundColor: "#fff",
                color: "#000",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              onClick={() => setTab("lineupsList")} // View
            >
              View Saved Line-Ups
            </button>

            <button
              className="btn primary"
              style={{
                width: "100%",
                marginBottom: 14,
                paddingTop: 30,
                paddingBottom: 30,
                backgroundColor: "#fff",
                color: "#000",
                marginTop: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              onClick={() =>
                window.open(
                  "https://badrudavidportfolio.netlify.app/#contact",
                  "_blank"
                )
              }
            >
              Contact Support Centre
            </button>

            <button
              className="btn primary"
              style={{
                width: "100%",
                paddingTop: 30,
                paddingBottom: 30,
                backgroundColor: "#fff",
                color: "#000",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
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
