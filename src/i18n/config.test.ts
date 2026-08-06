import { describe, expect, it } from "vitest";
import { getLocale, isLocale } from "./config";

describe("language configuration", () => {
  it("uses English when the cookie is missing", () => {
    expect(getLocale(undefined)).toBe("en");
  });

  it("accepts supported languages", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fi")).toBe(true);
    expect(getLocale("fi")).toBe("fi");
  });

  it("rejects an unsupported cookie value", () => {
    expect(isLocale("sv")).toBe(false);
    expect(getLocale("sv")).toBe("en");
  });
});
