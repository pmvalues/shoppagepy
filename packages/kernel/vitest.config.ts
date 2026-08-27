import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shoppage/contracts': path.resolve(__dirname, '../contracts/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Kernel tests share one large SQLite merchant database; parallel workers
    // cause intermittent SQLITE_BUSY ("database is locked") failures.
    fileParallelism: false,
  },
});
