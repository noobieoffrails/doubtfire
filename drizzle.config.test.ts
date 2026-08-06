import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalWorkingDirectory = process.cwd();
const originalDatabaseUrl = process.env.DATABASE_URL;

describe.sequential("Drizzle configuration", () => {
  let workingDirectory: string;

  beforeEach(async () => {
    workingDirectory = await mkdtemp(join(tmpdir(), "doubtfire-drizzle-"));
    process.chdir(workingDirectory);
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  afterEach(async () => {
    process.chdir(originalWorkingDirectory);

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    await rm(workingDirectory, { force: true, recursive: true });
    vi.resetModules();
  });

  it("loads the local database URL from .env.local", async () => {
    await writeFile(
      join(workingDirectory, ".env.local"),
      "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doubtfire\n",
    );

    const { default: config } = await import("./drizzle.config");

    expect(config).toMatchObject({
      dbCredentials: {
        url: "postgresql://postgres:postgres@localhost:5432/doubtfire",
      },
    });
  });

  it("keeps an explicit database URL from the terminal", async () => {
    await writeFile(
      join(workingDirectory, ".env.local"),
      "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/local-file\n",
    );
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/terminal";

    const { default: config } = await import("./drizzle.config");

    expect(config).toMatchObject({
      dbCredentials: {
        url: "postgresql://postgres:postgres@localhost:5432/terminal",
      },
    });
  });
});
