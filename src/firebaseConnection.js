// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN9vNsWxje6ZuplKuKtQont4U-1O3q0iQ",
  authDomain: "agendapro-25c7e.firebaseapp.com",
  projectId: "agendapro-25c7e",
  storageBucket: "agendapro-25c7e.firebasestorage.app",
  messagingSenderId: "10663019990",
  appId: "1:10663019990:web:25ff3ba4da0228355ed077"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)
const auth = getAuth(app)

export { db, auth }