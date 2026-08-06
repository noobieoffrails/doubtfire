import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "./server";

describe("parseServerEnvironment", () => {
  it("accepts a PostgreSQL connection URL", () => {
    expect(
      parseServerEnvironment({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/doubtfire",
      }),
    ).toEqual({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/doubtfire",
    });
  });

  it("rejects a missing database URL", () => {
    expect(() => parseServerEnvironment({})).toThrow(
      "Set DATABASE_URL before the app connects to Postgres.",
    );
  });

  it("rejects a connection URL for another database type", () => {
    expect(() =>
      parseServerEnvironment({ DATABASE_URL: "mysql://localhost/doubtfire" }),
    ).toThrow("DATABASE_URL must use the postgres or postgresql scheme.");
  });
});
