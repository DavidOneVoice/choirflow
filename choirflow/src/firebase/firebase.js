// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-UwVTPt5Kzl9g0sF5oA2wmPL0XstVma8",
  authDomain: "choirflow-f8169.firebaseapp.com",
  projectId: "choirflow-f8169",
  storageBucket: "choirflow-f8169.firebasestorage.app",
  messagingSenderId: "837821578232",
  appId: "1:837821578232:web:40af0511f3734150eff40d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
