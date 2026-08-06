import { sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  archivedAt: timestamp("archived_at", { withTimezone: true }),
};

export const routines = pgTable(
  "routine",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    cadenceDays: integer("cadence_days").notNull(),
    includesRoutineId: uuid("includes_routine_id").references(
      (): AnyPgColumn => routines.id,
      { onDelete: "restrict" },
    ),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (table) => [
    check("routine_cadence_days_positive", sql`${table.cadenceDays} > 0`),
    check(
      "routine_does_not_include_itself",
      sql`${table.includesRoutineId} is null or ${table.includesRoutineId} <> ${table.id}`,
    ),
    index("routine_sort_order_idx").on(table.sortOrder),
  ],
);

export const rooms = pgTable(
  "room",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (table) => [index("room_sort_order_idx").on(table.sortOrder)],
);

export const tasks = pgTable(
  "task",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    text: text("text").notNull(),
    note: text("note"),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "restrict" }),
    groupLabel: text("group_label"),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (table) => [
    index("task_room_sort_order_idx").on(table.roomId, table.sortOrder),
    index("task_routine_idx").on(table.routineId),
  ],
);

export const runs = pgTable(
  "run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedByRollover: boolean("closed_by_rollover").default(false).notNull(),
  },
  (table) => [
    check(
      "run_rollover_requires_closed_at",
      sql`not ${table.closedByRollover} or ${table.closedAt} is not null`,
    ),
    index("run_started_at_idx").on(table.startedAt),
    index("run_closed_at_idx").on(table.closedAt),
  ],
);

export const runTasks = pgTable(
  "run_task",
  {
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "restrict" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.taskId] }),
    index("run_task_task_id_idx").on(table.taskId),
  ],
);

export const ticks = pgTable(
  "tick",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").notNull(),
    taskId: uuid("task_id").notNull(),
    tickedAt: timestamp("ticked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.runId, table.taskId],
      foreignColumns: [runTasks.runId, runTasks.taskId],
      name: "tick_presented_task_fk",
    }).onDelete("restrict"),
    uniqueIndex("tick_run_task_unique_idx").on(table.runId, table.taskId),
    index("tick_task_ticked_at_idx").on(table.taskId, table.tickedAt),
  ],
);
