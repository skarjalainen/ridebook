import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  // Bundled so the workspace's TypeScript-source package needs no separate build step.
  noExternal: ['@ridebook/shared'],
});
