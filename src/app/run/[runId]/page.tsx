import { notFound } from "next/navigation";
import { z } from "zod";

import { requireAllowedUser } from "@/auth/server";
import { RunFlow } from "@/components/run-flow";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunManager, RunNotFoundError } from "@/runs/run-manager";

const runIdSchema = z.string().uuid();

export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  const { runId } = await params;

  if (!runIdSchema.safeParse(runId).success) {
    notFound();
  }

  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  let run;

  try {
    run = await createRunManager(getDatabase()).get(runId);
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <RunFlow
      initialRun={run}
      copy={{
        allTasks: copy.allTasks,
        backHome: copy.backHome,
        backToRooms: copy.backToRooms,
        cleaningComplete: copy.cleaningComplete,
        doneWithRoom: copy.doneWithRoom,
        markAsDone: copy.markAsDone,
        markingAsDone: copy.markingAsDone,
        nextRoom: copy.nextRoom,
        noDueTasks: copy.noDueTasks,
        roomProgress: copy.roomProgress,
        rooms: copy.rooms,
        roomsInRun: copy.roomsInRun,
        runChangeError: copy.runChangeError,
        runCompleteDescription: copy.runCompleteDescription,
        runNavigation: copy.runNavigation,
        taskList: copy.taskList,
        tasksDone: copy.tasksDone,
        undo: copy.undo,
      }}
    />
  );
}
