import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface FirestoreUserProfile {
  uid: string;
  name: string;
  email: string;
  ffUid: string;
  inGameName: string;
  level: string;
  phone: string;
  wallet: number;
  photoUrl: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function saveUserProfile(profile: Omit<FirestoreUserProfile, "createdAt" | "updatedAt">) {
  const ref = doc(db, "users", profile.uid);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    {
      ...profile,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp(), wallet: profile.wallet ?? 0 }),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FirestoreUserProfile;
}
