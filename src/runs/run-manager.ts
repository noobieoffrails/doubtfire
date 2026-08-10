import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../db/schema";
import { rooms, routines, runs, runTasks, tasks, ticks } from "../db/schema";

type RunDatabase = PostgresJsDatabase<typeof schema>;

export type RunTask = {
  id: string;
  text: string;
  note: string | null;
  groupLabel: string | null;
  sortOrder: number;
  ticked: boolean;
};

export type RunRoom = {
  id: string;
  name: string;
  sortOrder: number;
  tickedCount: number;
  tasks: RunTask[];
};

export type RunView = {
  id: string;
  routine: { id: string; name: string };
  startedAt: Date;
  closedAt: Date | null;
  closedByRollover: boolean;
  tickedCount: number;
  rooms: RunRoom[];
};

async function getRunView(
  database: RunDatabase,
  runId: string,
): Promise<RunView> {
  const [run] = await database
    .select({
      id: runs.id,
      routineId: routines.id,
      routineName: routines.name,
      startedAt: runs.startedAt,
      closedAt: runs.closedAt,
      closedByRollover: runs.closedByRollover,
    })
    .from(runs)
    .innerJoin(routines, eq(runs.routineId, routines.id))
    .where(eq(runs.id, runId))
    .limit(1);

  if (!run) {
    throw new Error("Run not found.");
  }

  const presentedTasks = await database
    .select({
      roomId: rooms.id,
      roomName: rooms.name,
      roomSortOrder: rooms.sortOrder,
      taskId: tasks.id,
      taskText: tasks.text,
      taskNote: tasks.note,
      taskGroupLabel: tasks.groupLabel,
      taskSortOrder: tasks.sortOrder,
      tickId: ticks.id,
    })
    .from(runTasks)
    .innerJoin(tasks, eq(runTasks.taskId, tasks.id))
    .innerJoin(rooms, eq(tasks.roomId, rooms.id))
    .leftJoin(
      ticks,
      sql`${ticks.runId} = ${runTasks.runId} and ${ticks.taskId} = ${runTasks.taskId}`,
    )
    .where(eq(runTasks.runId, runId))
    .orderBy(asc(rooms.sortOrder), asc(tasks.sortOrder));

  const roomMap = new Map<string, RunRoom>();

  for (const presentedTask of presentedTasks) {
    const room = roomMap.get(presentedTask.roomId) ?? {
      id: presentedTask.roomId,
      name: presentedTask.roomName,
      sortOrder: presentedTask.roomSortOrder,
      tickedCount: 0,
      tasks: [],
    };
    const ticked = presentedTask.tickId !== null;

    room.tasks.push({
      id: presentedTask.taskId,
      text: presentedTask.taskText,
      note: presentedTask.taskNote,
      groupLabel: presentedTask.taskGroupLabel,
      sortOrder: presentedTask.taskSortOrder,
      ticked,
    });
    room.tickedCount += ticked ? 1 : 0;
    roomMap.set(room.id, room);
  }

  const runRooms = [...roomMap.values()];

  return {
    id: run.id,
    routine: { id: run.routineId, name: run.routineName },
    startedAt: run.startedAt,
    closedAt: run.closedAt,
    closedByRollover: run.closedByRollover,
    tickedCount: runRooms.reduce(
      (count, room) => count + room.tickedCount,
      0,
    ),
    rooms: runRooms,
  };
}

async function getRolloverBoundary(
  database: RunDatabase,
  at: Date,
  timeZone: string,
): Promise<Date> {
  const result = await database.execute(sql`
    select "run_rollover_boundary"(
      ${at.toISOString()}::timestamptz,
      ${timeZone}
    ) as boundary
  `);
  const boundary = result[0]?.boundary;

  if (!boundary) {
    throw new Error("Cannot calculate the Run rollover boundary.");
  }

  return boundary instanceof Date ? boundary : new Date(String(boundary));
}

async function closeStaleRuns(
  database: RunDatabase,
  at: Date,
  timeZone: string,
): Promise<number> {
  const closedRuns = await database.execute(sql`
    select "run_id"
    from "close_stale_runs"(
      ${at.toISOString()}::timestamptz,
      ${timeZone}
    )
  `);

  return closedRuns.length;
}

export function createRunManager(
  database: RunDatabase,
  options: { now?: () => Date; timeZone?: string } = {},
) {
  const now = options.now ?? (() => new Date());
  const timeZone = options.timeZone ?? "Europe/Helsinki";

  return {
    async start(routineId: string): Promise<RunView> {
      const startedAt = now();

      return database.transaction(async (transaction) => {
        await transaction.execute(
          sql`select pg_advisory_xact_lock(hashtext('doubtfire-open-run'))`,
        );
        await closeStaleRuns(transaction, startedAt, timeZone);
        const [openRun] = await transaction
          .select({ id: runs.id })
          .from(runs)
          .where(isNull(runs.closedAt))
          .limit(1);

        if (openRun) {
          throw new Error("A Run is already open.");
        }

        const [routine] = await transaction
          .select({ id: routines.id })
          .from(routines)
          .where(
            sql`${routines.id} = ${routineId} and ${routines.archivedAt} is null`,
          )
          .limit(1)
          .for("update");

        if (!routine) {
          throw new Error("Choose an active Routine.");
        }

        const [run] = await transaction
          .insert(runs)
          .values({ routineId, startedAt })
          .returning({ id: runs.id });

        await transaction.execute(sql`
          with recursive included_routine as (
            select id, includes_routine_id
            from ${routines}
            where ${routines.id} = ${routineId}

            union all

            select included.id, included.includes_routine_id
            from ${routines} included
            inner join included_routine current
              on included.id = current.includes_routine_id
            where included.archived_at is null
          ),
          latest_tick as (
            select ${ticks.taskId} as task_id, max(${ticks.tickedAt}) as ticked_at
            from ${ticks}
            group by ${ticks.taskId}
          )
          insert into ${runTasks} (run_id, task_id)
          select ${run.id}, ${tasks.id}
          from ${tasks}
          inner join ${rooms} on ${rooms.id} = ${tasks.roomId}
          inner join ${routines} home_routine on home_routine.id = ${tasks.routineId}
          inner join included_routine on included_routine.id = ${tasks.routineId}
          left join latest_tick on latest_tick.task_id = ${tasks.id}
          where ${tasks.archivedAt} is null
            and ${rooms.archivedAt} is null
            and home_routine.archived_at is null
            and (
              latest_tick.ticked_at is null
              or ${startedAt.toISOString()}::timestamptz - latest_tick.ticked_at
                >= home_routine.cadence_days * interval '1 day'
            )
        `);

        return getRunView(transaction, run.id);
      });
    },

    async setTick(
      runId: string,
      taskId: string,
      ticked: boolean,
    ): Promise<RunView> {
      return database.transaction(async (transaction) => {
        const [presentedTask] = await transaction
          .select({ taskId: runTasks.taskId })
          .from(runTasks)
          .innerJoin(runs, eq(runTasks.runId, runs.id))
          .where(
            and(
              eq(runTasks.runId, runId),
              eq(runTasks.taskId, taskId),
              isNull(runs.closedAt),
            ),
          )
          .limit(1)
          .for("update");

        if (!presentedTask) {
          throw new Error("This Task is not in an open Run.");
        }

        if (ticked) {
          await transaction
            .insert(ticks)
            .values({ runId, taskId, tickedAt: now() })
            .onConflictDoNothing();
        } else {
          await transaction
            .delete(ticks)
            .where(and(eq(ticks.runId, runId), eq(ticks.taskId, taskId)));
        }

        return getRunView(transaction, runId);
      });
    },

    async close(runId: string): Promise<RunView> {
      const [closedRun] = await database
        .update(runs)
        .set({ closedAt: now(), closedByRollover: false })
        .where(and(eq(runs.id, runId), isNull(runs.closedAt)))
        .returning({ id: runs.id });

      if (!closedRun) {
        throw new Error("This Run is already closed.");
      }

      return getRunView(database, closedRun.id);
    },

    async reopen(runId: string): Promise<RunView> {
      const currentTime = now();
      const rolloverBoundary = await getRolloverBoundary(
        database,
        currentTime,
        timeZone,
      );

      return database.transaction(async (transaction) => {
        await transaction.execute(
          sql`select pg_advisory_xact_lock(hashtext('doubtfire-open-run'))`,
        );
        const [openRun] = await transaction
          .select({ id: runs.id })
          .from(runs)
          .where(isNull(runs.closedAt))
          .limit(1);

        if (openRun) {
          throw new Error("A Run is already open.");
        }

        const [reopenedRun] = await transaction
          .update(runs)
          .set({ closedAt: null, closedByRollover: false })
          .where(
            and(
              eq(runs.id, runId),
              isNotNull(runs.closedAt),
              eq(runs.closedByRollover, false),
              gte(runs.startedAt, rolloverBoundary),
            ),
          )
          .returning({ id: runs.id });

        if (!reopenedRun) {
          throw new Error("This Run can no longer be reopened.");
        }

        return getRunView(transaction, reopenedRun.id);
      });
    },

    async closeAtRollover(): Promise<number> {
      return closeStaleRuns(database, now(), timeZone);
    },

    async get(runId: string): Promise<RunView> {
      return getRunView(database, runId);
    },

    async getHouseholdState(): Promise<{
      openRun: RunView | null;
      resumableRun: RunView | null;
    }> {
      const currentTime = now();
      const rolloverBoundary = await getRolloverBoundary(
        database,
        currentTime,
        timeZone,
      );
      await closeStaleRuns(database, currentTime, timeZone);
      const [openRun] = await database
        .select({ id: runs.id })
        .from(runs)
        .where(isNull(runs.closedAt))
        .orderBy(desc(runs.startedAt))
        .limit(1);

      if (openRun) {
        return {
          openRun: await getRunView(database, openRun.id),
          resumableRun: null,
        };
      }

      const [resumableRun] = await database
        .select({ id: runs.id })
        .from(runs)
        .where(
          and(
            isNotNull(runs.closedAt),
            eq(runs.closedByRollover, false),
            gte(runs.startedAt, rolloverBoundary),
          ),
        )
        .orderBy(desc(runs.closedAt))
        .limit(1);

      return {
        openRun: null,
        resumableRun: resumableRun
          ? await getRunView(database, resumableRun.id)
          : null,
      };
    },
  };
}
