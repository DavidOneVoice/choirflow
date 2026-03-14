import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { auth, db } from "./firebase/firebase";
import "./styles/pages/auth.css";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ensureFirestoreUserProfile } from "./utils/userProfile";

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  // modes: "login" | "signup" | "reset"

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await ensureFirestoreUserProfile(db, credential.user);
        onAuthSuccess();
      }

      if (mode === "signup") {
        const cleanedUsername = username.trim();
        if (!cleanedUsername) {
          alert("Username is required");
          setLoading(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(credential.user, { displayName: cleanedUsername });
        localStorage.setItem("choirflow_username", cleanedUsername);

        await ensureFirestoreUserProfile(db, {
          ...credential.user,
          displayName: cleanedUsername,
        });

        onAuthSuccess();
      }

      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        alert(
          "Password reset email sent. Please check your inbox (and spam folder).",
        );
        setMode("login");
        resetForm();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen screen-center auth-page">
      <div className="card auth-card" id="auth-card">
        <h1 className="auth-title">
          {mode === "login" && "Login"}
          {mode === "signup" && "Create Account"}
          {mode === "reset" && "Reset Password"}
        </h1>

        <p className="muted auth-sub">
          {mode === "login" &&
            "Welcome back — manage your choir records easily."}
          {mode === "signup" &&
            "Create your account to start saving songs & line-ups."}
          {mode === "reset" && "Enter your email and we’ll send a reset link."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode !== "reset" && (
            <div className="auth-passWrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input auth-passInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <span
                className="auth-eyeBtn"
                onClick={() => setShowPassword((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>
          )}

          <button
            className="btn primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        {mode === "login" && (
          <>
            <button
              className="auth-link"
              onClick={() => {
                setMode("reset");
                setPassword("");
              }}
            >
              Forgot password?
            </button>
            <button className="auth-link" onClick={() => setMode("signup")}>
              Don’t have an account? Sign up
            </button>
          </>
        )}

        {mode === "signup" && (
          <button className="auth-link" onClick={() => setMode("login")}>
            Already have an account? Login
          </button>
        )}

        {mode === "reset" && (
          <button className="auth-link" onClick={() => setMode("login")}>
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
