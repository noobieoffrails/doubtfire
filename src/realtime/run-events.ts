import type { Sql } from "postgres";

export type RunChange = {
  runId: string;
};

const RUN_CHANGE_CHANNEL = "doubtfire_run_change";

export async function listenForRunChanges(
  sql: Sql,
  onChange: (change: RunChange) => void,
): Promise<() => Promise<void>> {
  const listener = await sql.listen(RUN_CHANGE_CHANNEL, (payload) => {
    const change: unknown = JSON.parse(payload);

    if (
      typeof change === "object" &&
      change !== null &&
      "runId" in change &&
      typeof change.runId === "string"
    ) {
      onChange({ runId: change.runId });
    }
  });

  return () => listener.unlisten();
}
