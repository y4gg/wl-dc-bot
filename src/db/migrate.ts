import { join } from 'path';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './client';

export function runMigrations(): void {
  migrate(db, {
    migrationsFolder: join(process.cwd(), 'drizzle')
  });
}

if (import.meta.main) {
  runMigrations();
  console.log('Database migrations completed.');
}
