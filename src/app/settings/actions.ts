"use server";

import { revalidatePath } from "next/cache";

import { requireAllowedUser } from "@/auth/server";
import {
  ContentRestoreBlockedError,
  createContentCatalog,
  type CreateRoomInput,
  type CreateRoutineInput,
  type CreateTaskInput,
} from "@/content/content-catalog";
import type { ContentFormState } from "@/content/form-state";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";

function textValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function optionalTextValue(formData: FormData, name: string): string | null {
  return textValue(formData, name) || null;
}

function routineInput(formData: FormData): CreateRoutineInput {
  return {
    cadenceDays: Number.parseInt(textValue(formData, "cadenceDays"), 10),
    includesRoutineId: optionalTextValue(formData, "includesRoutineId"),
    name: textValue(formData, "name"),
  };
}

function roomInput(formData: FormData): CreateRoomInput {
  return { name: textValue(formData, "name") };
}

function taskInput(formData: FormData): CreateTaskInput {
  return {
    groupLabel: optionalTextValue(formData, "groupLabel"),
    note: optionalTextValue(formData, "note"),
    roomId: textValue(formData, "roomId"),
    routineId: textValue(formData, "routineId"),
    text: textValue(formData, "text"),
  };
}

async function runContentAction(
  operation: () => Promise<unknown>,
  operationKind: keyof typeof contentOperationCopyKeys,
): Promise<ContentFormState> {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  const locale = await getRequestLocale();
  const copy = dictionaries[locale];

  try {
    await operation();
    revalidatePath("/");
    revalidatePath("/settings");

    return {
      status: "success",
      message: copy[contentOperationCopyKeys[operationKind].success],
    };
  } catch (error) {
    const message =
      error instanceof ContentRestoreBlockedError
        ? copy.contentRestoreBlocked
        : copy[contentOperationCopyKeys[operationKind].error];

    return { status: "error", message };
  }
}

const contentOperationCopyKeys = {
  archived: {
    error: "contentSaveError",
    success: "contentArchived",
  },
  restored: {
    error: "contentRestoreError",
    success: "contentRestored",
  },
  saved: {
    error: "contentSaveError",
    success: "contentSaved",
  },
} as const;

export async function createRoutineAction(
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () => createContentCatalog(getDatabase()).createRoutine(routineInput(formData)),
    "saved",
  );
}

export async function updateRoutineAction(
  id: string,
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () =>
      createContentCatalog(getDatabase()).updateRoutine(
        id,
        routineInput(formData),
      ),
    "saved",
  );
}

export async function archiveRoutineAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).archiveRoutine(id),
    "archived",
  );
}

export async function restoreRoutineAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).restoreRoutine(id),
    "restored",
  );
}

export async function createRoomAction(
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () => createContentCatalog(getDatabase()).createRoom(roomInput(formData)),
    "saved",
  );
}

export async function updateRoomAction(
  id: string,
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () => createContentCatalog(getDatabase()).updateRoom(id, roomInput(formData)),
    "saved",
  );
}

export async function archiveRoomAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).archiveRoom(id),
    "archived",
  );
}

export async function restoreRoomAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).restoreRoom(id),
    "restored",
  );
}

export async function createTaskAction(
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () => createContentCatalog(getDatabase()).createTask(taskInput(formData)),
    "saved",
  );
}

export async function updateTaskAction(
  id: string,
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  return runContentAction(
    () => createContentCatalog(getDatabase()).updateTask(id, taskInput(formData)),
    "saved",
  );
}

export async function archiveTaskAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).archiveTask(id),
    "archived",
  );
}

export async function restoreTaskAction(
  id: string,
  _state: ContentFormState,
  _formData: FormData,
): Promise<ContentFormState> {
  void _state;
  void _formData;
  return runContentAction(
    () => createContentCatalog(getDatabase()).restoreTask(id),
    "restored",
  );
}
