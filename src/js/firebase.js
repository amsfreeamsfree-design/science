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

// Default / fallback Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForPlantScienceArcade12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "plant-science-arcade.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "plant-science-arcade",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "plant-science-arcade.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
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

// Sync user score to Firestore
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
    console.warn("Firestore sync warning (local storage will be used):", e);
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
