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
import { useEffect, useRef, useState, useTransition } from "react";

import {
  closeRunAction,
  reopenRunAction,
  setTickAction,
} from "@/app/run/actions";
import { Button } from "@/components/ui/button";
import type { RunView } from "@/runs/run-manager";

export type RunCopy = {
  allTasks: string;
  backHome: string;
  backToRooms: string;
  cleaningComplete: string;
  doneWithRoom: string;
  markAsDone: string;
  nextRoom: string;
  noDueTasks: string;
  roomProgress: string;
  roomsInRun: string;
  runChangeError: string;
  runCompleteDescription: string;
  taskList: string;
  tasksDone: string;
  undo: string;
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

export function RunFlow({ initialRun, copy }: { initialRun: RunView; copy: RunCopy }) {
  const [run, setRun] = useState(initialRun);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [isClosing, startClosing] = useTransition();
  const taskMutationQueues = useRef(new Map<string, Promise<void>>());
  const taskMutationVersions = useRef(new Map<string, number>());
  const activeRoom = run.rooms.find((room) => room.id === activeRoomId) ?? null;

  useEffect(() => {
    if (!undoVisible) {
      return;
    }

    const timer = window.setTimeout(() => setUndoVisible(false), 30_000);
    return () => window.clearTimeout(timer);
  }, [undoVisible]);

  function changeTick(taskId: string, ticked: boolean) {
    const version = (taskMutationVersions.current.get(taskId) ?? 0) + 1;
    taskMutationVersions.current.set(taskId, version);
    setError(null);
    setRun((currentRun) => withTick(currentRun, taskId, ticked));

    const previousRequest = taskMutationQueues.current.get(taskId) ?? Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(async () => {
        try {
          const savedRun = await setTickAction({ runId: run.id, taskId, ticked });
          const savedTask = savedRun.rooms
            .flatMap((room) => room.tasks)
            .find((task) => task.id === taskId);

          if (savedTask && taskMutationVersions.current.get(taskId) === version) {
            setRun((currentRun) => withTick(currentRun, taskId, savedTask.ticked));
          }
        } catch {
          if (taskMutationVersions.current.get(taskId) === version) {
            setRun((currentRun) => withTick(currentRun, taskId, !ticked));
            setError(copy.runChangeError);
          }
        }
      })
      .finally(() => {
        if (taskMutationQueues.current.get(taskId) === request) {
          taskMutationQueues.current.delete(taskId);
        }
      });

    taskMutationQueues.current.set(taskId, request);
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
          {error ? <p className="runError">{error}</p> : null}
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
          <header className="runHeader">
            <button className="iconButton" type="button" onClick={() => setActiveRoomId(null)}>
              <ArrowLeft aria-hidden="true" />
              <span className="srOnly">{copy.backToRooms}</span>
            </button>
            <span className="runRoutineName">{run.routine.name}</span>
            <span className="runCount">{copy.roomProgress.replace("{count}", String(activeRoom.tickedCount))}</span>
          </header>

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
            {error ? <p className="runError">{error}</p> : null}
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
        <header className="runHeader">
          <Link className="iconButton" href="/">
            <ArrowLeft aria-hidden="true" />
            <span className="srOnly">{copy.backHome}</span>
          </Link>
          <span className="runRoutineName">{run.routine.name}</span>
          <span className="runCount">{copy.tasksDone.replace("{count}", String(run.tickedCount))}</span>
        </header>

        <section className="runOverview">
          <div className="runOverviewHeading">
            <h1 id="run-title">{copy.roomsInRun}</h1>
            <p>{copy.tasksDone.replace("{count}", String(run.tickedCount))}</p>
          </div>

          {run.rooms.length ? (
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
          ) : (
            <p className="runEmptyState">{copy.noDueTasks}</p>
          )}

          {run.rooms.length ? (
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
          ) : null}

          {error ? <p className="runError">{error}</p> : null}
          <Button className="markDoneButton" type="button" disabled={isClosing} onClick={closeRun}>
            <CheckCircle2 aria-hidden="true" />
            {copy.markAsDone}
          </Button>
        </section>
      </section>
    </main>
  );
}
