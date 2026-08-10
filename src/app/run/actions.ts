"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAllowedUser } from "@/auth/server";
import { getDatabase } from "@/db/client";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunManager, type RunView } from "@/runs/run-manager";

const idSchema = z.string().uuid();

async function authorizeRunAction(): Promise<void> {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }
}

function refreshRunPaths(runId: string): void {
  revalidatePath("/");
  revalidatePath(`/run/${runId}`);
}

export async function startRunAction(formData: FormData): Promise<void> {
  await authorizeRunAction();
  const routineId = idSchema.parse(formData.get("routineId"));
  const run = await createRunManager(getDatabase()).start(routineId);

  refreshRunPaths(run.id);
  redirect(`/run/${run.id}`);
}

export async function setTickAction(input: {
  runId: string;
  taskId: string;
  ticked: boolean;
}): Promise<RunView> {
  await authorizeRunAction();
  const runId = idSchema.parse(input.runId);
  const taskId = idSchema.parse(input.taskId);
  const run = await createRunManager(getDatabase()).setTick(
    runId,
    taskId,
    input.ticked,
  );

  refreshRunPaths(run.id);
  return run;
}

export async function getRunAction(runIdValue: string): Promise<RunView> {
  await authorizeRunAction();
  const runId = idSchema.parse(runIdValue);
  return createRunManager(getDatabase()).get(runId);
}

export async function closeRunAction(runIdValue: string): Promise<RunView> {
  await authorizeRunAction();
  const runId = idSchema.parse(runIdValue);
  const run = await createRunManager(getDatabase()).close(runId);

  refreshRunPaths(run.id);
  return run;
}

export async function reopenRunAction(runIdValue: string): Promise<RunView> {
  await authorizeRunAction();
  const runId = idSchema.parse(runIdValue);
  const run = await createRunManager(getDatabase()).reopen(runId);

  refreshRunPaths(run.id);
  return run;
}

export async function reopenRunFromHomeAction(
  formData: FormData,
): Promise<void> {
  await authorizeRunAction();
  const runId = idSchema.parse(formData.get("runId"));
  const run = await createRunManager(getDatabase()).reopen(runId);

  refreshRunPaths(run.id);
  redirect(`/run/${run.id}`);
}
