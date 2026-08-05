import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Stejný Firebase projekt jako Android appka (elevencoach-fc246) — sdílená data přes kód týmu.
const firebaseConfig = {
  projectId: "elevencoach-fc246",
  appId: "1:740517617209:web:3e4b50d96b9584f4a7b7e8",
  storageBucket: "elevencoach-fc246.firebasestorage.app",
  apiKey: "AIzaSyDZ1abhYFNIWDp7TcbSHni6Dok2EeoI8_A",
  authDomain: "elevencoach-fc246.firebaseapp.com",
  messagingSenderId: "740517617209",
  measurementId: "G-47RHY3NZ8C",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

let signInPromise: Promise<User> | null = null;

/** Zajistí anonymní přihlášení jednou při startu appky; další volání vrací stejnou probíhající/hotovou Promise. */
export function ensureSignedIn(): Promise<User> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (signInPromise) return signInPromise;

  signInPromise = new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      reject
    );
    signInAnonymously(auth).catch((err) => {
      unsubscribe();
      reject(err);
    });
  });
  return signInPromise;
}
