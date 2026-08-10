import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The integration suites reset one shared test database schema.
    fileParallelism: false,
  },
});
