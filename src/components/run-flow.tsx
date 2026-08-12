"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Grid2X2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import {
  closeRunAction,
  reopenRunAction,
  setTickAction,
} from "@/app/run/actions";
import { useRunChangeRefresh } from "@/components/run-change-refresh";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { formatPlural } from "@/i18n/plural";
import { fetchRun } from "@/realtime/fetch-run";
import type { RunTask, RunView } from "@/runs/run-manager";

export type RunCopy = {
  allTasks: string;
  backHome: string;
  backToRooms: string;
  cleaningComplete: string;
  doneWithRoom: string;
  doubtfireHome: string;
  markAsDone: string;
  markingAsDone: string;
  nextRoom: string;
  noDueTasks: string;
  productName: string;
  retryTaskChange: string;
  rooms: string;
  roomsInRun: string;
  runChangeError: string;
  runClosed: string;
  runCompleteDescription: string;
  runNavigation: string;
  runView: string;
  switchRoom: string;
  taskChangeError: string;
  taskList: string;
  undo: string;
};

type TaskMutationState = {
  queue: Promise<void>;
  ticked: boolean;
  version: number;
};

type RunViewMode = "rooms" | "tasks";

type TaskGroup = {
  label: string | null;
  tasks: RunTask[];
};

const RUN_VIEW_STORAGE_KEY = "doubtfire-run-view";
const RUN_VIEW_CHANGE_EVENT = "doubtfire-run-view-change";
let currentRunView: RunViewMode = "rooms";

class RunViewSynchronizationError extends Error {
  override name = "RunViewSynchronizationError";
}

function getStoredRunView(): RunViewMode {
  try {
    const savedView = window.localStorage.getItem(RUN_VIEW_STORAGE_KEY);
    currentRunView = savedView === "tasks" ? "tasks" : "rooms";
  } catch {
    // Keep the in-memory choice when browser storage is not available.
  }

  return currentRunView;
}

function subscribeToStoredRunView(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RUN_VIEW_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RUN_VIEW_CHANGE_EVENT, onStoreChange);
  };
}

function withTick(
  run: RunView,
  taskId: string,
  ticked: boolean,
): RunView {
  const rooms = run.rooms.map((room) => {
    const tasks = room.tasks.map((task) =>
      task.id === taskId ? { ...task, ticked } : task,
    );

    return {
      ...room,
      tasks,
      tickedCount: tasks.filter((task) => task.ticked).length,
    };
  });

  return {
    ...run,
    rooms,
    tickedCount: rooms.reduce((count, room) => count + room.tickedCount, 0),
  };
}

function groupTasks(tasks: RunTask[]): TaskGroup[] {
  return tasks.reduce<TaskGroup[]>((groups, task) => {
    const existingGroup = groups.find((group) => group.label === task.groupLabel);

    if (existingGroup) {
      existingGroup.tasks.push(task);
      return groups;
    }

    groups.push({ label: task.groupLabel, tasks: [task] });
    return groups;
  }, []);
}

function RunHeader({
  copy,
  count,
  locale,
  routineName,
}: {
  copy: RunCopy;
  count: number;
  locale: Locale;
  routineName: string;
}) {
  return (
    <nav className="runHeader" aria-label={copy.runNavigation}>
      <Link className="runWordmark" href="/" aria-label={copy.doubtfireHome}>
        {copy.productName}
      </Link>
      <span className="runRoutineName">{routineName}</span>
      <span className="runCount">{formatPlural(locale, "tasksDone", count)}</span>
    </nav>
  );
}

function RunTaskControl({
  copy,
  failedTick,
  onChange,
  onRetry,
  task,
}: {
  copy: RunCopy;
  failedTick: boolean | undefined;
  onChange: (taskId: string, ticked: boolean) => void;
  onRetry: (taskId: string, ticked: boolean) => void;
  task: RunTask;
}) {
  const noteId = task.note ? `task-note-${task.id}` : undefined;

  return (
    <div className="runTaskControl" data-ticked={task.ticked}>
      <button
        className="runTaskButton"
        type="button"
        aria-describedby={noteId}
        aria-pressed={task.ticked}
        onClick={() => onChange(task.id, !task.ticked)}
      >
        <span className="taskCheck" aria-hidden="true">
          {task.ticked ? <Check strokeWidth={3} /> : null}
        </span>
        <span className="runTaskCopy">
          <strong>{task.text}</strong>
        </span>
      </button>
      {task.note ? (
        <p className="runTaskNote" id={noteId}>
          {task.note}
        </p>
      ) : null}
      {failedTick !== undefined ? (
        <div className="runTaskFailure" role="alert">
          <span>{copy.taskChangeError}</span>
          <button
            type="button"
            aria-label={`${copy.retryTaskChange} ${task.text}`}
            onClick={() => onRetry(task.id, failedTick)}
          >
            {copy.retryTaskChange}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RunTaskGroups({
  copy,
  failedTicks,
  groupHeadingLevel,
  onChange,
  onRetry,
  tasks,
}: {
  copy: RunCopy;
  failedTicks: Record<string, boolean>;
  groupHeadingLevel: 2 | 3;
  onChange: (taskId: string, ticked: boolean) => void;
  onRetry: (taskId: string, ticked: boolean) => void;
  tasks: RunTask[];
}) {
  const GroupHeading = groupHeadingLevel === 2 ? "h2" : "h3";

  return (
    <div className="runTaskGroups">
      {groupTasks(tasks).map((group, groupIndex) => {
        const groupId = group.label
          ? `task-group-${groupHeadingLevel}-${group.tasks[0].id}`
          : undefined;

        return (
          <section
            className="runTaskGroup"
            aria-labelledby={groupId}
            key={`${group.label ?? "ungrouped"}-${groupIndex}`}
          >
            {group.label ? (
              <GroupHeading className="runTaskGroupHeading" id={groupId}>
                {group.label}
              </GroupHeading>
            ) : null}
            <ul className="runTaskList" aria-label={group.label ? undefined : copy.taskList}>
              {group.tasks.map((task) => (
                <li key={task.id}>
                  <RunTaskControl
                    copy={copy}
                    failedTick={failedTicks[task.id]}
                    task={task}
                    onChange={onChange}
                    onRetry={onRetry}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function RunAlert({ message }: { message: string | null }) {
  return (
    <p className="runError" role="alert">
      {message ?? ""}
    </p>
  );
}

export function RunFlow({
  initialRun,
  locale,
  copy,
}: {
  initialRun: RunView;
  locale: Locale;
  copy: RunCopy;
}) {
  const [run, setRun] = useState(initialRun);
  const runView = useSyncExternalStore(
    subscribeToStoredRunView,
    getStoredRunView,
    () => "rooms",
  );
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedTicks, setFailedTicks] = useState<Record<string, boolean>>({});
  const [undoVisible, setUndoVisible] = useState(false);
  const [isClosing, startClosing] = useTransition();
  const taskMutations = useRef(new Map<string, TaskMutationState>());
  const activeRoom = run.rooms.find((room) => room.id === activeRoomId) ?? null;

  const refreshCurrentRun = useCallback(async () => {
    let synchronizedRun = await fetchRun(run.id);

    for (const [taskId, mutation] of taskMutations.current) {
      synchronizedRun = withTick(synchronizedRun, taskId, mutation.ticked);
    }

    setRun(synchronizedRun);

    if (synchronizedRun.closedAt) {
      setActiveRoomId(null);
    }
  }, [run.id]);

  useRunChangeRefresh(refreshCurrentRun);

  useEffect(() => {
    if (!undoVisible) {
      return;
    }

    const timer = window.setTimeout(() => setUndoVisible(false), 30_000);
    return () => window.clearTimeout(timer);
  }, [undoVisible]);

  function chooseRunView(view: RunViewMode) {
    currentRunView = view;

    try {
      window.localStorage.setItem(RUN_VIEW_STORAGE_KEY, view);
    } catch {
      // The current tab can still use the selected view without browser storage.
    }

    window.dispatchEvent(new Event(RUN_VIEW_CHANGE_EVENT));
  }

  function clearFailedTick(taskId: string) {
    setFailedTicks((currentFailures) => {
      if (!(taskId in currentFailures)) {
        return currentFailures;
      }

      const nextFailures = { ...currentFailures };
      delete nextFailures[taskId];
      return nextFailures;
    });
  }

  function changeTick(taskId: string, ticked: boolean) {
    const previousMutation = taskMutations.current.get(taskId);
    const version = (previousMutation?.version ?? 0) + 1;
    clearFailedTick(taskId);
    setError(null);
    setRun((currentRun) => withTick(currentRun, taskId, ticked));

    const previousRequest = previousMutation?.queue ?? Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(async () => {
        try {
          const savedRun = await setTickAction({ runId: run.id, taskId, ticked });
          const savedTask = savedRun.rooms
            .flatMap((room) => room.tasks)
            .find((task) => task.id === taskId);

          if (!savedTask) {
            throw new RunViewSynchronizationError(
              "Saved Run does not contain the changed Task.",
            );
          }

          if (taskMutations.current.get(taskId)?.version === version) {
            setRun((currentRun) => withTick(currentRun, taskId, savedTask.ticked));
          }
        } catch {
          if (taskMutations.current.get(taskId)?.version === version) {
            setRun((currentRun) => withTick(currentRun, taskId, !ticked));
            setFailedTicks((currentFailures) => ({
              ...currentFailures,
              [taskId]: ticked,
            }));
          }
        }
      })
      .finally(() => {
        if (taskMutations.current.get(taskId)?.queue === request) {
          taskMutations.current.delete(taskId);
        }
      });

    taskMutations.current.set(taskId, { queue: request, ticked, version });
  }

  function closeRun() {
    setError(null);
    startClosing(async () => {
      try {
        const closedRun = await closeRunAction(run.id);
        setRun(closedRun);
        setActiveRoomId(null);
        setUndoVisible(true);
      } catch {
        setError(copy.runChangeError);
      }
    });
  }

  async function undoClose() {
    setError(null);

    try {
      const reopenedRun = await reopenRunAction(run.id);
      setRun(reopenedRun);
      setUndoVisible(false);
    } catch {
      setUndoVisible(false);
      setError(copy.runChangeError);
    }
  }

  if (run.closedAt) {
    return (
      <main className="runCanvas">
        <section className="runSurface completionSurface" aria-labelledby="completion-title">
          <Link className="completionWordmark" href="/" aria-label={copy.doubtfireHome}>
            {copy.productName}
          </Link>
          <div className="completionIsland">
            <span className="completionIcon" aria-hidden="true">
              <CheckCircle2 strokeWidth={1.8} />
            </span>
            <h1 id="completion-title">{copy.cleaningComplete}</h1>
            <p>{copy.runCompleteDescription}</p>
            <strong>{formatPlural(locale, "tasksDone", run.tickedCount)}</strong>
            <Link className="completionHomeLink" href="/">
              {copy.backHome}
            </Link>
          </div>
          {undoVisible ? (
            <div className="undoToast" role="status">
              <span>{copy.runClosed}</span>
              <button type="button" onClick={undoClose}>
                <RotateCcw aria-hidden="true" />
                {copy.undo}
              </button>
            </div>
          ) : null}
          <RunAlert message={error} />
        </section>
      </main>
    );
  }

  if (activeRoom) {
    const roomIndex = run.rooms.findIndex((room) => room.id === activeRoom.id);
    const nextRoom = run.rooms[roomIndex + 1] ?? null;

    return (
      <main className="runCanvas">
        <section className="runSurface" aria-labelledby="room-title">
          <RunHeader
            copy={copy}
            count={activeRoom.tickedCount}
            locale={locale}
            routineName={run.routine.name}
          />

          <section className="roomTaskSection">
            <header className="roomTaskHero">
              <div className="roomTaskHeading">
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => setActiveRoomId(null)}
                >
                  <ArrowLeft aria-hidden="true" />
                  <span className="srOnly">{copy.backToRooms}</span>
                </button>
                <h1 id="room-title">{activeRoom.name}</h1>
              </div>
              <div className="roomSwitcher" role="group" aria-label={copy.switchRoom}>
                {run.rooms.map((room) => (
                  <button
                    type="button"
                    aria-pressed={room.id === activeRoom.id}
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            </header>

            <RunTaskGroups
              copy={copy}
              failedTicks={failedTicks}
              groupHeadingLevel={2}
              tasks={activeRoom.tasks}
              onChange={changeTick}
              onRetry={changeTick}
            />
            <RunAlert message={error} />
            <div className="roomDoneDock">
              <Button
                className="roomDoneButton"
                type="button"
                onClick={() => setActiveRoomId(nextRoom?.id ?? null)}
              >
                {nextRoom ? copy.nextRoom : copy.doneWithRoom}
                {nextRoom ? (
                  <ChevronRight aria-hidden="true" />
                ) : (
                  <Grid2X2 aria-hidden="true" />
                )}
              </Button>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="runCanvas">
      <section className="runSurface" aria-labelledby="run-title">
        <RunHeader
          copy={copy}
          count={run.tickedCount}
          locale={locale}
          routineName={run.routine.name}
        />

        <section className="runOverview">
          <div className="runOverviewHeading">
            <h1 id="run-title">{runView === "rooms" ? copy.roomsInRun : copy.allTasks}</h1>
          </div>

          {run.rooms.length ? (
            <div className="runViewChoices" role="group" aria-label={copy.runView}>
              <button
                type="button"
                aria-pressed={runView === "rooms"}
                onClick={() => chooseRunView("rooms")}
              >
                {copy.rooms}
              </button>
              <button
                type="button"
                aria-pressed={runView === "tasks"}
                onClick={() => chooseRunView("tasks")}
              >
                {copy.allTasks}
              </button>
            </div>
          ) : null}

          {run.rooms.length ? (
            <section
              className="runRoomsView"
              aria-labelledby="run-rooms-title"
              hidden={runView !== "rooms"}
            >
              <h2 className="srOnly" id="run-rooms-title">
                {copy.rooms}
              </h2>
              <ul className="runRoomGrid">
                {run.rooms.map((room) => (
                  <li key={room.id}>
                    <button
                      className="runRoomIsland"
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                    >
                      <span>{room.name}</span>
                      <small>{formatPlural(locale, "tasksDone", room.tickedCount)}</small>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="runEmptyState">{copy.noDueTasks}</p>
          )}

          {run.rooms.length ? (
            <div className="allTasksView" hidden={runView !== "tasks"}>
              {run.rooms.map((room) => {
                const roomHeadingId = `all-tasks-room-${room.id}`;

                return (
                  <section
                    className="allTasksRoom"
                    aria-labelledby={roomHeadingId}
                    key={room.id}
                  >
                    <h2 id={roomHeadingId}>{room.name}</h2>
                    <RunTaskGroups
                      copy={copy}
                      failedTicks={failedTicks}
                      groupHeadingLevel={3}
                      tasks={room.tasks}
                      onChange={changeTick}
                      onRetry={changeTick}
                    />
                  </section>
                );
              })}
            </div>
          ) : null}

          <RunAlert message={error} />
          <Button className="markDoneButton" type="button" disabled={isClosing} onClick={closeRun}>
            <CheckCircle2 aria-hidden="true" />
            {isClosing ? copy.markingAsDone : copy.markAsDone}
          </Button>
        </section>
      </section>
    </main>
  );
}
