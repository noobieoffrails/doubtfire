import { defineConfig } from "drizzle-kit";
import { config as loadEnvironment } from "dotenv";

loadEnvironment({ path: [".env.local", ".env"], quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL before you run a database command.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
