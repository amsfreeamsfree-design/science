// Firebase Authentication & Firestore Leaderboard Module

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

// Actual Firebase configuration for science-2229e
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAYuAxRH5VNlZYxZEovHMBg6kOvUga8u2M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "science-2229e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "science-2229e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "science-2229e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1047958465676",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1047958465676:web:90e9b42b0a96a17c325fa9"
};

let app, auth, db;
let isFirebaseReady = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseReady = true;
} catch (e) {
  console.warn("Firebase initialized in fallback mode:", e);
}

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  if (!isFirebaseReady || !auth) {
    throw new Error("Firebase configuration not fully connected.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Google Auth error:", err);
    throw err;
  }
}

export async function loginAnonymously() {
  if (!isFirebaseReady || !auth) {
    return { uid: 'guest_' + Date.now(), displayName: '익명 탐구자', isAnonymous: true };
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err) {
    console.warn("Anonymous Auth fallback to local guest:", err);
    return { uid: 'guest_' + Date.now(), displayName: '익명 탐구자', isAnonymous: true };
  }
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeAuthState(callback) {
  if (!isFirebaseReady || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// Sync user score to Firestore securely per user UID
export async function syncScoreToFirestore(userData) {
  if (!isFirebaseReady || !db || !userData.uid) return false;
  try {
    const userRef = doc(db, 'leaderboards', userData.uid);
    await setDoc(userRef, {
      uid: userData.uid,
      displayName: userData.displayName || '익명 탐구자',
      photoURL: userData.photoURL || null,
      gold: userData.gold || 0,
      clearedCount: userData.clearedCount || 0,
      totalStars: userData.totalStars || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn("Firestore sync warning (local storage fallback):", e);
    return false;
  }
}

// Fetch Top 10 from Firestore
export async function getTop10FromFirestore(field = 'gold') {
  if (!isFirebaseReady || !db) return null;
  try {
    const q = query(
      collection(db, 'leaderboards'),
      orderBy(field, 'desc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    return list.length > 0 ? list : null;
  } catch (e) {
    console.warn("Firestore fetch warning, fallback to local:", e);
    return null;
  }
}

export { auth, db, isFirebaseReady };
