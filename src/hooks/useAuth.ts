import { useState, useEffect } from "react";
import { AuthUser, onAuthStateChanged } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Safety net: never leave the app stuck on the loading screen,
    // even if the auth listener never fires for some reason.
    const timeout = setTimeout(() => setLoading(false), 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { user, loading };
}
