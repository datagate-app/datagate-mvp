import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
 apiKey: "AIzaSyA4LMFvFIQwGC_kZKCICdyF5qRCx73y0Xc",
  authDomain: "datagate-d9b22.firebaseapp.com",
  projectId: "datagate-d9b22",
  storageBucket: "datagate-d9b22.firebasestorage.app",
  messagingSenderId: "814786216008",
  appId: "1:814786216008:web:59fa60225a1cfa0edb587d",
  measurementId: "G-KQM6E75MXQ"
};

const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// 🔥 AUTH
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
