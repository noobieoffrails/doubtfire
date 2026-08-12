import {
  and,
  asc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  max,
  ne,
  sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../db/schema";
import { rooms, routines, tasks } from "../db/schema";

const sortOrderGap = 100;

export class ContentRestoreBlockedError extends Error {
  constructor() {
    super("A Task needs an active Room and Routine before it can be restored.");
    this.name = "ContentRestoreBlockedError";
  }
}

async function assertRoutineIncludesNoCycle(
  database: PostgresJsDatabase<typeof schema>,
  routineId: string,
  includesRoutineId: string | null,
): Promise<void> {
  let currentId = includesRoutineId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === routineId || visited.has(currentId)) {
      throw new Error(
        "A Routine cannot include itself through another Routine.",
      );
    }

    visited.add(currentId);
    const [routine] = await database
      .select({ includesRoutineId: routines.includesRoutineId })
      .from(routines)
      .where(eq(routines.id, currentId))
      .limit(1);
    currentId = routine?.includesRoutineId ?? null;
  }
}

export type CreateRoutineInput = {
  name: string;
  cadenceDays: number;
  includesRoutineId: string | null;
};

export type CreateRoomInput = {
  name: string;
};

export type CreateTaskInput = {
  text: string;
  note: string | null;
  roomId: string;
  groupLabel: string | null;
  routineId: string;
};

export type UpdateRoutineInput = CreateRoutineInput;
export type UpdateRoomInput = CreateRoomInput;
export type UpdateTaskInput = CreateTaskInput;

function normalizeRoutineInput(input: CreateRoutineInput): CreateRoutineInput {
  const name = input.name.trim();

  if (!name || !Number.isInteger(input.cadenceDays) || input.cadenceDays <= 0) {
    throw new Error("Enter a Routine name and a positive Cadence.");
  }

  return { ...input, name };
}

function normalizeRoomInput(input: CreateRoomInput): CreateRoomInput {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Enter a Room name.");
  }

  return { name };
}

function normalizeTaskInput(input: CreateTaskInput): CreateTaskInput {
  const text = input.text.trim();

  if (!text) {
    throw new Error("Enter Task text.");
  }

  return {
    ...input,
    groupLabel: input.groupLabel?.trim() || null,
    note: input.note?.trim() || null,
    text,
  };
}

async function assertRoutineNameAvailable(
  database: PostgresJsDatabase<typeof schema>,
  name: string,
  excludeId?: string,
): Promise<void> {
  const [existing] = await database
    .select({ id: routines.id })
    .from(routines)
    .where(
      and(
        isNull(routines.archivedAt),
        sql`lower(${routines.name}) = lower(${name})`,
        excludeId ? ne(routines.id, excludeId) : undefined,
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("An active Routine already has this name.");
  }
}

async function assertRoomNameAvailable(
  database: PostgresJsDatabase<typeof schema>,
  name: string,
  excludeId?: string,
): Promise<void> {
  const [existing] = await database
    .select({ id: rooms.id })
    .from(rooms)
    .where(
      and(
        isNull(rooms.archivedAt),
        sql`lower(${rooms.name}) = lower(${name})`,
        excludeId ? ne(rooms.id, excludeId) : undefined,
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("An active Room already has this name.");
  }
}

async function assertActiveTaskTargets(
  database: PostgresJsDatabase<typeof schema>,
  input: Pick<CreateTaskInput, "roomId" | "routineId">,
): Promise<void> {
  const [[room], [routine]] = await Promise.all([
    database
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.id, input.roomId), isNull(rooms.archivedAt)))
      .limit(1)
      .for("update"),
    database
      .select({ id: routines.id })
      .from(routines)
      .where(
        and(eq(routines.id, input.routineId), isNull(routines.archivedAt)),
      )
      .limit(1)
      .for("update"),
  ]);

  if (!room || !routine) {
    throw new Error("Choose an active Room and Routine.");
  }
}

async function assertActiveIncludedRoutine(
  database: PostgresJsDatabase<typeof schema>,
  includesRoutineId: string | null,
): Promise<void> {
  if (!includesRoutineId) {
    return;
  }

  const [routine] = await database
    .select({ id: routines.id })
    .from(routines)
    .where(
      and(
        eq(routines.id, includesRoutineId),
        isNull(routines.archivedAt),
      ),
    )
    .limit(1)
    .for("update");

  if (!routine) {
    throw new Error("Choose an active Routine to include.");
  }
}

export function createContentCatalog(
  database: PostgresJsDatabase<typeof schema>,
) {
  return {
    async createRoutine(input: CreateRoutineInput) {
      const normalizedInput = normalizeRoutineInput(input);
      return database.transaction(async (transaction) => {
        await assertRoutineNameAvailable(transaction, normalizedInput.name);
        await assertActiveIncludedRoutine(
          transaction,
          normalizedInput.includesRoutineId,
        );
        const [lastRoutine] = await transaction
          .select({ sortOrder: max(routines.sortOrder) })
          .from(routines);

        const [routine] = await transaction
          .insert(routines)
          .values({
            ...normalizedInput,
            sortOrder: (lastRoutine.sortOrder ?? 0) + sortOrderGap,
          })
          .returning();

        return routine;
      });
    },

    async createRoom(input: CreateRoomInput) {
      const normalizedInput = normalizeRoomInput(input);
      await assertRoomNameAvailable(database, normalizedInput.name);
      const [lastRoom] = await database
        .select({ sortOrder: max(rooms.sortOrder) })
        .from(rooms);
      const [room] = await database
        .insert(rooms)
        .values({
          ...normalizedInput,
          sortOrder: (lastRoom.sortOrder ?? 0) + sortOrderGap,
        })
        .returning();

      return room;
    },

    async createTask(input: CreateTaskInput) {
      const normalizedInput = normalizeTaskInput(input);
      return database.transaction(async (transaction) => {
        await assertActiveTaskTargets(transaction, normalizedInput);
        const [lastTask] = await transaction
          .select({ sortOrder: max(tasks.sortOrder) })
          .from(tasks)
          .where(eq(tasks.roomId, normalizedInput.roomId));
        const [task] = await transaction
          .insert(tasks)
          .values({
            ...normalizedInput,
            sortOrder: (lastTask.sortOrder ?? 0) + sortOrderGap,
          })
          .returning();

        return task;
      });
    },

    async updateRoutine(id: string, input: UpdateRoutineInput) {
      const normalizedInput = normalizeRoutineInput(input);
      return database.transaction(
        async (transaction) => {
          await assertRoutineNameAvailable(
            transaction,
            normalizedInput.name,
            id,
          );
          await assertActiveIncludedRoutine(
            transaction,
            normalizedInput.includesRoutineId,
          );
          await assertRoutineIncludesNoCycle(
            transaction,
            id,
            normalizedInput.includesRoutineId,
          );
          const [routine] = await transaction
            .update(routines)
            .set(normalizedInput)
            .where(eq(routines.id, id))
            .returning();

          return routine;
        },
        { isolationLevel: "serializable" },
      );
    },

    async updateRoom(id: string, input: UpdateRoomInput) {
      const normalizedInput = normalizeRoomInput(input);
      await assertRoomNameAvailable(database, normalizedInput.name, id);
      const [room] = await database
        .update(rooms)
        .set(normalizedInput)
        .where(eq(rooms.id, id))
        .returning();

      return room;
    },

    async updateTask(id: string, input: UpdateTaskInput) {
      const normalizedInput = normalizeTaskInput(input);
      return database.transaction(async (transaction) => {
        await assertActiveTaskTargets(transaction, normalizedInput);
        const [currentTask] = await transaction
          .select({ roomId: tasks.roomId, sortOrder: tasks.sortOrder })
          .from(tasks)
          .where(eq(tasks.id, id))
          .limit(1);
        let sortOrder = currentTask?.sortOrder;

        if (currentTask && currentTask.roomId !== normalizedInput.roomId) {
          const [lastTask] = await transaction
            .select({ sortOrder: max(tasks.sortOrder) })
            .from(tasks)
            .where(eq(tasks.roomId, normalizedInput.roomId));
          sortOrder = (lastTask.sortOrder ?? 0) + sortOrderGap;
        }

        const [task] = await transaction
          .update(tasks)
          .set({ ...normalizedInput, sortOrder })
          .where(eq(tasks.id, id))
          .returning();

        return task;
      });
    },

    async archiveTask(id: string) {
      const [task] = await database
        .update(tasks)
        .set({ archivedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning();

      return task;
    },

    async restoreTask(id: string) {
      return database.transaction(async (transaction) => {
        const [taskToRestore] = await transaction
          .select({ roomId: tasks.roomId, routineId: tasks.routineId })
          .from(tasks)
          .where(and(eq(tasks.id, id), isNotNull(tasks.archivedAt)))
          .limit(1)
          .for("update");

        if (!taskToRestore) {
          return undefined;
        }

        const [[room], [routine]] = await Promise.all([
          transaction
            .select({ id: rooms.id })
            .from(rooms)
            .where(
              and(
                eq(rooms.id, taskToRestore.roomId),
                isNull(rooms.archivedAt),
              ),
            )
            .limit(1)
            .for("update"),
          transaction
            .select({ id: routines.id })
            .from(routines)
            .where(
              and(
                eq(routines.id, taskToRestore.routineId),
                isNull(routines.archivedAt),
              ),
            )
            .limit(1)
            .for("update"),
        ]);

        if (!room || !routine) {
          throw new ContentRestoreBlockedError();
        }

        const [task] = await transaction
          .update(tasks)
          .set({ archivedAt: null })
          .where(eq(tasks.id, id))
          .returning();

        return task;
      });
    },

    async archiveRoutine(id: string) {
      return database.transaction(async (transaction) => {
        const [routine] = await transaction
          .select({ includesRoutineId: routines.includesRoutineId })
          .from(routines)
          .where(eq(routines.id, id))
          .limit(1);

        await transaction
          .update(routines)
          .set({ includesRoutineId: routine?.includesRoutineId ?? null })
          .where(eq(routines.includesRoutineId, id));

        const [archivedRoutine] = await transaction
          .update(routines)
          .set({ archivedAt: new Date() })
          .where(eq(routines.id, id))
          .returning();

        return archivedRoutine;
      });
    },

    async restoreRoutine(id: string) {
      const [routine] = await database
        .update(routines)
        .set({ archivedAt: null })
        .where(and(eq(routines.id, id), isNotNull(routines.archivedAt)))
        .returning();

      return routine;
    },

    async archiveRoom(id: string) {
      const [room] = await database
        .update(rooms)
        .set({ archivedAt: new Date() })
        .where(eq(rooms.id, id))
        .returning();

      return room;
    },

    async restoreRoom(id: string) {
      const [room] = await database
        .update(rooms)
        .set({ archivedAt: null })
        .where(and(eq(rooms.id, id), isNotNull(rooms.archivedAt)))
        .returning();

      return room;
    },

    async list(options: { includeArchived?: boolean } = {}) {
      const routineQuery = database
        .select()
        .from(routines)
        .orderBy(asc(routines.sortOrder));
      const roomQuery = database
        .select()
        .from(rooms)
        .orderBy(asc(rooms.sortOrder));
      const taskQuery = options.includeArchived
        ? database.select().from(tasks).orderBy(asc(tasks.sortOrder))
        : database
            .select(getTableColumns(tasks))
            .from(tasks)
            .innerJoin(rooms, eq(tasks.roomId, rooms.id))
            .innerJoin(routines, eq(tasks.routineId, routines.id))
            .where(
              and(
                isNull(tasks.archivedAt),
                isNull(rooms.archivedAt),
                isNull(routines.archivedAt),
              ),
            )
            .orderBy(asc(tasks.sortOrder));
      const [routineRows, roomRows, taskRows] = await Promise.all([
        options.includeArchived
          ? routineQuery
          : routineQuery.where(isNull(routines.archivedAt)),
        options.includeArchived
          ? roomQuery
          : roomQuery.where(isNull(rooms.archivedAt)),
        taskQuery,
      ]);

      return {
        routines: routineRows,
        rooms: roomRows,
        tasks: taskRows,
      };
    },
  };
}
