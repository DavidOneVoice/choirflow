import { useState } from "react";
import { auth } from "./firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // LOGIN USER
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess();
      } else {
        // SIGNUP USER
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Save username inside localStorage (we will later move it to Firestore)
        localStorage.setItem("choirflow_username", username);

        onAuthSuccess();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-screen screen-center">
      <div className="card" id="auth-card">
        <h1>{isLogin ? "Login" : "Create Account"}</h1>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
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

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn primary auth-btn" type="submit">
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="muted toggle-auth" onClick={toggleMode}>
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}
