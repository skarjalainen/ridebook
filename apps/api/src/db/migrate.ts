import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';
import { env } from '../config/env.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate(): Promise<void> {
  const sql = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM _migrations`).map((row) => row.name),
    );

    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const contents = await readFile(join(migrationsDir, file), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`INSERT INTO _migrations (name) VALUES (${file})`;
      });

      console.log(`applied ${file}`);
      count += 1;
    }

    console.log(count === 0 ? 'no pending migrations' : `applied ${count} migration(s)`);
  } finally {
    await sql.end();
  }
}

migrate().catch((error: unknown) => {
  console.error('migration failed:', error);
  process.exit(1);
});
