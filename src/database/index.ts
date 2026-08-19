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
      email TEXT UNIQUE NOT NULL,
      displayName TEXT,
      photoURL TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'general',
      isFavorite INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
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
