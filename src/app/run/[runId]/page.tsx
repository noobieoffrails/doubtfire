import { requireAllowedUser } from "@/auth/server";
import { RunFlow } from "@/components/run-flow";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunManager } from "@/runs/run-manager";

export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  const { runId } = await params;
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const run = await createRunManager(getDatabase()).get(runId);

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
        nextRoom: copy.nextRoom,
        noDueTasks: copy.noDueTasks,
        roomProgress: copy.roomProgress,
        roomsInRun: copy.roomsInRun,
        runChangeError: copy.runChangeError,
        runCompleteDescription: copy.runCompleteDescription,
        taskList: copy.taskList,
        tasksDone: copy.tasksDone,
        undo: copy.undo,
      }}
    />
  );
}
