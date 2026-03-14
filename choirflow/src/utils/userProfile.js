import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const UNKNOWN_USERNAME = "Unknown";

export function deriveUsername({ displayName, storedUsername, email }) {
  const safeDisplayName = (displayName || "").trim();
  if (safeDisplayName) return safeDisplayName;

  const safeStoredUsername = (storedUsername || "").trim();
  if (safeStoredUsername) return safeStoredUsername;

  const emailPrefix = (email || "").split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return UNKNOWN_USERNAME;
}

export function buildUserSearchFields({ username, email }) {
  const cleanUsername = (username || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const emailPrefix = cleanEmail.split("@")[0] || "";

  return {
    username: cleanUsername || UNKNOWN_USERNAME,
    usernameLower: (cleanUsername || UNKNOWN_USERNAME).toLowerCase(),
    email: cleanEmail,
    emailPrefix,
  };
}

export async function ensureFirestoreUserProfile(db, firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);
  const storedUsername = localStorage.getItem("choirflow_username") || "";

  const username = deriveUsername({
    displayName: firebaseUser.displayName,
    storedUsername,
    email: firebaseUser.email,
  });

  const profileFields = buildUserSearchFields({
    username,
    email: firebaseUser.email,
  });

  const basePatch = {
    uid: firebaseUser.uid,
    ...profileFields,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(userRef, {
      ...basePatch,
      createdAt: serverTimestamp(),
    });
  } else {
    const current = snap.data() || {};
    const needsCreatedAt = !current.createdAt;

    await setDoc(
      userRef,
      {
        ...basePatch,
        createdAt: needsCreatedAt ? serverTimestamp() : current.createdAt,
      },
      { merge: true },
    );
  }

  return {
    uid: firebaseUser.uid,
    ...profileFields,
  };
}
