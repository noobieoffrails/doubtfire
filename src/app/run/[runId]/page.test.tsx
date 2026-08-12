import { describe, expect, it, vi } from "vitest";

const getRun = vi.hoisted(() => vi.fn());
const RunNotFoundError = vi.hoisted(
  () =>
    class RunNotFoundError extends Error {
      constructor() {
        super("Run not found.");
      }
    },
);
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/auth/server", () => ({ requireAllowedUser: vi.fn() }));
vi.mock("@/db/client", () => ({ getDatabase: vi.fn(() => ({})) }));
vi.mock("@/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}));
vi.mock("@/lib/local-preview", () => ({
  allowsLocalPreview: vi.fn(() => true),
}));
vi.mock("@/runs/run-manager", () => ({
  createRunManager: vi.fn(() => ({ get: getRun })),
  RunNotFoundError,
}));

import RunPage from "./page";

describe("Run page", () => {
  it("uses the not-found boundary when a Run does not exist", async () => {
    getRun.mockRejectedValueOnce(new RunNotFoundError());

    await expect(
      RunPage({
        params: Promise.resolve({
          runId: "e3f0cb2c-3ed4-40ea-bb67-fc597e8cac4b",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });
});
