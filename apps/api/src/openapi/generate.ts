import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../app.js';
import { sql } from '../db/client.js';

// The OpenAPI document is generated from the live route schemas, so it can never
// drift from what the server actually validates.
const outputPath = fileURLToPath(new URL('../../openapi.json', import.meta.url));

const app = await buildApp();
await app.ready();

const document = app.swagger();
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

await app.close();
await sql.end();

console.log(`wrote ${outputPath}`);
