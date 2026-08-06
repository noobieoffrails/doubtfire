import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("asks every crawler not to index any route", () => {
    expect(robots()).toEqual({
      rules: {
        disallow: "/",
        userAgent: "*",
      },
    });
  });
});
