import { readdir, readFile } from "node:fs/promises";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createContentCatalog } from "../content/content-catalog";
import * as schema from "../db/schema";
import { createRunManager } from "./run-manager";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres("Run manager", () => {
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

  it("starts a Run with its Due Tasks grouped by Room", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Kitchen" });
    const task = await catalog.createTask({
      groupLabel: "Surfaces",
      note: "Move small items first.",
      roomId: room.id,
      routineId: routine.id,
      text: "Wipe the worktops",
    });
    const now = new Date("2026-08-10T09:00:00.000Z");
    const manager = createRunManager(database, { now: () => now });

    const run = await manager.start(routine.id);

    expect(run).toMatchObject({
      closedAt: null,
      closedByRollover: false,
      routine: { id: routine.id, name: "Weekly" },
      rooms: [
        {
          id: room.id,
          name: "Kitchen",
          tickedCount: 0,
          tasks: [
            {
              groupLabel: "Surfaces",
              id: task.id,
              note: "Move small items first.",
              text: "Wipe the worktops",
              ticked: false,
            },
          ],
        },
      ],
      startedAt: now,
      tickedCount: 0,
    });
  });

  it("ticks and un-Ticks a Presented Task while the Run is open", async () => {
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
    const now = new Date("2026-08-10T09:00:00.000Z");
    const manager = createRunManager(database, { now: () => now });
    const run = await manager.start(routine.id);

    const tickedRun = await manager.setTick(run.id, task.id, true);

    expect(tickedRun).toMatchObject({
      tickedCount: 1,
      rooms: [{ tickedCount: 1, tasks: [{ id: task.id, ticked: true }] }],
    });

    const untickedRun = await manager.setTick(run.id, task.id, false);

    expect(untickedRun).toMatchObject({
      tickedCount: 0,
      rooms: [{ tickedCount: 0, tasks: [{ id: task.id, ticked: false }] }],
    });
  });

  it("derives Due Tasks from the selected Routine and its Includes chain", async () => {
    const catalog = createContentCatalog(database);
    const weekly = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const fortnightly = await catalog.createRoutine({
      cadenceDays: 14,
      includesRoutineId: weekly.id,
      name: "Fortnightly",
    });
    const quarterly = await catalog.createRoutine({
      cadenceDays: 90,
      includesRoutineId: fortnightly.id,
      name: "Quarterly",
    });
    const room = await catalog.createRoom({ name: "Kitchen" });
    const weeklyDue = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: weekly.id,
      text: "Wipe the sink",
    });
    const weeklyRecent = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: weekly.id,
      text: "Wipe the handles",
    });
    const fortnightlyDue = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: fortnightly.id,
      text: "Clean the cabinet fronts",
    });
    await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: quarterly.id,
      text: "Clean above the cabinets",
    });
    const archived = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: weekly.id,
      text: "Archived example",
    });
    await catalog.archiveTask(archived.id);

    const previousStartedAt = new Date("2026-08-08T09:00:00.000Z");
    const [previousRun] = await database
      .insert(schema.runs)
      .values({
        routineId: weekly.id,
        startedAt: previousStartedAt,
        closedAt: previousStartedAt,
      })
      .returning();
    await database
      .insert(schema.runTasks)
      .values({ runId: previousRun.id, taskId: weeklyRecent.id });
    await database.insert(schema.ticks).values({
      runId: previousRun.id,
      taskId: weeklyRecent.id,
      tickedAt: previousStartedAt,
    });

    const manager = createRunManager(database, {
      now: () => new Date("2026-08-10T09:00:00.000Z"),
    });
    const run = await manager.start(fortnightly.id);
    const presentedTaskIds = run.rooms.flatMap((runRoom) =>
      runRoom.tasks.map((task) => task.id),
    );

    expect(presentedTaskIds).toEqual([weeklyDue.id, fortnightlyDue.id]);
  });

  it("closes a Run, blocks changes, and reopens it before rollover", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Hall" });
    const task = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: routine.id,
      text: "Wipe the mirror",
    });
    let currentTime = new Date("2026-08-10T15:00:00.000Z");
    const manager = createRunManager(database, {
      now: () => currentTime,
      timeZone: "Europe/Helsinki",
    });
    const run = await manager.start(routine.id);
    await manager.setTick(run.id, task.id, true);
    currentTime = new Date("2026-08-10T16:00:00.000Z");

    const closedRun = await manager.close(run.id);

    expect(closedRun).toMatchObject({
      closedAt: currentTime,
      closedByRollover: false,
      tickedCount: 1,
    });
    await expect(manager.setTick(run.id, task.id, false)).rejects.toThrow(
      "This Task is not in an open Run.",
    );

    currentTime = new Date("2026-08-10T22:00:00.000Z");
    const reopenedRun = await manager.reopen(run.id);

    expect(reopenedRun).toMatchObject({
      closedAt: null,
      closedByRollover: false,
      tickedCount: 1,
    });
  });

  it("allows only one open Run", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const manager = createRunManager(database, {
      now: () => new Date("2026-08-10T09:00:00.000Z"),
    });

    await manager.start(routine.id);

    await expect(manager.start(routine.id)).rejects.toThrow(
      "A Run is already open.",
    );
  });

  it("closes stale Runs at 04:00 and carries un-Ticked Tasks forward", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Bedroom" });
    const task = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: room.id,
      routineId: routine.id,
      text: "Dust the bedside table",
    });
    let currentTime = new Date("2026-08-10T15:00:00.000Z");
    const manager = createRunManager(database, {
      now: () => currentTime,
      timeZone: "Europe/Helsinki",
    });
    const staleRun = await manager.start(routine.id);
    currentTime = new Date("2026-08-11T01:00:00.000Z");

    await expect(manager.closeAtRollover()).resolves.toBe(1);
    await expect(manager.reopen(staleRun.id)).rejects.toThrow(
      "This Run can no longer be reopened.",
    );

    const [storedRun] = await database
      .select()
      .from(schema.runs)
      .where(eq(schema.runs.id, staleRun.id));
    expect(storedRun).toMatchObject({
      closedAt: currentTime,
      closedByRollover: true,
    });

    const nextRun = await manager.start(routine.id);
    expect(nextRun.rooms[0]?.tasks).toContainEqual(
      expect.objectContaining({ id: task.id, ticked: false }),
    );
  });

  it("returns the open Run or the latest Run that can be reopened", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    let currentTime = new Date("2026-08-10T15:00:00.000Z");
    const manager = createRunManager(database, {
      now: () => currentTime,
      timeZone: "Europe/Helsinki",
    });
    const run = await manager.start(routine.id);

    await expect(manager.getHouseholdState()).resolves.toMatchObject({
      openRun: { id: run.id },
      resumableRun: null,
    });

    await manager.close(run.id);
    await expect(manager.getHouseholdState()).resolves.toMatchObject({
      openRun: null,
      resumableRun: { id: run.id },
    });

    currentTime = new Date("2026-08-11T01:00:00.000Z");
    await expect(manager.getHouseholdState()).resolves.toEqual({
      openRun: null,
      resumableRun: null,
    });
  });
});
