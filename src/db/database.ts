import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'dta.db';
export const ACTIVE_SESSION_ID = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return databasePromise;
};
