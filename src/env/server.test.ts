import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "./server";

describe("parseServerEnvironment", () => {
  it("accepts a PostgreSQL connection URL", () => {
    expect(
      parseServerEnvironment({
        ALLOWED_CLERK_USER_ID: "user_owner",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/doubtfire",
      }),
    ).toEqual({
      ALLOWED_CLERK_USER_ID: "user_owner",
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

  it("rejects a missing predefined Clerk user", () => {
    expect(() =>
      parseServerEnvironment({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/doubtfire",
      }),
    ).toThrow("Set ALLOWED_CLERK_USER_ID to the predefined Clerk account.");
  });
});
