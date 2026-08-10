import { readdir, readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../db/schema";
import { createContentCatalog } from "./content-catalog";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres("content catalog", () => {
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

  it("creates and lists a Routine", async () => {
    const catalog = createContentCatalog(database);

    await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });

    await expect(catalog.list()).resolves.toMatchObject({
      routines: [
        {
          archivedAt: null,
          cadenceDays: 7,
          includesRoutineId: null,
          name: "Weekly",
          sortOrder: 100,
        },
      ],
      rooms: [],
      tasks: [],
    });
  });

  it("creates a Room and a Task in a Routine", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 14,
      includesRoutineId: null,
      name: "Fortnightly",
    });
    const room = await catalog.createRoom({ name: "Kitchen" });

    await catalog.createTask({
      groupLabel: "Worktops",
      note: "Move the coffee machine.",
      roomId: room.id,
      routineId: routine.id,
      text: "Wipe the worktops",
    });

    await expect(catalog.list()).resolves.toMatchObject({
      rooms: [{ archivedAt: null, name: "Kitchen", sortOrder: 100 }],
      tasks: [
        {
          archivedAt: null,
          groupLabel: "Worktops",
          note: "Move the coffee machine.",
          roomId: room.id,
          routineId: routine.id,
          sortOrder: 100,
          text: "Wipe the worktops",
        },
      ],
    });
  });

  it("updates Routines, Rooms, and Tasks", async () => {
    const catalog = createContentCatalog(database);
    const weekly = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const quarterly = await catalog.createRoutine({
      cadenceDays: 90,
      includesRoutineId: null,
      name: "Quarterly",
    });
    const kitchen = await catalog.createRoom({ name: "Kitchen" });
    const bathroom = await catalog.createRoom({ name: "Bathroom" });
    const task = await catalog.createTask({
      groupLabel: null,
      note: null,
      roomId: kitchen.id,
      routineId: weekly.id,
      text: "Wipe the sink",
    });

    await catalog.updateRoutine(quarterly.id, {
      cadenceDays: 91,
      includesRoutineId: weekly.id,
      name: "Seasonal",
    });
    await catalog.updateRoom(bathroom.id, { name: "Washroom" });
    await catalog.updateTask(task.id, {
      groupLabel: "Sink",
      note: "Use the soft cloth.",
      roomId: bathroom.id,
      routineId: quarterly.id,
      text: "Clean the sink",
    });

    const content = await catalog.list();
    expect(content.routines).toContainEqual(
      expect.objectContaining({
        cadenceDays: 91,
        id: quarterly.id,
        includesRoutineId: weekly.id,
        name: "Seasonal",
      }),
    );
    expect(content.rooms).toContainEqual(
      expect.objectContaining({ id: bathroom.id, name: "Washroom" }),
    );
    expect(content.tasks).toContainEqual(
      expect.objectContaining({
        groupLabel: "Sink",
        id: task.id,
        note: "Use the soft cloth.",
        roomId: bathroom.id,
        routineId: quarterly.id,
        text: "Clean the sink",
      }),
    );
  });

  it("archives a Task without deleting its record", async () => {
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
      text: "Wipe the worktops",
    });

    await catalog.archiveTask(task.id);

    await expect(catalog.list()).resolves.toMatchObject({ tasks: [] });
    const archivedContent = await catalog.list({ includeArchived: true });
    expect(archivedContent.tasks).toContainEqual(
      expect.objectContaining({
        id: task.id,
        archivedAt: expect.any(Date),
      }),
    );
  });

  it("archives a Routine and repairs the Includes chain", async () => {
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
      cadenceDays: 91,
      includesRoutineId: fortnightly.id,
      name: "Quarterly",
    });

    await catalog.archiveRoutine(fortnightly.id);

    const activeContent = await catalog.list();
    expect(activeContent.routines.map((routine) => routine.name)).toEqual([
      "Weekly",
      "Quarterly",
    ]);
    expect(activeContent.routines).toContainEqual(
      expect.objectContaining({
        id: quarterly.id,
        includesRoutineId: weekly.id,
      }),
    );
    const archivedContent = await catalog.list({ includeArchived: true });
    expect(archivedContent.routines).toContainEqual(
      expect.objectContaining({
        id: fortnightly.id,
        archivedAt: expect.any(Date),
      }),
    );
  });

  it("archives a Room and withdraws its Tasks from active content", async () => {
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
      text: "Wipe the worktops",
    });

    await catalog.archiveRoom(room.id);

    await expect(catalog.list()).resolves.toMatchObject({ rooms: [], tasks: [] });
    const archivedContent = await catalog.list({ includeArchived: true });
    expect(archivedContent.rooms).toContainEqual(
      expect.objectContaining({ id: room.id, archivedAt: expect.any(Date) }),
    );
    expect(archivedContent.tasks).toContainEqual(
      expect.objectContaining({ id: task.id, archivedAt: null }),
    );
  });

  it("refuses an Includes cycle", async () => {
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

    await expect(
      catalog.updateRoutine(weekly.id, {
        cadenceDays: 7,
        includesRoutineId: fortnightly.id,
        name: "Weekly",
      }),
    ).rejects.toThrow("A Routine cannot include itself through another Routine.");

    const content = await catalog.list();
    expect(content.routines).toContainEqual(
      expect.objectContaining({ id: weekly.id, includesRoutineId: null }),
    );
  });

  it("normalizes content and refuses empty required text", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "  Weekly  ",
    });
    const room = await catalog.createRoom({ name: "  Kitchen  " });
    const task = await catalog.createTask({
      groupLabel: "   ",
      note: "   ",
      roomId: room.id,
      routineId: routine.id,
      text: "  Wipe the worktops  ",
    });

    expect(routine.name).toBe("Weekly");
    expect(room.name).toBe("Kitchen");
    expect(task).toMatchObject({
      groupLabel: null,
      note: null,
      text: "Wipe the worktops",
    });
    await expect(
      catalog.createRoutine({
        cadenceDays: 0,
        includesRoutineId: null,
        name: " ",
      }),
    ).rejects.toThrow("Enter a Routine name and a positive Cadence.");
    await expect(catalog.createRoom({ name: " " })).rejects.toThrow(
      "Enter a Room name.",
    );
    await expect(
      catalog.createTask({
        groupLabel: null,
        note: null,
        roomId: room.id,
        routineId: routine.id,
        text: " ",
      }),
    ).rejects.toThrow("Enter Task text.");
  });

  it("refuses duplicate active Routine and Room names", async () => {
    const catalog = createContentCatalog(database);
    await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    await catalog.createRoom({ name: "Kitchen" });

    await expect(
      catalog.createRoutine({
        cadenceDays: 14,
        includesRoutineId: null,
        name: "weekly",
      }),
    ).rejects.toThrow("An active Routine already has this name.");
    await expect(catalog.createRoom({ name: "KITCHEN" })).rejects.toThrow(
      "An active Room already has this name.",
    );
  });

  it("refuses concurrent duplicate Routine names", async () => {
    const catalog = createContentCatalog(database);

    const results = await Promise.allSettled([
      catalog.createRoutine({
        cadenceDays: 7,
        includesRoutineId: null,
        name: "Weekly",
      }),
      catalog.createRoutine({
        cadenceDays: 14,
        includesRoutineId: null,
        name: "weekly",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("refuses a Routine Includes cycle created concurrently", async () => {
    const catalog = createContentCatalog(database);
    const weekly = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const fortnightly = await catalog.createRoutine({
      cadenceDays: 14,
      includesRoutineId: null,
      name: "Fortnightly",
    });

    const results = await Promise.allSettled([
      catalog.updateRoutine(weekly.id, {
        cadenceDays: 7,
        includesRoutineId: fortnightly.id,
        name: "Weekly",
      }),
      catalog.updateRoutine(fortnightly.id, {
        cadenceDays: 14,
        includesRoutineId: weekly.id,
        name: "Fortnightly",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("refuses to place a Task in archived content", async () => {
    const catalog = createContentCatalog(database);
    const routine = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    const room = await catalog.createRoom({ name: "Kitchen" });
    await catalog.archiveRoom(room.id);

    await expect(
      catalog.createTask({
        groupLabel: null,
        note: null,
        roomId: room.id,
        routineId: routine.id,
        text: "Wipe the worktops",
      }),
    ).rejects.toThrow("Choose an active Room and Routine.");
  });

  it("refuses to include an archived Routine", async () => {
    const catalog = createContentCatalog(database);
    const weekly = await catalog.createRoutine({
      cadenceDays: 7,
      includesRoutineId: null,
      name: "Weekly",
    });
    await catalog.archiveRoutine(weekly.id);

    await expect(
      catalog.createRoutine({
        cadenceDays: 14,
        includesRoutineId: weekly.id,
        name: "Fortnightly",
      }),
    ).rejects.toThrow("Choose an active Routine to include.");
  });
});
