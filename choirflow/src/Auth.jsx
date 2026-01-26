import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { auth } from "./firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

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
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess();
      }

      if (mode === "signup") {
        if (!username.trim()) {
          alert("Username is required");
          setLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem("choirflow_username", username);
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
    <div className="auth-screen screen-center">
      <div className="card" id="auth-card">
        <h1>
          {mode === "login" && "Login"}
          {mode === "signup" && "Create Account"}
          {mode === "reset" && "Reset Password"}
        </h1>

        <form onSubmit={handleSubmit}>
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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />

              <span
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "35%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>
          )}

          <button
            className="btn primary auth-btn"
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

        {/* TOGGLES */}
        {mode === "login" && (
          <>
            <p
              className="muted toggle-auth"
              style={{
                textDecoration: "underline",
                marginTop: "2rem",
              }}
              onClick={() => {
                setMode("reset");
                resetForm();
              }}
            >
              Forgot password?
            </p>

            <p
              className="muted toggle-auth"
              onClick={() => {
                setMode("signup");
                resetForm();
              }}
            >
              <span style={{ color: "#000" }}>Don’t have an account?</span>{" "}
              <span style={{ textDecoration: "underline" }}>Sign up</span>
            </p>
          </>
        )}

        {mode === "signup" && (
          <p
            className="muted toggle-auth"
            onClick={() => {
              setMode("login");
              resetForm();
            }}
          >
            <span style={{ color: "#000" }}>Already have an account?</span>{" "}
            <span style={{ textDecoration: "underline" }}>Login</span>
          </p>
        )}

        {mode === "reset" && (
          <p
            className="muted toggle-auth"
            onClick={() => {
              setMode("login");
              resetForm();
            }}
          >
            Back to Login
          </p>
        )}
      </div>
    </div>
  );
}
