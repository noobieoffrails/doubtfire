import {
  prepareCleaningList,
  type CleaningListPlan,
  type NestedBulletDecision,
  type NestedBulletQuestion,
} from "./cleaning-list.ts";

export type CleaningListStore = {
  insert(plan: CleaningListPlan): Promise<void>;
};

export type SeedCommandDependencies = {
  readTextFile(path: string): Promise<string>;
  prompt(message: string): Promise<string>;
  write(text: string): void;
  store: CleaningListStore;
};

export type SeedCommandResult = "cancelled" | "help" | "written";

const defaultListPath = "fixtures/example-cleaning-list.md";

async function askNestedBullet(
  question: NestedBulletQuestion,
  dependencies: SeedCommandDependencies,
): Promise<NestedBulletDecision> {
  const message = [
    `"${question.text}" has nested bullets on source line ${question.sourceLine}.`,
    "1. Group with Tasks",
    "2. Task with Notes",
    "Select 1 or 2: ",
  ].join("\n");

  while (true) {
    const answer = (await dependencies.prompt(message)).trim();

    if (answer === "1") {
      return "group";
    }

    if (answer === "2") {
      return "task";
    }

    dependencies.write("Enter 1 or 2.");
  }
}

function formatReview(plan: CleaningListPlan): string {
  const sourceHeader = "SOURCE";
  const proposedHeader = "PROPOSED STRUCTURE";
  const sourceWidth = Math.max(
    sourceHeader.length,
    ...plan.reviewRows.map((row) => row.source.replaceAll("\n", " ↳ ").length),
  );
  const rows = plan.reviewRows.map((row) => {
    const source = row.source.replaceAll("\n", " ↳ ");
    return `${source.padEnd(sourceWidth)} | ${row.proposed}`;
  });

  return [
    `${sourceHeader.padEnd(sourceWidth)} | ${proposedHeader}`,
    `${"-".repeat(sourceWidth)}-+-${"-".repeat(proposedHeader.length)}`,
    ...rows,
  ].join("\n");
}

export async function runSeedCommand(
  args: string[],
  dependencies: SeedCommandDependencies,
): Promise<SeedCommandResult> {
  if (args.includes("--help") || args.includes("-h")) {
    dependencies.write(
      [
        "Usage: pnpm seed [path-to-list.md]",
        "",
        `The default path is ${defaultListPath}.`,
        "The command resolves ambiguous bullets, shows a review, and writes only after explicit approval.",
      ].join("\n"),
    );
    return "help";
  }

  const sourcePath = args[0] ?? defaultListPath;
  const markdown = await dependencies.readTextFile(sourcePath);
  const plan = await prepareCleaningList(markdown, (question) =>
    askNestedBullet(question, dependencies),
  );

  dependencies.write(formatReview(plan));

  const approval = await dependencies.prompt(
    'Type "WRITE" to add these Routines, Rooms, and Tasks to the empty database: ',
  );

  if (approval.trim() !== "WRITE") {
    dependencies.write("No database changes were made.");
    return "cancelled";
  }

  await dependencies.store.insert(plan);
  dependencies.write("The cleaning list was written to the database.");

  return "written";
}
