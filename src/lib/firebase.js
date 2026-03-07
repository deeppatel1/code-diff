import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

/**
 * Get or create an anonymous user session.
 * Returns the user object or null if Firebase is not configured or auth fails.
 */
export async function getOrCreateAnonUser() {
  if (!auth) return null;

  if (auth.currentUser) return auth.currentUser;

  try {
    const { user } = await signInAnonymously(auth);
    return user;
  } catch (err) {
    console.error('Anonymous auth failed:', err);
    return null;
  }
}

export { doc, setDoc, getDoc };
