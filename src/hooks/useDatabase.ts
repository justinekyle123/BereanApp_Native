import { useState, useEffect } from "react";
import { getDatabase, getAll, getById, insert, update, remove } from "../database";

export function useDatabase() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initDb() {
      try {
        await getDatabase();
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }
    initDb();
  }, []);

  return {
    loading,
    error,
    getAll: <T>(table: string) => getAll<T>(table),
    getById: <T>(table: string, id: string) => getById<T>(table, id),
    insert: (table: string, data: Record<string, any>) => insert(table, data),
    update: (table: string, id: string, data: Record<string, any>) => update(table, id, data),
    remove: (table: string, id: string) => remove(table, id),
  };
}
