// Firebase client initialization (Auth + Firestore).
// The web API key is public by design — it identifies the project, it is not a secret.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCx1HISQk4RQaR5UDN4oljdoFV7tNdwXyg",
  authDomain: "proj1-db38d.firebaseapp.com",
  projectId: "proj1-db38d",
  storageBucket: "proj1-db38d.firebasestorage.app",
  messagingSenderId: "685586634368",
  appId: "1:685586634368:web:1aabe38a5ff4afe98e7865",
  measurementId: "G-L5351M2YRM",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
