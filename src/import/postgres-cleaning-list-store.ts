import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../db/schema.ts";
import { rooms, routines, tasks } from "../db/schema.ts";
import type { CleaningListStore } from "./seed-command.ts";

export function createPostgresCleaningListStore(
  database: PostgresJsDatabase<typeof schema>,
): CleaningListStore {
  return {
    async insert(plan) {
      await database.transaction(async (transaction) => {
        const existingRoutine = await transaction
          .select({ id: routines.id })
          .from(routines)
          .limit(1);
        const existingRoom = await transaction
          .select({ id: rooms.id })
          .from(rooms)
          .limit(1);
        const existingTask = await transaction
          .select({ id: tasks.id })
          .from(tasks)
          .limit(1);

        if (
          existingRoutine.length > 0 ||
          existingRoom.length > 0 ||
          existingTask.length > 0
        ) {
          throw new Error(
            "The database already contains Routines, Rooms, or Tasks.",
          );
        }

        const insertedRoutines = await transaction
          .insert(routines)
          .values(
            plan.routines.map((routine) => ({
              name: routine.name,
              cadenceDays: routine.cadenceDays,
              includesRoutineId: null,
              sortOrder: routine.sortOrder,
            })),
          )
          .returning({ id: routines.id, name: routines.name });
        const routineIdByName = new Map(
          insertedRoutines.map((routine) => [routine.name, routine.id]),
        );

        for (const routine of plan.routines) {
          if (!routine.includesRoutineName) {
            continue;
          }

          await transaction
            .update(routines)
            .set({
              includesRoutineId: routineIdByName.get(
                routine.includesRoutineName,
              ),
            })
            .where(eq(routines.id, routineIdByName.get(routine.name)!));
        }

        const insertedRooms = await transaction
          .insert(rooms)
          .values(
            plan.rooms.map((room) => ({
              name: room.name,
              sortOrder: room.sortOrder,
            })),
          )
          .returning({ id: rooms.id, name: rooms.name });
        const roomIdByName = new Map(
          insertedRooms.map((room) => [room.name, room.id]),
        );

        await transaction.insert(tasks).values(
          plan.tasks.map((task) => ({
            text: task.text,
            note: task.note,
            roomId: roomIdByName.get(task.roomName)!,
            groupLabel: task.groupLabel,
            routineId: routineIdByName.get(task.routineName)!,
            sortOrder: task.sortOrder,
          })),
        );
      });
    },
  };
}
