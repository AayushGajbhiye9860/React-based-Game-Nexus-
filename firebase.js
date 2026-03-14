import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGW6fqy-fwvFtheNRoBXs9bfuiaMHo_A",
  authDomain: "game-nexus-b8837.firebaseapp.com",
  projectId: "game-nexus-b8837",
  storageBucket: "game-nexus-b8837.firebasestorage.app",
  messagingSenderId: "567998020184",
  appId: "1:567998020184:web:cd74c44c602dd27738282d",
  measurementId: "G-Z3PQK5YLLY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
