import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  bundle: true,
  noExternal: [
    '@actions/core',
    '@actions/github',
    'axios',
    'glob'
  ]
});