// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc,getDocs, limit , startAfter, query, onSnapshot } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBTD7ihiOxPvT9dJik4eI25iMAg26wYoOs",
  authDomain: "punjabiproofreader.firebaseapp.com",
  projectId: "punjabiproofreader",
  storageBucket: "punjabiproofreader.firebasestorage.app",
  messagingSenderId: "117968199565",
  appId: "1:117968199565:web:1b509420b9ee42155ce7c4",
  measurementId: "G-VTWM9QVPVH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(app);

export { firestore, collection, doc, setDoc, getDocs, limit, startAfter, query,onSnapshot  };
