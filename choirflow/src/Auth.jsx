import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { auth, db } from "./firebase/firebase";
import "./styles/pages/auth.css";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

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
        const credential = await signInWithEmailAndPassword(auth, email, password);

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            uid: credential.user.uid,
            email: (credential.user.email || email).trim().toLowerCase(),
            username:
              credential.user.displayName ||
              localStorage.getItem("choirflow_username") ||
              "",
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        onAuthSuccess();
      }

      if (mode === "signup") {
        if (!username.trim()) {
          alert("Username is required");
          setLoading(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: username.trim() });

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            uid: credential.user.uid,
            email: email.trim().toLowerCase(),
            username: username.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        localStorage.setItem("choirflow_username", username.trim());
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
                  ? "Sign Up"
                  : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && (
            <>
              <div
                className="auth-link"
                onClick={() => {
                  setMode("reset");
                  resetForm();
                }}
              >
                Forgot password?
              </div>

              <div
                className="auth-hint"
                onClick={() => {
                  setMode("signup");
                  resetForm();
                }}
                style={{ cursor: "pointer" }}
              >
                Don’t have an account?{" "}
                <span
                  className="auth-link"
                  style={{ textDecoration: "underline" }}
                >
                  Sign up
                </span>
              </div>
            </>
          )}

          {mode === "signup" && (
            <div
              className="auth-hint"
              onClick={() => {
                setMode("login");
                resetForm();
              }}
              style={{ cursor: "pointer" }}
            >
              Already have an account?{" "}
              <span
                className="auth-link"
                style={{ textDecoration: "underline" }}
              >
                Login
              </span>
            </div>
          )}

          {mode === "reset" && (
            <div
              className="auth-link"
              onClick={() => {
                setMode("login");
                resetForm();
              }}
            >
              Back to Login
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
