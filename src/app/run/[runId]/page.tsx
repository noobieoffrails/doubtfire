import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { requireAllowedUser } from "@/auth/server";
import { RunFlow } from "@/components/run-flow";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunManager, RunNotFoundError } from "@/runs/run-manager";

const runIdSchema = z.string().uuid();

type RunPageProps = {
  params: Promise<{ runId: string }>;
};

const getRun = cache(async (runId: string) => {
  if (!runIdSchema.safeParse(runId).success) {
    notFound();
  }

  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  try {
    return await createRunManager(getDatabase()).get(runId);
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      notFound();
    }

    throw error;
  }
});

export async function generateMetadata({
  params,
}: RunPageProps): Promise<Metadata> {
  const { runId } = await params;
  const run = await getRun(runId);

  return { title: run.routine.name };
}

export default async function RunPage({
  params,
}: RunPageProps) {
  const { runId } = await params;
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const run = await getRun(runId);

  return (
    <RunFlow
      initialRun={run}
      locale={locale}
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
        rooms: copy.rooms,
        roomsInRun: copy.roomsInRun,
        runChangeError: copy.runChangeError,
        runClosed: copy.runClosed,
        runCompleteDescription: copy.runCompleteDescription,
        runNavigation: copy.runNavigation,
        taskList: copy.taskList,
        undo: copy.undo,
      }}
    />
  );
}
