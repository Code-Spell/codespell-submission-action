import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'], // or wherever your entry point is
    format: ['esm'],         // matching your .mjs output
    minify: false,           // optional, easier to debug if false
    sourcemap: true,
    clean: true,
    noExternal: [/.*/],
});