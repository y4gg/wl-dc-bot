import { mkdirSync } from 'fs';
import { join } from 'path';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(join(dataDir, 'bot.db'), { create: true });
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
export const sqliteClient = sqlite;
