import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shoppage/contracts': path.resolve(__dirname, './packages/contracts/src/index.ts'),
      '@shoppage/kernel': path.resolve(__dirname, './packages/kernel/src/index.ts'),
      '@shoppage/adapters': path.resolve(__dirname, './packages/adapters/src/index.ts'),
      '@shoppage/eval': path.resolve(__dirname, './packages/eval/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
