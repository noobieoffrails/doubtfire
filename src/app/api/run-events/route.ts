import { requireAllowedUser } from "@/auth/server";
import { getSqlClient } from "@/db/client";
import { allowsLocalPreview } from "@/lib/local-preview";
import { createRunEventResponse } from "@/realtime/run-event-response";
import { listenForRunChanges } from "@/realtime/run-events";

export async function GET(request: Request): Promise<Response> {
  if (!allowsLocalPreview()) {
    await requireAllowedUser();
  }

  return createRunEventResponse({
    signal: request.signal,
    subscribe: (onChange) => listenForRunChanges(getSqlClient(), onChange),
  });
}
