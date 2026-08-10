import type { RunView } from "@/runs/run-manager";

type SerializedRunView = Omit<RunView, "closedAt" | "startedAt"> & {
  closedAt: string | null;
  startedAt: string;
};

type RunFetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export async function fetchRun(
  runId: string,
  fetcher: RunFetcher = fetch,
): Promise<RunView> {
  const response = await fetcher(`/api/runs/${encodeURIComponent(runId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Cannot refresh Run.");
  }

  const run = (await response.json()) as SerializedRunView;

  return {
    ...run,
    startedAt: new Date(run.startedAt),
    closedAt: run.closedAt ? new Date(run.closedAt) : null,
  };
}
