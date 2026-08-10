import { describe, expect, it, vi } from "vitest";

import { fetchRun } from "./fetch-run";

describe("Run fetch", () => {
  it("fetches an uncached Run and restores its dates", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        id: "7fe448fa-19b1-471b-bd24-f24a8f6140ec",
        routine: {
          id: "28cf4091-36d3-4630-9f01-a06b7c69d28f",
          name: "Weekly",
        },
        startedAt: "2026-08-10T09:00:00.000Z",
        closedAt: "2026-08-10T10:00:00.000Z",
        closedByRollover: false,
        tickedCount: 0,
        rooms: [],
      }),
    );

    const run = await fetchRun(
      "7fe448fa-19b1-471b-bd24-f24a8f6140ec",
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "/api/runs/7fe448fa-19b1-471b-bd24-f24a8f6140ec",
      { cache: "no-store" },
    );
    expect(run.startedAt).toEqual(new Date("2026-08-10T09:00:00.000Z"));
    expect(run.closedAt).toEqual(new Date("2026-08-10T10:00:00.000Z"));
  });

  it("reports an unsuccessful Run fetch", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }));

    await expect(
      fetchRun("7fe448fa-19b1-471b-bd24-f24a8f6140ec", fetcher),
    ).rejects.toThrow("Cannot refresh Run.");
  });
});
