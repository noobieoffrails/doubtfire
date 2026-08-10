import { z } from "zod";

import { requireAllowedUser } from "@/auth/server";
import { getDatabase } from "@/db/client";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunManager } from "@/runs/run-manager";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<Response> {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  const parsedRunId = idSchema.safeParse((await params).runId);

  if (!parsedRunId.success) {
    return Response.json({ error: "Invalid Run ID." }, { status: 400 });
  }

  const run = await createRunManager(getDatabase()).get(parsedRunId.data);

  return Response.json(run, {
    headers: { "Cache-Control": "no-store" },
  });
}
