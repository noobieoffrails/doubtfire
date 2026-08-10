import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL before you close stale Runs.");
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  const closedRuns = await sql`
    select "run_id"
    from "close_stale_runs"(now(), 'Europe/Helsinki')
  `;

  console.log(`Closed ${closedRuns.length} stale Run(s).`);
} finally {
  await sql.end();
}
