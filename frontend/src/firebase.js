// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoik3ax0RzEnJu6YDvnNCuNCS7TVSv0nY",
  authDomain: "kaichat-5c62b.firebaseapp.com",
  projectId: "kaichat-5c62b",
  storageBucket: "kaichat-5c62b.firebasestorage.app",
  messagingSenderId: "323955578093",
  appId: "1:323955578093:web:6a535e4ccb656c95a768e4",
  measurementId: "G-N2T0BQTZ8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);

// Connect to emulator in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    console.log("Connected to Firebase Auth emulator");
  } catch (error) {
    console.log("Firebase Auth emulator already connected");
  }
}