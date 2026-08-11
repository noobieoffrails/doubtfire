"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAllowedUser } from "@/auth/server";
import type { ContentFormState } from "@/content/form-state";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
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

export async function startRunAction(
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await authorizeRunAction();
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const routineId = idSchema.safeParse(formData.get("routineId"));

  if (!routineId.success) {
    return { status: "error", message: copy.runStartError };
  }

  let run: RunView;

  try {
    run = await createRunManager(getDatabase()).start(routineId.data);
  } catch {
    return { status: "error", message: copy.runStartError };
  }

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
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await authorizeRunAction();
  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const runId = idSchema.safeParse(formData.get("runId"));

  if (!runId.success) {
    return { status: "error", message: copy.runReopenError };
  }

  let run: RunView;

  try {
    run = await createRunManager(getDatabase()).reopen(runId.data);
  } catch {
    return { status: "error", message: copy.runReopenError };
  }

  refreshRunPaths(run.id);
  redirect(`/run/${run.id}`);
}
