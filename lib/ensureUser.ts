import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function ensureUserDocument(
  uid: string,
  email: string | null
) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: email || null,
      role: "user",
      createdAt: serverTimestamp(),
    });
  }
}