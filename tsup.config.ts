import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    minify: false,
    sourcemap: true,
    clean: true,
    noExternal: [/.*/],
});