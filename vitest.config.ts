import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [react(), vue()],
  test: {
    include: ['{spec,core,react,vue,examples,audit}/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
