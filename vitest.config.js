import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'services/**/*.js',
        'src/services/**/*.js',
        'src/repositories/**/*.js',
        'controllers/**/*.js',
      ],
      exclude: [
        'src/services/fetchUtils.js',
        'src/scripts/**',
        'src/events/**',
        'src/transforms/**',
        'controllers/health.controller.js',
        'controllers/github.controller.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
