// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuostL6-FeF7BkAWkCUY_70aPsLg2nN_M",
  authDomain: "calorie-tracky.firebaseapp.com",
  projectId: "calorie-tracky",
  storageBucket: "calorie-tracky.firebasestorage.app",
  messagingSenderId: "1033582444108",
  appId: "1:1033582444108:web:bcd3885cffece24cd43ee9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Could not set Firebase auth persistence", error);
});

// Initialize Firestore database
export const db = getFirestore(app);
