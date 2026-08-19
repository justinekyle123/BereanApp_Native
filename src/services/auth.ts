import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "../../config/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Convert Firebase User to our AuthUser type
function mapUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  return mapUser(userCredential.user);
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(userCredential.user);
}

// Sign out
export async function logout(): Promise<void> {
  await signOut(auth);
}

// Get current user
export function getCurrentUser(): AuthUser | null {
  const user = auth.currentUser;
  return user ? mapUser(user) : null;
}

// Listen to auth state changes
export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  return auth.onAuthStateChanged((user) => {
    callback(user ? mapUser(user) : null);
  });
}
