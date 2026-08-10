import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../db/schema";
import { prepareCleaningList } from "./cleaning-list";
import { createPostgresCleaningListStore } from "./postgres-cleaning-list-store";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres("Postgres cleaning-list store", () => {
  let sql: Sql;

  beforeAll(async () => {
    const databaseName = new URL(testDatabaseUrl!).pathname.slice(1);

    if (!databaseName.endsWith("_test")) {
      throw new Error("TEST_DATABASE_URL must select a database ending in _test.");
    }

    sql = postgres(testDatabaseUrl!, { max: 1 });
    await sql.unsafe("drop schema public cascade; create schema public;");
    const migration = await readFile(
      new URL("../../drizzle/0000_initial_schema.sql", import.meta.url),
      "utf8",
    );

    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
  });

  beforeEach(async () => {
    await sql`truncate table tick, run_task, run, task, room, routine`;
  });

  afterAll(async () => {
    await sql.end();
  });

  it("writes the reviewed plan with its relationships", async () => {
    const markdown = `
## Weekly
Cadence: 7 days
**Kitchen**
- Wipe the worktops

## Fortnightly
Cadence: 14 days
Includes: Weekly
**Living room**
- Sofa
  - Vacuum under the cushions
`;
    const plan = await prepareCleaningList(markdown, async () => "group");
    const database = drizzle(sql, { schema });
    const store = createPostgresCleaningListStore(database);

    await store.insert(plan);

    const [counts] = await sql<
      [{ routines: number; rooms: number; tasks: number }]
    >`
      select
        (select count(*)::int from routine) as routines,
        (select count(*)::int from room) as rooms,
        (select count(*)::int from task) as tasks
    `;
    const [relationship] = await sql<
      [{ routine: string; included: string; task: string; group_label: string }]
    >`
      select
        routine.name as routine,
        included.name as included,
        task.text as task,
        task.group_label
      from routine
      join routine as included on included.id = routine.includes_routine_id
      join task on task.routine_id = routine.id
      where routine.name = 'Fortnightly'
    `;

    expect(counts).toEqual({ routines: 2, rooms: 2, tasks: 2 });
    expect(relationship).toEqual({
      routine: "Fortnightly",
      included: "Weekly",
      task: "Vacuum under the cushions",
      group_label: "Sofa",
    });
  });

  it("refuses to add content to a database that is not empty", async () => {
    const markdown = `
## Weekly
Cadence: 7 days
**Kitchen**
- Wipe the worktops
`;
    const plan = await prepareCleaningList(markdown, async () => "task");
    const store = createPostgresCleaningListStore(drizzle(sql, { schema }));

    await store.insert(plan);

    await expect(store.insert(plan)).rejects.toThrow(
      "The database already contains Routines, Rooms, or Tasks.",
    );

    const [counts] = await sql<
      [{ routines: number; rooms: number; tasks: number }]
    >`
      select
        (select count(*)::int from routine) as routines,
        (select count(*)::int from room) as rooms,
        (select count(*)::int from task) as tasks
    `;
    expect(counts).toEqual({ routines: 1, rooms: 1, tasks: 1 });
  });
});
