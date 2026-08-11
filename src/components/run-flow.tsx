"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Grid2X2,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  closeRunAction,
  reopenRunAction,
  setTickAction,
} from "@/app/run/actions";
import { useRunChangeRefresh } from "@/components/run-change-refresh";
import { Button } from "@/components/ui/button";
import { fetchRun } from "@/realtime/fetch-run";
import type { RunView } from "@/runs/run-manager";

export type RunCopy = {
  allTasks: string;
  backHome: string;
  backToRooms: string;
  cleaningComplete: string;
  doneWithRoom: string;
  markAsDone: string;
  markingAsDone: string;
  nextRoom: string;
  noDueTasks: string;
  roomProgress: string;
  rooms: string;
  roomsInRun: string;
  runChangeError: string;
  runCompleteDescription: string;
  runNavigation: string;
  taskList: string;
  tasksDone: string;
  undo: string;
};

type TaskMutationState = {
  queue: Promise<void>;
  ticked: boolean;
  version: number;
};

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

function RunTaskControl({
  onChange,
  roomName,
  task,
}: {
  onChange: (taskId: string, ticked: boolean) => void;
  roomName?: string;
  task: RunView["rooms"][number]["tasks"][number];
}) {
  return (
    <button
      className={roomName ? undefined : "runTaskButton"}
      type="button"
      aria-pressed={task.ticked}
      onClick={() => onChange(task.id, !task.ticked)}
    >
      <span className="taskCheck" aria-hidden="true">
        {task.ticked ? <Check strokeWidth={3} /> : null}
      </span>
      <span className={roomName ? undefined : "runTaskCopy"}>
        {roomName ? <small>{roomName}</small> : null}
        {!roomName && task.groupLabel ? <small>{task.groupLabel}</small> : null}
        <strong>{task.text}</strong>
        {!roomName && task.note ? <span>{task.note}</span> : null}
      </span>
    </button>
  );
}

function RunAlert({ message }: { message: string | null }) {
  return (
    <p className="runError" role="alert">
      {message ?? ""}
    </p>
  );
}

export function RunFlow({ initialRun, copy }: { initialRun: RunView; copy: RunCopy }) {
  const [run, setRun] = useState(initialRun);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  function changeTick(taskId: string, ticked: boolean) {
    const previousMutation = taskMutations.current.get(taskId);
    const version = (previousMutation?.version ?? 0) + 1;
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
            throw new Error("Saved Run does not contain the changed Task.");
          }

          if (taskMutations.current.get(taskId)?.version === version) {
            setRun((currentRun) => withTick(currentRun, taskId, savedTask.ticked));
          }
        } catch {
          if (taskMutations.current.get(taskId)?.version === version) {
            setRun((currentRun) => withTick(currentRun, taskId, !ticked));
            setError(copy.runChangeError);
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
          <div className="completionIsland">
            <span className="completionIcon" aria-hidden="true">
              <CheckCircle2 strokeWidth={1.8} />
            </span>
            <h1 id="completion-title">{copy.cleaningComplete}</h1>
            <p>{copy.runCompleteDescription}</p>
            <strong>{copy.tasksDone.replace("{count}", String(run.tickedCount))}</strong>
            <Link className="completionHomeLink" href="/">
              {copy.backHome}
            </Link>
          </div>
          {undoVisible ? (
            <div className="undoToast" role="status">
              <span>{copy.runCompleteDescription}</span>
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
          <nav className="runHeader" aria-label={copy.runNavigation}>
            <button className="iconButton" type="button" onClick={() => setActiveRoomId(null)}>
              <ArrowLeft aria-hidden="true" />
              <span className="srOnly">{copy.backToRooms}</span>
            </button>
            <span className="runRoutineName">{run.routine.name}</span>
            <span className="runCount">{copy.roomProgress.replace("{count}", String(activeRoom.tickedCount))}</span>
          </nav>

          <section className="roomTaskSection">
            <div className="roomTaskHeading">
              <h1 id="room-title">{activeRoom.name}</h1>
              <ListChecks aria-hidden="true" />
            </div>
            <ul className="runTaskList" aria-label={copy.taskList}>
              {activeRoom.tasks.map((task) => (
                <li key={task.id}>
                  <RunTaskControl task={task} onChange={changeTick} />
                </li>
              ))}
            </ul>
            <RunAlert message={error} />
            <Button
              className="roomDoneButton"
              type="button"
              onClick={() => setActiveRoomId(nextRoom?.id ?? null)}
            >
              {nextRoom ? copy.nextRoom : copy.doneWithRoom}
              {nextRoom ? <ChevronRight aria-hidden="true" /> : <Grid2X2 aria-hidden="true" />}
            </Button>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="runCanvas">
      <section className="runSurface" aria-labelledby="run-title">
        <nav className="runHeader" aria-label={copy.runNavigation}>
          <Link className="iconButton" href="/">
            <ArrowLeft aria-hidden="true" />
            <span className="srOnly">{copy.backHome}</span>
          </Link>
          <span className="runRoutineName">{run.routine.name}</span>
          <span className="runCount">{copy.tasksDone.replace("{count}", String(run.tickedCount))}</span>
        </nav>

        <section className="runOverview">
          <div className="runOverviewHeading">
            <h1 id="run-title">{copy.roomsInRun}</h1>
            <p>{copy.tasksDone.replace("{count}", String(run.tickedCount))}</p>
          </div>

          {run.rooms.length ? (
            <section aria-labelledby="run-rooms-title">
              <h2 className="srOnly" id="run-rooms-title">
                {copy.rooms}
              </h2>
              <ul className="runRoomGrid">
                {run.rooms.map((room, index) => (
                  <li key={room.id}>
                    <button
                      className={`runRoomIsland roomTone${index % 3}`}
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                    >
                      <span>{room.name}</span>
                      <small>{copy.roomProgress.replace("{count}", String(room.tickedCount))}</small>
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
            <section aria-labelledby="all-tasks-title">
              <h2 className="srOnly" id="all-tasks-title">
                {copy.allTasks}
              </h2>
              <details className="allTasksDisclosure">
                <summary>
                  <ListChecks aria-hidden="true" />
                  {copy.allTasks}
                  <ChevronRight className="summaryChevron" aria-hidden="true" />
                </summary>
                <ul>
                  {run.rooms.flatMap((room) =>
                    room.tasks.map((task) => (
                      <li key={task.id}>
                        <RunTaskControl
                          task={task}
                          roomName={room.name}
                          onChange={changeTick}
                        />
                      </li>
                    )),
                  )}
                </ul>
              </details>
            </section>
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
