import { existsSync } from 'fs';
import { executeRaw } from './index';
import { runMigration } from './migrate';
import { seedDatabase } from './seed';

export async function initDatabase() {
  const useTurso = !!process.env.TURSO_DATABASE_URL;

  if (useTurso) {
    // Turso: no local file; run migration (one statement at a time) and seed in-process
    console.log('🗄️  Turso detected. Running migration and seed...');
    try {
      await runMigration(executeRaw);
      console.log('✅ Database migrated');
      await seedDatabase();
      console.log('✅ Database seeded');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
    return;
  }

  // Local SQLite: check for events.db
  const dbExists = existsSync('events.db');
  if (!dbExists) {
    console.log('🗄️  Database not found. Creating...');
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('bun run backend/db/migrate.ts');
      console.log('✅ Database migrated');
      await execAsync('bun run backend/db/seed.ts');
      console.log('✅ Database seeded');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  } else {
    console.log('✅ Database already exists');
  }
}
