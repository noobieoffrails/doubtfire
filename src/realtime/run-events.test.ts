import { readdir, readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createContentCatalog } from "../content/content-catalog";
import * as schema from "../db/schema";
import { createRunManager } from "../runs/run-manager";
import { listenForRunChanges } from "./run-events";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres("Run change stream", () => {
  let sql: Sql;
  let database: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    const databaseName = new URL(testDatabaseUrl!).pathname.slice(1);

    if (!databaseName.endsWith("_test")) {
      throw new Error("TEST_DATABASE_URL must select a database ending in _test.");
    }

    sql = postgres(testDatabaseUrl!, { max: 2 });
    database = drizzle(sql, { schema });
    await sql.unsafe("drop schema public cascade; create schema public;");
    const migrationsDirectory = new URL("../../drizzle/", import.meta.url);
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort();

    for (const migrationFile of migrationFiles) {
      const migration = await readFile(
        new URL(migrationFile, migrationsDirectory),
        "utf8",
      );

      for (const statement of migration.split("--> statement-breakpoint")) {
        if (statement.trim()) {
          await sql.unsafe(statement);
        }
      }
    }
  });

  beforeEach(async () => {
    await sql`truncate table tick, run_task, run, task, room, routine`;
  });

  afterAll(async () => {
    await sql.end();
  });

  it("announces a saved Tick for its Run", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Kitchen" });
    const task = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: routine.id,
      text: "Wipe the sink",
    });
    const manager = createRunManager(database, {
      now: () => new Date("2026-08-10T09:00:00.000Z"),
    });
    const run = await manager.start(routine.id);
    let announceRunChange: (change: { runId: string }) => void = () => undefined;
    const runChanged = new Promise<{ runId: string }>((resolve) => {
      announceRunChange = resolve;
    });
    const stopListening = await listenForRunChanges(sql, announceRunChange);

    try {
      await manager.setTick(run.id, task.id, true);

      await expect(runChanged).resolves.toEqual({ runId: run.id });
    } finally {
      await stopListening();
    }
  });

  it("announces when a Tick is withdrawn", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Bathroom" });
    const task = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: routine.id,
      text: "Clean the mirror",
    });
    const manager = createRunManager(database, {
      now: () => new Date("2026-08-10T09:00:00.000Z"),
    });
    const run = await manager.start(routine.id);
    await manager.setTick(run.id, task.id, true);
    let announceRunChange: (change: { runId: string }) => void = () => undefined;
    const runChanged = new Promise<{ runId: string }>((resolve) => {
      announceRunChange = resolve;
    });
    const stopListening = await listenForRunChanges(sql, announceRunChange);

    try {
      await manager.setTick(run.id, task.id, false);

      await expect(runChanged).resolves.toEqual({ runId: run.id });
    } finally {
      await stopListening();
    }
  });

  it("announces when a Run opens", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    let announceRunChange: (change: { runId: string }) => void = () => undefined;
    const runChanged = new Promise<{ runId: string }>((resolve) => {
      announceRunChange = resolve;
    });
    const stopListening = await listenForRunChanges(sql, announceRunChange);

    try {
      const run = await createRunManager(database, {
        now: () => new Date("2026-08-10T09:00:00.000Z"),
      }).start(routine.id);

      await expect(runChanged).resolves.toEqual({ runId: run.id });
    } finally {
      await stopListening();
    }
  });

  it("announces when a Run closes", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const manager = createRunManager(database, {
      now: () => new Date("2026-08-10T09:00:00.000Z"),
    });
    const run = await manager.start(routine.id);
    let announceRunChange: (change: { runId: string }) => void = () => undefined;
    const runChanged = new Promise<{ runId: string }>((resolve) => {
      announceRunChange = resolve;
    });
    const stopListening = await listenForRunChanges(sql, announceRunChange);

    try {
      await manager.close(run.id);

      await expect(runChanged).resolves.toEqual({ runId: run.id });
    } finally {
      await stopListening();
    }
  });
});
