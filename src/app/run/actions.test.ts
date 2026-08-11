import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialContentFormState } from "@/content/form-state";

const runManager = vi.hoisted(() => ({
  reopen: vi.fn(),
  start: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/auth/server", () => ({ requireAllowedUser: vi.fn() }));
vi.mock("@/db/client", () => ({ getDatabase: vi.fn(() => ({})) }));
vi.mock("@/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}));
vi.mock("@/lib/local-preview", () => ({
  allowsLocalPreview: vi.fn(() => true),
}));
vi.mock("@/runs/run-manager", () => ({
  createRunManager: vi.fn(() => runManager),
}));

import {
  reopenRunFromHomeAction,
  startRunAction,
} from "@/app/run/actions";

const routineId = "5f0adf8e-344f-4f63-8a1d-e52081350278";
const runId = "a32771cb-d389-481b-b96f-2d83f686c705";

describe("Home Run actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a local error when starting a Run fails", async () => {
    runManager.start.mockRejectedValueOnce(new Error("Database unavailable."));
    const formData = new FormData();
    formData.set("routineId", routineId);

    await expect(
      startRunAction(initialContentFormState, formData),
    ).resolves.toEqual({
      status: "error",
      message: "Could not start the Run. Try again.",
    });
  });

  it("returns a local error when reopening a Run fails", async () => {
    runManager.reopen.mockRejectedValueOnce(new Error("Run cannot reopen."));
    const formData = new FormData();
    formData.set("runId", runId);

    await expect(
      reopenRunFromHomeAction(initialContentFormState, formData),
    ).resolves.toEqual({
      status: "error",
      message: "Could not reopen the Run. Try again.",
    });
  });
});
