import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnvironment } from "@/env/server";

import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;

const developmentGlobal = globalThis as typeof globalThis & {
  doubtfireSqlClient?: SqlClient;
};

export function getSqlClient(): SqlClient {
  if (developmentGlobal.doubtfireSqlClient) {
    return developmentGlobal.doubtfireSqlClient;
  }

  const client = postgres(getServerEnvironment().DATABASE_URL, {
    max: 10,
  });

  if (process.env.NODE_ENV !== "production") {
    developmentGlobal.doubtfireSqlClient = client;
  }

  return client;
}

export function getDatabase() {
  return drizzle(getSqlClient(), { schema });
}
