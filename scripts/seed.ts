import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import { config as loadEnvironment } from "dotenv";
import postgres, { type Sql } from "postgres";

import * as schema from "../src/db/schema.ts";
import { createPostgresCleaningListStore } from "../src/import/postgres-cleaning-list-store.ts";
import {
  runSeedCommand,
  type CleaningListStore,
} from "../src/import/seed-command.ts";

loadEnvironment({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const resources: { sqlClient: Sql | null } = { sqlClient: null };

  const store: CleaningListStore = {
    async insert(plan) {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error("Set DATABASE_URL before you write the cleaning list.");
      }

      resources.sqlClient = postgres(databaseUrl, { max: 1 });
      const database = drizzle(resources.sqlClient, { schema });
      await createPostgresCleaningListStore(database).insert(plan);
    },
  };

  try {
    await runSeedCommand(process.argv.slice(2), {
      readTextFile: (path) => readFile(path, "utf8"),
      prompt: (message) => terminal.question(message),
      write: (text) => console.log(text),
      store,
    });
  } finally {
    terminal.close();

    if (resources.sqlClient) {
      await resources.sqlClient.end();
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
