import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyC738xM5502kXAjY5iH7LvSpeHfD2Om9co",
  authDomain: "localhub-1b618.firebaseapp.com",
  projectId: "localhub-1b618",
  storageBucket: "localhub-1b618.firebasestorage.app",
  messagingSenderId: "220311271853",
  appId: "1:220311271853:web:92cffe7fdbb77c82764924",
  measurementId: "G-D6DMNZ8JXV"
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase not initialized yet. Using local fallback.");
}

export { db, auth };
