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

// A row in the local notes table (SQLite)
interface LocalNote extends Note {
  cloudId: string | null;
  syncState: "synced" | "pending" | "pending_delete";
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

function mapLocalNote(note: LocalNote): Note {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    category: note.category,
    isFavorite: note.isFavorite,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

// ============================================================
// Local (SQLite) — the on-device cache
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
  const rows = await db.getAllAsync<LocalNote>(
    `SELECT * FROM notes
     WHERE userId = ? AND syncState != 'pending_delete'
     ORDER BY datetime(updatedAt) DESC, datetime(createdAt) DESC`,
    [userId]
  );
  return rows.map(mapLocalNote);
}

async function getLocalNote(id: string): Promise<LocalNote | null> {
  const db = await getDatabase();
  return db.getFirstAsync<LocalNote>(`SELECT * FROM notes WHERE id = ?`, [id]);
}

// Replace the user's synced cache rows with the latest cloud rows.
// Rows that are still pending (created/edited offline) are kept so they
// aren't wiped before they can be uploaded.
async function refreshCacheFromCloud(
  userId: string,
  cloudNotes: CloudNote[]
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM notes WHERE userId = ? AND syncState = 'synced'`,
      [userId]
    );
    for (const note of cloudNotes) {
      await db.runAsync(
        `INSERT INTO notes (id, cloudId, userId, title, content, category, isFavorite, syncState, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [
          note.id,
          note.id,
          userId,
          note.title,
          note.content ?? "",
          note.category,
          note.is_favorite ? 1 : 0,
          note.created_at,
          note.updated_at,
        ]
      );
    }
  });
}

// Upload offline changes to Supabase (called whenever a cloud fetch succeeds).
async function pushPending(user: AuthUser): Promise<void> {
  const db = await getDatabase();
  const pending = await db.getAllAsync<LocalNote>(
    `SELECT * FROM notes WHERE userId = ? AND syncState != 'synced'`,
    [user.uid]
  );

  for (const note of pending) {
    if (note.syncState === "pending_delete") {
      if (note.cloudId) {
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("id", note.cloudId)
          .eq("user_id", user.uid);
        if (error) continue; // retry on the next sync
      }
      await db.runAsync(`DELETE FROM notes WHERE id = ?`, [note.id]);
      continue;
    }

    if (note.cloudId) {
      // Previously synced — push the edit.
      const { error } = await supabase
        .from("notes")
        .update({ title: note.title, content: note.content || null })
        .eq("id", note.cloudId)
        .eq("user_id", user.uid);
      if (error) continue;
      await db.runAsync(
        `UPDATE notes SET syncState = 'synced', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [note.id]
      );
    } else {
      // Created offline — insert and remember the cloud id.
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.uid,
          title: note.title,
          content: note.content || null,
          is_favorite: note.isFavorite === 1,
        })
        .select("id")
        .single();
      if (error || !data) continue;
      await db.runAsync(
        `UPDATE notes SET cloudId = ?, syncState = 'synced' WHERE id = ?`,
        [data.id, note.id]
      );
    }
  }
}

// ============================================================
// Public API — offline-first: read from the cache, sync to the cloud
// ============================================================

export async function getNotes(user: AuthUser | null): Promise<Note[]> {
  if (user) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.uid)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      await refreshCacheFromCloud(user.uid, (data ?? []) as CloudNote[]);
      await pushPending(user);
    } catch {
      // Offline or schema not applied — fall back to the local cache.
    }
  }

  return getNotesLocal(await ensureUserRow(user));
}

export async function createNote(
  user: AuthUser | null,
  title: string,
  content: string
): Promise<void> {
  const db = await getDatabase();
  const userId = await ensureUserRow(user);
  const now = new Date().toISOString();

  if (user) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.uid,
          title,
          content: content || null,
          is_favorite: false,
        })
        .select("id")
        .single();

      if (!error && data) {
        await db.runAsync(
          `INSERT INTO notes (id, cloudId, userId, title, content, category, isFavorite, syncState, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'general', 0, 'synced', ?, ?)`,
          [data.id, data.id, userId, title, content, now, now]
        );
        return;
      }
    } catch {
      // Fall through to the local (pending) save.
    }
  }

  await db.runAsync(
    `INSERT INTO notes (id, cloudId, userId, title, content, category, isFavorite, syncState, createdAt, updatedAt)
     VALUES (?, NULL, ?, ?, ?, 'general', 0, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [Date.now().toString(), userId, title, content]
  );
}

export async function updateNote(
  user: AuthUser | null,
  id: string,
  title: string,
  content: string
): Promise<void> {
  const db = await getDatabase();
  const local = await getLocalNote(id);
  if (!local) return;

  if (user && local.cloudId) {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ title, content: content || null })
        .eq("id", local.cloudId)
        .eq("user_id", user.uid);
      if (!error) {
        await db.runAsync(
          `UPDATE notes SET title = ?, content = ?, syncState = 'synced', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          [title, content, id]
        );
        return;
      }
    } catch {
      // Fall through — save locally and sync later.
    }
  }

  await db.runAsync(
    `UPDATE notes SET title = ?, content = ?, syncState = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, content, id]
  );
}

export async function deleteNote(
  user: AuthUser | null,
  id: string
): Promise<void> {
  const db = await getDatabase();
  const local = await getLocalNote(id);
  if (!local) return;

  if (user && local.cloudId) {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", local.cloudId)
        .eq("user_id", user.uid);
      if (!error) {
        await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
        return;
      }
    } catch {
      // Fall through — mark for deletion and sync later.
    }
  }

  if (local.cloudId) {
    // Delete on the cloud on the next sync.
    await db.runAsync(`UPDATE notes SET syncState = 'pending_delete' WHERE id = ?`, [id]);
  } else {
    // Never synced — just remove it locally.
    await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
  }
}
