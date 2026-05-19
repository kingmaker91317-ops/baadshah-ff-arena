import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useGetMe, useSyncUser } from "@workspace/api-client-react";
import { User as DbUser } from "@workspace/api-client-react/src/generated/api.schemas";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DbUser | undefined;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: dbUser, refetch: refetchDbUser } = useGetMe({
    query: {
      enabled: !!user,
      retry: false,
    },
  });

  const syncUserMutation = useSyncUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem("firebase_uid", firebaseUser.uid);
        setUser(firebaseUser);
        
        try {
          // Sync user to DB
          await syncUserMutation.mutateAsync({
            data: {
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Gamer",
              photoUrl: firebaseUser.photoURL || null,
            }
          });
          await refetchDbUser();
        } catch (e) {
          console.error("Failed to sync user", e);
        }
      } else {
        localStorage.removeItem("firebase_uid");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refetchDbUser, syncUserMutation]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem("firebase_uid");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
