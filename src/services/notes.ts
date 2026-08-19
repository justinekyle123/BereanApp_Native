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

// Ensure a users row exists for the given user (or a "local" row when signed out),
// since notes.userId has a foreign key to users(id).
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

export async function getNotes(userId: string): Promise<Note[]> {
  const db = await getDatabase();
  return db.getAllAsync<Note>(
    `SELECT * FROM notes WHERE userId = ?
     ORDER BY datetime(updatedAt) DESC, datetime(createdAt) DESC`,
    [userId]
  );
}

export async function createNote(
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

export async function updateNote(
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

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
}
