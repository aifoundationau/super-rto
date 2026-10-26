import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPeAOWQj8456TeIWDIPsyxyWT7QLrC8J8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-foundation-firebase.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-foundation-firebase",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-foundation-firebase.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "614773274800",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:614773274800:web:bcfa9d363de884cf9ea375"
};

function getOrCreateClientApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    const existing = apps.find(a => a.name === '[DEFAULT]' || a.options.projectId === firebaseConfig.projectId);
    if (existing) return existing;
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}

const app: FirebaseApp = getOrCreateClientApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export async function getClientAuthToken(): Promise<string | null> {
  try {
    // On page load the persisted session is restored asynchronously; wait for it before reading currentUser.
    await auth.authStateReady();
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch (e) {
    return null;
  }
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getClientAuthToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization') && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

export { app };
