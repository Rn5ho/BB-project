import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    passWithNoTests: true,
    env: { DATABASE_URL: 'postgresql://user:pass@stub.neon.tech/dbname' },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
