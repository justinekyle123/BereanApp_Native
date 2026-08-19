import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../config/supabase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Convert a Supabase User to our AuthUser type
function mapUser(user: User): AuthUser {
  const metadata = user.user_metadata ?? {};
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: metadata.display_name ?? null,
    photoURL: metadata.avatar_url ?? null,
  };
}

// Sign up with email and password.
// Returns the created user plus whether a session was started immediately.
// When email confirmation is enabled on the Supabase project, `session` is
// null and the user must verify their inbox before signing in.
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: AuthUser; session: Session | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Sign up failed. Please try again.");

  return { user: mapUser(data.user), session: data.session };
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Sign in failed. Please try again.");

  return mapUser(data.user);
}

// Sign out
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Send a password reset email
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ? mapUser(data.user) : null;
}

// Listen to auth state changes
export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  // Fire immediately with the current session so loading resolves right away
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session ? mapUser(data.session.user) : null);
  });

  // Then subscribe to subsequent changes (sign in, sign out, token refresh)
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? mapUser(session.user) : null);
  });

  return () => subscription.unsubscribe();
}
