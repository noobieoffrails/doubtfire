import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listContent = vi.hoisted(() => vi.fn());
const getHouseholdState = vi.hoisted(() => vi.fn());

vi.mock("@/app/run/actions", () => ({
  reopenRunFromHomeAction: vi.fn(),
  startRunAction: vi.fn(),
}));
vi.mock("@/auth/server", () => ({ requireAllowedUser: vi.fn() }));
vi.mock("@/components/run-change-refresh", () => ({
  RunChangeRefresh: () => null,
}));
vi.mock("@/content/content-catalog", () => ({
  createContentCatalog: vi.fn(() => ({ list: listContent })),
}));
vi.mock("@/db/client", () => ({ getDatabase: vi.fn(() => ({})) }));
vi.mock("@/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}));
vi.mock("@/lib/local-preview", () => ({
  allowsLocalPreview: vi.fn(() => true),
}));
vi.mock("@/runs/run-manager", () => ({
  createRunManager: vi.fn(() => ({ getHouseholdState })),
}));

import HomePage from "./page";

const routine = {
  id: "8df352fb-f425-47d8-bbda-e56683027e38",
  name: "Weekly",
};

describe("Home page Run flow", () => {
  beforeEach(() => {
    listContent.mockReset();
    getHouseholdState.mockReset();
    listContent.mockResolvedValue({ rooms: [], routines: [routine], tasks: [] });
    getHouseholdState.mockResolvedValue({ openRun: null, resumableRun: null });
  });

  it("puts the start action after the Routine choices", async () => {
    const html = renderToStaticMarkup(await HomePage());
    const routineChoicePosition = html.indexOf(`value="${routine.id}"`);
    const startActionPosition = html.indexOf("Start cleaning");

    expect(routineChoicePosition).toBeGreaterThan(-1);
    expect(startActionPosition).toBeGreaterThan(routineChoicePosition);
  });

  it("replaces Routine controls with a quiet summary while a Run is open", async () => {
    getHouseholdState.mockResolvedValue({
      openRun: {
        id: "b0c1ae39-7b6e-49c5-ad78-128015655547",
        routine,
        tickedCount: 4,
      },
      resumableRun: null,
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).not.toContain('type="radio"');
    expect(html).toContain(routine.name);
  });
});
