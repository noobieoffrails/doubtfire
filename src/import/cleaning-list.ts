export type NestedBulletDecision = "group" | "task";

export type NestedBulletQuestion = {
  text: string;
  children: string[];
  sourceLine: number;
};

export type RoutineImport = {
  name: string;
  cadenceDays: number;
  includesRoutineName: string | null;
  sortOrder: number;
};

export type RoomImport = {
  name: string;
  sortOrder: number;
};

export type TaskImport = {
  text: string;
  note: string | null;
  roomName: string;
  groupLabel: string | null;
  routineName: string;
  sortOrder: number;
};

export type ImportReviewRow = {
  source: string;
  proposed: string;
};

export type CleaningListPlan = {
  routines: RoutineImport[];
  rooms: RoomImport[];
  tasks: TaskImport[];
  reviewRows: ImportReviewRow[];
};

export type DecideNestedBullet = (
  question: NestedBulletQuestion,
) => Promise<NestedBulletDecision>;

type Bullet = {
  text: string;
  sourceLine: number;
  children: Bullet[];
};

type RoomDraft = {
  name: string;
  sourceLine: number;
  bullets: Bullet[];
};

type RoutineDraft = {
  name: string;
  sourceLine: number;
  cadenceDays: number | null;
  includesRoutineName: string | null;
  rooms: RoomDraft[];
};

type IgnoredSourceLine = {
  sourceLine: number;
  text: string;
};

type CleaningListDraft = {
  routines: RoutineDraft[];
  ignoredLines: IgnoredSourceLine[];
};

type OrderedReviewRow = ImportReviewRow & {
  sourceLine: number;
};

type TaskDraftForReview = Omit<TaskImport, "sortOrder"> & {
  source: string;
  sourceLine: number;
};

const sortOrderGap = 100;

function parseDraft(markdown: string): CleaningListDraft {
  const routines: RoutineDraft[] = [];
  const ignoredLines: IgnoredSourceLine[] = [];
  let routine: RoutineDraft | null = null;
  let room: RoomDraft | null = null;
  let bulletStack: Bullet[] = [];

  for (const [index, line] of markdown.split(/\r?\n/u).entries()) {
    const sourceLine = index + 1;
    const routineMatch = line.match(/^##\s+(.+?)\s*$/u);

    if (routineMatch) {
      routine = {
        name: routineMatch[1],
        sourceLine,
        cadenceDays: null,
        includesRoutineName: null,
        rooms: [],
      };
      routines.push(routine);
      room = null;
      bulletStack = [];
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    if (!routine) {
      ignoredLines.push({ sourceLine, text: line });
      continue;
    }

    const cadenceMatch = line.match(/^Cadence:\s*(\d+)\s+days?\s*$/iu);

    if (cadenceMatch) {
      if (routine.cadenceDays !== null) {
        throw new Error(
          `Routine "${routine.name}" has more than one Cadence.`,
        );
      }

      routine.cadenceDays = Number.parseInt(cadenceMatch[1], 10);
      continue;
    }

    const includesMatch = line.match(/^Includes:\s*(.+?)\s*$/iu);

    if (includesMatch) {
      if (routine.includesRoutineName !== null) {
        throw new Error(
          `Routine "${routine.name}" has more than one Includes line.`,
        );
      }

      routine.includesRoutineName = includesMatch[1];
      continue;
    }

    const roomMatch = line.match(/^\*\*(.+?)\*\*\s*$/u);

    if (roomMatch) {
      room = { name: roomMatch[1], sourceLine, bullets: [] };
      routine.rooms.push(room);
      bulletStack = [];
      continue;
    }

    const bulletMatch = line.match(/^(\s*)-\s+(.+?)\s*$/u);

    if (!bulletMatch || !room) {
      ignoredLines.push({ sourceLine, text: line });
      continue;
    }

    const indentation = bulletMatch[1].length;

    if (indentation % 2 !== 0 || indentation > 4) {
      throw new Error(`Unsupported bullet indentation on line ${sourceLine}.`);
    }

    const depth = indentation / 2;
    const bullet: Bullet = {
      text: bulletMatch[2],
      sourceLine,
      children: [],
    };

    if (depth === 0) {
      room.bullets.push(bullet);
    } else {
      const parent = bulletStack[depth - 1];

      if (!parent) {
        throw new Error(`Bullet indentation jumps on line ${sourceLine}.`);
      }

      parent.children.push(bullet);
    }

    bulletStack = bulletStack.slice(0, depth);
    bulletStack[depth] = bullet;
  }

  return { routines, ignoredLines };
}

export async function prepareCleaningList(
  markdown: string,
  decideNestedBullet: DecideNestedBullet,
): Promise<CleaningListPlan> {
  const draft = parseDraft(markdown);
  const drafts = draft.routines;
  const routineNames = new Set<string>();
  const routines: RoutineImport[] = drafts.map((routine, index) => {
    if (routineNames.has(routine.name)) {
      throw new Error(`Routine "${routine.name}" is defined more than once.`);
    }

    routineNames.add(routine.name);

    if (routine.cadenceDays === null) {
      throw new Error(`Routine "${routine.name}" has no Cadence.`);
    }

    if (routine.cadenceDays <= 0) {
      throw new Error(
        `Routine "${routine.name}" must have a positive Cadence.`,
      );
    }

    return {
      name: routine.name,
      cadenceDays: routine.cadenceDays,
      includesRoutineName: routine.includesRoutineName,
      sortOrder: (index + 1) * sortOrderGap,
    };
  });

  for (const routine of routines) {
    if (
      routine.includesRoutineName &&
      !routineNames.has(routine.includesRoutineName)
    ) {
      throw new Error(
        `Routine "${routine.name}" includes unknown Routine "${routine.includesRoutineName}".`,
      );
    }
  }

  const includedRoutineByName = new Map(
    routines.map((routine) => [routine.name, routine.includesRoutineName]),
  );

  for (const routine of routines) {
    const visited = new Set<string>();
    let currentName: string | null = routine.name;

    while (currentName) {
      if (visited.has(currentName)) {
        throw new Error("Routine Includes links contain a cycle.");
      }

      visited.add(currentName);
      currentName = includedRoutineByName.get(currentName) ?? null;
    }
  }

  const rooms: RoomImport[] = [];
  const roomNames = new Set<string>();
  const tasks: TaskImport[] = [];
  const reviewRows: OrderedReviewRow[] = routines.map((routine, index) => ({
    sourceLine: drafts[index].sourceLine,
    source: [
      `## ${routine.name}`,
      `Cadence: ${routine.cadenceDays} days`,
      routine.includesRoutineName
        ? `Includes: ${routine.includesRoutineName}`
        : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    proposed: `Routine: ${routine.name} (${routine.cadenceDays} days)${
      routine.includesRoutineName
        ? `, includes ${routine.includesRoutineName}`
        : ""
    }`,
  }));
  const taskCountByRoom = new Map<string, number>();

  function addTask(task: TaskDraftForReview) {
    const { source, sourceLine, ...taskImport } = task;
    const { groupLabel, note, roomName, routineName, text } = taskImport;
    const nextTaskIndex = (taskCountByRoom.get(roomName) ?? 0) + 1;
    taskCountByRoom.set(roomName, nextTaskIndex);
    tasks.push({
      ...taskImport,
      sortOrder: nextTaskIndex * sortOrderGap,
    });
    reviewRows.push({
      sourceLine,
      source,
      proposed: [
        `Task: ${text}`,
        `Routine: ${routineName}`,
        `Room: ${roomName}`,
        groupLabel ? `Group: ${groupLabel}` : null,
        note ? `Note: ${note.replaceAll("\n", " / ")}` : null,
      ]
        .filter((part): part is string => part !== null)
        .join(" | "),
    });
  }

  for (const routine of drafts) {
    for (const room of routine.rooms) {
      const isNewRoom = !roomNames.has(room.name);

      if (isNewRoom) {
        roomNames.add(room.name);
        rooms.push({
          name: room.name,
          sortOrder: rooms.length * sortOrderGap + sortOrderGap,
        });
      }

      reviewRows.push({
        sourceLine: room.sourceLine,
        source: `**${room.name}**`,
        proposed: `Room: ${room.name}${isNewRoom ? "" : " (reuse existing Room)"}`,
      });

      for (const bullet of room.bullets) {
        if (bullet.children.length === 0) {
          addTask({
            routineName: routine.name,
            roomName: room.name,
            text: bullet.text,
            note: null,
            groupLabel: null,
            source: `- ${bullet.text}`,
            sourceLine: bullet.sourceLine,
          });
          continue;
        }

        const hasGrandchildren = bullet.children.some(
          (child) => child.children.length > 0,
        );
        const decision = hasGrandchildren
          ? "group"
          : await decideNestedBullet({
              text: bullet.text,
              children: bullet.children.map((child) => child.text),
              sourceLine: bullet.sourceLine,
            });

        if (decision === "task") {
          addTask({
            routineName: routine.name,
            roomName: room.name,
            text: bullet.text,
            note: bullet.children.map((child) => child.text).join("\n"),
            groupLabel: null,
            source: [`- ${bullet.text}`]
              .concat(
                bullet.children.map((child) => `  - ${child.text}`),
              )
              .join("\n"),
            sourceLine: bullet.sourceLine,
          });
          continue;
        }

        for (const child of bullet.children) {
          addTask({
            routineName: routine.name,
            roomName: room.name,
            text: child.text,
            note: child.children.length > 0
              ? child.children.map((note) => note.text).join("\n")
              : null,
            groupLabel: bullet.text,
            source: [`- ${bullet.text}`, `  - ${child.text}`]
              .concat(
                child.children.map((note) => `    - ${note.text}`),
              )
              .join("\n"),
            sourceLine: bullet.sourceLine,
          });
        }
      }
    }
  }

  reviewRows.push(
    ...draft.ignoredLines.map((line) => ({
      sourceLine: line.sourceLine,
      source: line.text,
      proposed: "Ignored source line (no database change)",
    })),
  );
  reviewRows.sort((left, right) => left.sourceLine - right.sourceLine);

  return {
    routines,
    rooms,
    tasks,
    reviewRows: reviewRows.map(({ source, proposed }) => ({ source, proposed })),
  };
}
