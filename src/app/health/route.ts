import { getSqlClient } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getSqlClient()`select 1`;

    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
