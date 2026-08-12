// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost/" }

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const closeRunAction = vi.hoisted(() => vi.fn());
const reopenRunAction = vi.hoisted(() => vi.fn());
const setTickAction = vi.hoisted(() => vi.fn());
const storedValues = new Map<string, string>();
let storageUnavailable = false;

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    clear: () => storedValues.clear(),
    getItem: (key: string) => {
      if (storageUnavailable) {
        throw new DOMException("Storage is not available.", "SecurityError");
      }

      return storedValues.get(key) ?? null;
    },
    removeItem: (key: string) => storedValues.delete(key),
    setItem: (key: string, value: string) => storedValues.set(key, value),
  },
});

vi.mock("@/app/run/actions", () => ({
  closeRunAction,
  reopenRunAction,
  setTickAction,
}));
vi.mock("@/components/run-change-refresh", () => ({
  useRunChangeRefresh: vi.fn(),
}));
vi.mock("@/realtime/fetch-run", () => ({ fetchRun: vi.fn() }));

import { RunFlow, type RunCopy } from "./run-flow";

const copy = {
  allTasks: "All Tasks",
  backHome: "Back to home",
  backToRooms: "Back to Rooms",
  cleaningComplete: "Cleaning complete.",
  doneWithRoom: "Done with this Room",
  doubtfireHome: "Doubtfire home",
  markAsDone: "Mark as done",
  markingAsDone: "Marking as done…",
  nextRoom: "Next Room",
  noDueTasks: "No Tasks are Due in this Run.",
  productName: "Doubtfire",
  retryTaskChange: "Try again",
  rooms: "Rooms",
  roomsInRun: "Choose a Room",
  runChangeError: "Could not save the change. Try again.",
  runClosed: "Run closed",
  runCompleteDescription: "This Run is marked as done.",
  runNavigation: "Run navigation",
  runView: "Run view",
  switchRoom: "Switch Room",
  taskChangeError: "Could not save this Task.",
  taskList: "Tasks in this Room",
  undo: "Undo",
} satisfies RunCopy;

const run = {
  id: "3bca12a7-e8e8-4cad-9c15-60f26af97825",
  routine: {
    id: "78cad239-2a30-4793-bfca-76ef265022db",
    name: "Routine One",
  },
  startedAt: new Date("2026-08-12T08:00:00.000Z"),
  closedAt: null,
  closedByRollover: false,
  tickedCount: 0,
  rooms: [
    {
      id: "8ac8e64c-1b27-45ff-b735-eae5b738ffdd",
      name: "Room One",
      sortOrder: 10,
      tickedCount: 0,
      tasks: [
        {
          id: "d1c745a6-815a-408d-9726-0c6ca25d8412",
          text: "Task One",
          note: "Use the soft cloth.",
          groupLabel: "Group One",
          sortOrder: 10,
          ticked: false,
        },
        {
          id: "e40be418-c668-4305-b7d3-86952c0565fe",
          text: "Task without a Group",
          note: null,
          groupLabel: null,
          sortOrder: 20,
          ticked: false,
        },
        {
          id: "56c8cbe9-9c32-47b5-8060-07f7367e8e71",
          text: "Task Two",
          note: null,
          groupLabel: "Group One",
          sortOrder: 30,
          ticked: false,
        },
      ],
    },
    {
      id: "dd76be39-213f-4f41-a194-ab1d5e2937d3",
      name: "Room Two",
      sortOrder: 20,
      tickedCount: 0,
      tasks: [
        {
          id: "4ea4bc48-ddf5-42e4-a3fb-bc704c2549df",
          text: "Task Three",
          note: null,
          groupLabel: null,
          sortOrder: 10,
          ticked: false,
        },
      ],
    },
  ],
};

describe("RunFlow", () => {
  beforeEach(() => {
    storageUnavailable = false;
    window.localStorage.clear();
    setTickAction.mockReset();
  });

  afterEach(cleanup);

  it("uses Rooms when browser storage is not available", () => {
    storageUnavailable = true;

    render(<RunFlow initialRun={run} locale="en" copy={copy} />);

    expect(screen.getByRole("button", { name: copy.rooms }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("makes Rooms and All Tasks equal choices and remembers the last choice", async () => {
    const firstRender = render(<RunFlow initialRun={run} locale="en" copy={copy} />);
    const viewChoices = screen.getByRole("group", { name: copy.runView });
    const roomsChoice = within(viewChoices).getByRole("button", { name: copy.rooms });
    const allTasksChoice = within(viewChoices).getByRole("button", { name: copy.allTasks });

    expect(roomsChoice.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(allTasksChoice);

    expect(allTasksChoice.getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem("doubtfire-run-view")).toBe("tasks");

    firstRender.unmount();
    render(<RunFlow initialRun={run} locale="en" copy={copy} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: copy.allTasks }).getAttribute("aria-pressed"))
        .toBe("true");
    });
  });

  it("switches directly between Rooms", () => {
    render(<RunFlow initialRun={run} locale="en" copy={copy} />);

    fireEvent.click(screen.getByRole("button", { name: /Room One/ }));
    const switcher = screen.getByRole("group", { name: copy.switchRoom });
    fireEvent.click(within(switcher).getByRole("button", { name: "Room Two" }));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Room Two");
  });

  it("uses one Group heading and keeps the Note out of the Task name", () => {
    render(<RunFlow initialRun={run} locale="en" copy={copy} />);
    fireEvent.click(screen.getByRole("button", { name: copy.allTasks }));

    expect(screen.getAllByRole("heading", { name: "Group One" })).toHaveLength(1);

    const task = screen.getByRole("button", { name: "Task One" });
    const descriptionId = task.getAttribute("aria-describedby");

    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId ?? "")?.textContent).toBe("Use the soft cloth.");

    const noteIds = [...document.querySelectorAll('[id^="task-note-"]')].map(
      (element) => element.id,
    );
    expect(new Set(noteIds).size).toBe(noteIds.length);
  });

  it("puts a failed Tick and its retry on the Task row", async () => {
    setTickAction
      .mockRejectedValueOnce(new Error("English exception message"))
      .mockResolvedValueOnce({
        ...run,
        tickedCount: 1,
        rooms: [
          {
            ...run.rooms[0],
            tickedCount: 1,
            tasks: [
              { ...run.rooms[0].tasks[0], ticked: true },
              ...run.rooms[0].tasks.slice(1),
            ],
          },
          run.rooms[1],
        ],
      });

    render(<RunFlow initialRun={run} locale="en" copy={copy} />);
    fireEvent.click(screen.getByRole("button", { name: copy.allTasks }));
    const task = screen.getByRole("button", { name: "Task One" });

    fireEvent.click(task);
    expect(task.getAttribute("aria-pressed")).toBe("true");

    await waitFor(() => {
      expect(task.getAttribute("aria-pressed")).toBe("false");
    });

    const row = task.closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByRole("alert").textContent).toContain(
      copy.taskChangeError,
    );
    expect(row?.textContent).not.toContain("English exception message");

    await act(async () => {
      fireEvent.click(
        within(row as HTMLElement).getByRole("button", {
          name: `${copy.retryTaskChange} Task One`,
        }),
      );
    });

    await waitFor(() => {
      expect(task.getAttribute("aria-pressed")).toBe("true");
    });
    expect(within(row as HTMLElement).queryByRole("alert")).toBeNull();
  });
});
