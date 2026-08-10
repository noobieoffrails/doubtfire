import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  prepareCleaningList,
  type NestedBulletDecision,
} from "./cleaning-list";

describe("prepareCleaningList", () => {
  it("prepares the documented fixture for review", async () => {
    const markdown = await readFile(
      new URL("../../fixtures/example-cleaning-list.md", import.meta.url),
      "utf8",
    );
    const groupNames = new Set([
      "Bedside table",
      "Sofa",
      "Cupboards and drawers",
      "Mirror cabinet",
    ]);
    const questions: string[] = [];

    const plan = await prepareCleaningList(markdown, async (question) => {
      questions.push(question.text);

      return groupNames.has(question.text)
        ? "group"
        : ("task" satisfies NestedBulletDecision);
    });

    expect(plan.routines).toEqual([
      {
        name: "Weekly",
        cadenceDays: 7,
        includesRoutineName: null,
        sortOrder: 100,
      },
      {
        name: "Fortnightly",
        cadenceDays: 14,
        includesRoutineName: "Weekly",
        sortOrder: 200,
      },
      {
        name: "Quarterly",
        cadenceDays: 91,
        includesRoutineName: "Fortnightly",
        sortOrder: 300,
      },
      {
        name: "Twice yearly",
        cadenceDays: 182,
        includesRoutineName: "Quarterly",
        sortOrder: 400,
      },
      {
        name: "Yearly",
        cadenceDays: 365,
        includesRoutineName: null,
        sortOrder: 500,
      },
    ]);
    expect(plan.rooms.map((room) => room.name)).toEqual([
      "Whole home",
      "Kitchen",
      "Bathroom",
      "Hallway",
      "Bedroom",
      "Living room",
      "Balcony",
    ]);
    expect(plan.tasks).toHaveLength(27);
    expect(plan.tasks).toContainEqual({
      text: "Run the robot vacuum",
      note: "Clear the floors of anything it can catch on first",
      roomName: "Whole home",
      groupLabel: null,
      routineName: "Weekly",
      sortOrder: 100,
    });
    expect(plan.tasks).toContainEqual({
      text: "Vacuum around it",
      note: null,
      roomName: "Bedroom",
      groupLabel: "Bedside table",
      routineName: "Fortnightly",
      sortOrder: 200,
    });
    expect(plan.tasks).toContainEqual({
      text: "Wipe the cabinet doors",
      note: "Clean off any marks",
      roomName: "Living room",
      groupLabel: "Media unit",
      routineName: "Fortnightly",
      sortOrder: 400,
    });
    expect(questions).toEqual([
      "Run the robot vacuum",
      "Clean the basin",
      "Rinse dust from behind the washing machine",
      "Bedside table",
      "Sofa",
      "Wipe the doors and light switches",
      "Cupboards and drawers",
      "Mirror cabinet",
    ]);
    expect(plan.reviewRows).toContainEqual({
      source: "## Fortnightly\nCadence: 14 days\nIncludes: Weekly",
      proposed: "Routine: Fortnightly (14 days), includes Weekly",
    });
    expect(plan.reviewRows).toContainEqual({
      source:
        "- Run the robot vacuum\n  - Clear the floors of anything it can catch on first",
      proposed:
        "Task: Run the robot vacuum | Routine: Weekly | Room: Whole home | Note: Clear the floors of anything it can catch on first",
    });
    expect(plan.reviewRows).toContainEqual({
      source: "- Bedside table\n  - Vacuum around it",
      proposed:
        "Task: Vacuum around it | Routine: Fortnightly | Room: Bedroom | Group: Bedside table",
    });
  });

  it("rejects duplicate Routine names", async () => {
    const markdown = `
## Weekly
Cadence: 7 days
**Kitchen**
- Wipe the worktops

## Weekly
Cadence: 14 days
**Bathroom**
- Clean the basin
`;

    await expect(
      prepareCleaningList(markdown, async () => "task"),
    ).rejects.toThrow('Routine "Weekly" is defined more than once.');
  });

  it("rejects an Includes target that is not a Routine", async () => {
    const markdown = `
## Fortnightly
Cadence: 14 days
Includes: Weekly
**Kitchen**
- Wipe the worktops
`;

    await expect(
      prepareCleaningList(markdown, async () => "task"),
    ).rejects.toThrow(
      'Routine "Fortnightly" includes unknown Routine "Weekly".',
    );
  });

  it("rejects a cycle in Routine Includes links", async () => {
    const markdown = `
## Weekly
Cadence: 7 days
Includes: Fortnightly
**Kitchen**
- Wipe the worktops

## Fortnightly
Cadence: 14 days
Includes: Weekly
**Bathroom**
- Clean the basin
`;

    await expect(
      prepareCleaningList(markdown, async () => "task"),
    ).rejects.toThrow("Routine Includes links contain a cycle.");
  });
});
