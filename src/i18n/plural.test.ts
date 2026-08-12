import { describe, expect, it } from "vitest";

import { formatPlural } from "./plural";

describe("localized plurals", () => {
  it("uses the English singular only for one", () => {
    expect(formatPlural("en", "tasksDone", 0)).toBe("0 Tasks done");
    expect(formatPlural("en", "tasksDone", 1)).toBe("1 Task done");
    expect(formatPlural("en", "tasksDone", 2)).toBe("2 Tasks done");
    expect(formatPlural("en", "everyDays", 1)).toBe("Every day");
    expect(formatPlural("en", "everyDays", 2)).toBe("Every 2 days");
  });

  it("uses the Finnish singular only for one", () => {
    expect(formatPlural("fi", "tasksDone", 0)).toBe("0 tehtävää tehty");
    expect(formatPlural("fi", "tasksDone", 1)).toBe("1 tehtävä tehty");
    expect(formatPlural("fi", "tasksDone", 2)).toBe("2 tehtävää tehty");
    expect(formatPlural("fi", "everyDays", 1)).toBe("Joka päivä");
    expect(formatPlural("fi", "everyDays", 2)).toBe("Joka 2. päivä");
  });
});
