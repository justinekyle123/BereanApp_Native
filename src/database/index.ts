import * as SQLite from "expo-sqlite";

// Database name
const DB_NAME = "berean_ag.db";

// Initialize database
let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
}

// Initialize database tables
async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      displayName TEXT,
      photoURL TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      cloudId TEXT,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'general',
      isFavorite INTEGER DEFAULT 0,
      syncState TEXT NOT NULL DEFAULT 'synced',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      mood TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      name TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chatId TEXT NOT NULL,
      userId TEXT NOT NULL,
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (chatId, userId),
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chatId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      startsAt DATETIME,
      endsAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(userId);
    CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(userId);
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chatId);
  `);

  await migrate(database);
}

// Schema migrations for databases created by older versions of the app.
async function migrate(database: SQLite.SQLiteDatabase) {
  // v1 -> v2: users.email was NOT NULL, which broke the signed-out "local"
  // user row (INSERT OR IGNORE silently skipped the NULL email).
  const userColumns = await database.getAllAsync<{ name: string; notnull: number }>(
    "PRAGMA table_info(users)"
  );
  const emailColumn = userColumns.find((column) => column.name === "email");

  if (emailColumn && emailColumn.notnull === 1) {
    await database.execAsync(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        displayName TEXT,
        photoURL TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_new (id, email, displayName, photoURL, createdAt, updatedAt)
        SELECT id, email, displayName, photoURL, createdAt, updatedAt FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  // v2 -> v3: notes gained cloudId + syncState for cloud syncing.
  // Existing rows are marked 'pending' so they upload to the cloud on the
  // next sync instead of being treated as already-synced.
  const notesColumns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(notes)"
  );
  if (!notesColumns.some((column) => column.name === "syncState")) {
    await database.execAsync(`
      ALTER TABLE notes ADD COLUMN cloudId TEXT;
      ALTER TABLE notes ADD COLUMN syncState TEXT NOT NULL DEFAULT 'pending';
    `);
  }
}

// Helper functions for common database operations
export async function getAll<T>(tableName: string): Promise<T[]> {
  const database = await getDatabase();
  return await database.getAllAsync<T>(`SELECT * FROM ${tableName}`);
}

export async function getById<T>(tableName: string, id: string): Promise<T | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
}

export async function insert(tableName: string, data: Record<string, any>): Promise<string> {
  const database = await getDatabase();
  const id = data.id || Date.now().toString();
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => "?").join(", ");

  await database.runAsync(
    `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
    values
  );

  return id;
}

export async function update(
  tableName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const database = await getDatabase();
  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map((col) => `${col} = ?`).join(", ");

  await database.runAsync(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function remove(tableName: string, id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
}
