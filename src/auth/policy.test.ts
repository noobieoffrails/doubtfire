import { describe, expect, it } from "vitest";

import { getAccessDecision } from "./policy";

describe("getAccessDecision", () => {
  it("allows the public sign-in route without a user", () => {
    expect(
      getAccessDecision({
        allowedUserId: "user_owner",
        pathname: "/sign-in",
        userId: null,
      }),
    ).toBe("allow");
  });

  it.each(["/sign-in/factor-one", "/access-denied", "/health", "/robots.txt"])(
    "allows the public route %s without a user",
    (pathname) => {
      expect(
        getAccessDecision({
          allowedUserId: "user_owner",
          pathname,
          userId: null,
        }),
      ).toBe("allow");
    },
  );

  it("requires sign-in for a protected route", () => {
    expect(
      getAccessDecision({
        allowedUserId: "user_owner",
        pathname: "/",
        userId: null,
      }),
    ).toBe("sign-in");
  });

  it("allows the predefined user to open a protected route", () => {
    expect(
      getAccessDecision({
        allowedUserId: "user_owner",
        pathname: "/",
        userId: "user_owner",
      }),
    ).toBe("allow");
  });

  it("denies a different signed-in user", () => {
    expect(
      getAccessDecision({
        allowedUserId: "user_owner",
        pathname: "/",
        userId: "user_someone_else",
      }),
    ).toBe("deny");
  });
});
