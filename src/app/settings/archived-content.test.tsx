// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  restoreRoomAction: vi.fn(),
  restoreRoutineAction: vi.fn(),
  restoreTaskAction: vi.fn(),
}));

import { dictionaries } from "@/i18n/config";

import { ArchivedContent } from "./archived-content";

describe("ArchivedContent", () => {
  afterEach(cleanup);

  it("shows the localized empty state", () => {
    render(
      <ArchivedContent
        content={{ rooms: [], routines: [], tasks: [] }}
        copy={dictionaries.fi}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: dictionaries.fi.archivedContent,
      }),
    ).toBeTruthy();
    expect(screen.getByText(dictionaries.fi.noArchivedContent)).toBeTruthy();
  });

  it("groups archived content and names each Restore action", () => {
    render(
      <ArchivedContent
        content={{
          routines: [
            {
              id: "e997b72d-e4a8-48a9-a48a-a10db49c4af1",
              name: "Weekly",
              cadenceDays: 7,
              includesRoutineId: null,
              sortOrder: 10,
              archivedAt: null,
            },
            {
              id: "e7027290-d684-4864-853f-bcc8a9c597a2",
              name: "Seasonal",
              cadenceDays: 90,
              includesRoutineId: null,
              sortOrder: 20,
              archivedAt: new Date("2026-08-01T08:00:00.000Z"),
            },
          ],
          rooms: [
            {
              id: "f0c980d1-cf3d-4cf4-82eb-e606a198cd46",
              name: "Kitchen",
              sortOrder: 10,
              archivedAt: null,
            },
            {
              id: "d41ddd14-0c04-411d-92b1-82d0f0277936",
              name: "Loft",
              sortOrder: 20,
              archivedAt: new Date("2026-08-01T08:00:00.000Z"),
            },
          ],
          tasks: [
            {
              id: "5b9fcffa-3ec4-47c4-9013-02172578fada",
              text: "Wipe the worktops",
              note: null,
              roomId: "f0c980d1-cf3d-4cf4-82eb-e606a198cd46",
              groupLabel: null,
              routineId: "e997b72d-e4a8-48a9-a48a-a10db49c4af1",
              sortOrder: 10,
              archivedAt: new Date("2026-08-01T08:00:00.000Z"),
            },
          ],
        }}
        copy={dictionaries.en}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Archived Routines" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Archived Rooms" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Archived Tasks" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore Seasonal" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore Loft" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Restore Wipe the worktops" }),
    ).toBeTruthy();
    expect(screen.getByText("Weekly · Kitchen")).toBeTruthy();
  });

  it("explains why a Task cannot be restored before its parent content", () => {
    render(
      <ArchivedContent
        content={{
          routines: [
            {
              id: "e997b72d-e4a8-48a9-a48a-a10db49c4af1",
              name: "Weekly",
              cadenceDays: 7,
              includesRoutineId: null,
              sortOrder: 10,
              archivedAt: null,
            },
          ],
          rooms: [
            {
              id: "d41ddd14-0c04-411d-92b1-82d0f0277936",
              name: "Loft",
              sortOrder: 10,
              archivedAt: new Date("2026-08-01T08:00:00.000Z"),
            },
          ],
          tasks: [
            {
              id: "5b9fcffa-3ec4-47c4-9013-02172578fada",
              text: "Dust the shelves",
              note: null,
              roomId: "d41ddd14-0c04-411d-92b1-82d0f0277936",
              groupLabel: null,
              routineId: "e997b72d-e4a8-48a9-a48a-a10db49c4af1",
              sortOrder: 10,
              archivedAt: new Date("2026-08-01T08:00:00.000Z"),
            },
          ],
        }}
        copy={dictionaries.en}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Restore Dust the shelves" }),
    ).toBeNull();
    expect(screen.getByText(dictionaries.en.contentRestoreBlocked)).toBeTruthy();
  });
});
