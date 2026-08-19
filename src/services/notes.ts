import { supabase } from "../../config/supabase";
import { getDatabase } from "../database";
import { AuthUser } from "./auth";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
  updatedAt: string;
}

// Shape of a row in the Supabase `notes` table
interface CloudNote {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  category: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Local (SQLite)
// ============================================================

// Ensure a users row exists for the given user (or a "local" row when signed
// out), since notes.userId has a foreign key to users(id).
export async function ensureUserRow(user: AuthUser | null): Promise<string> {
  const db = await getDatabase();

  if (user) {
    await db.runAsync(
      `INSERT INTO users (id, email, displayName, photoURL, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         displayName = excluded.displayName,
         photoURL = excluded.photoURL,
         updatedAt = CURRENT_TIMESTAMP`,
      [user.uid, user.email, user.displayName, user.photoURL]
    );
    return user.uid;
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, email, createdAt, updatedAt)
     VALUES (?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ["local"]
  );
  return "local";
}

async function getNotesLocal(userId: string): Promise<Note[]> {
  const db = await getDatabase();
  return db.getAllAsync<Note>(
    `SELECT * FROM notes WHERE userId = ?
     ORDER BY datetime(updatedAt) DESC, datetime(createdAt) DESC`,
    [userId]
  );
}

async function createNoteLocal(
  userId: string,
  title: string,
  content: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO notes (id, userId, title, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [Date.now().toString(), userId, title, content]
  );
}

async function updateNoteLocal(
  id: string,
  title: string,
  content: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, content, id]
  );
}

async function deleteNoteLocal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
}

// ============================================================
// Cloud (Supabase)
// ============================================================

// Checked once per session so a missing/unreachable `notes` table
// degrades to the local store instead of erroring on every call.
let cloudChecked = false;
let cloudReady = false;

async function isCloudReady(): Promise<boolean> {
  if (cloudChecked) return cloudReady;
  const { error } = await supabase.from("notes").select("id").limit(1);
  cloudReady = !error;
  cloudChecked = true;
  return cloudReady;
}

function mapCloudNote(note: CloudNote): Note {
  return {
    id: note.id,
    userId: note.user_id,
    title: note.title,
    content: note.content ?? "",
    category: note.category,
    isFavorite: note.is_favorite ? 1 : 0,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

// ============================================================
// Public API — cloud-first, falls back to local storage
// ============================================================

export async function getNotes(user: AuthUser | null): Promise<Note[]> {
  if (user && (await isCloudReady())) {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.uid)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      return (data as CloudNote[]).map(mapCloudNote);
    }
  }
  return getNotesLocal(await ensureUserRow(user));
}

export async function createNote(
  user: AuthUser | null,
  title: string,
  content: string
): Promise<void> {
  if (user && (await isCloudReady())) {
    const { error } = await supabase.from("notes").insert({
      user_id: user.uid,
      title,
      content: content || null,
      is_favorite: false,
    });
    if (!error) return;
  }
  await createNoteLocal(await ensureUserRow(user), title, content);
}

export async function updateNote(
  user: AuthUser | null,
  id: string,
  title: string,
  content: string
): Promise<void> {
  if (user && (await isCloudReady())) {
    const { error } = await supabase
      .from("notes")
      .update({ title, content: content || null })
      .eq("id", id)
      .eq("user_id", user.uid);
    if (!error) return;
  }
  await updateNoteLocal(id, title, content);
}

export async function deleteNote(
  user: AuthUser | null,
  id: string
): Promise<void> {
  if (user && (await isCloudReady())) {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.uid);
    if (!error) return;
  }
  await deleteNoteLocal(id);
}
