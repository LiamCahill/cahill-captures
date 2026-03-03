/// <reference types="vite/client" />

// App modules - all .ts files in the convex directory (single-extension only)
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");

// ShardedCounter component modules (including _generated/ subdirectory)
export const shardedCounterModules = import.meta.glob(
  "../node_modules/@convex-dev/sharded-counter/src/component/**/*.*s"
);
