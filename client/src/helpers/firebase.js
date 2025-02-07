// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
const auth = getAuth(app);
// setPersistence(auth, browserLocalPersistence);
// console.log("PERSISTENCE SET LOCAL")

// Initialize Firestore and export it
const db = getFirestore(app);

//to set persistance to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Session persistence set to browser local storage.");
  })
  .catch((error) => {
    console.error("Error setting session persistence:", error);
  });

export { auth, db, app };
