import { describe, expect, it, vi } from "vitest";

import { runSeedCommand } from "./seed-command";

const exampleMarkdown = `
## Weekly
Cadence: 7 days
**Bathroom**
- Clean the basin
  - Remember behind the storage box
`;

describe("runSeedCommand", () => {
  it("shows command help without reading a file or database", async () => {
    const readTextFile = vi.fn();
    const insert = vi.fn();
    const output: string[] = [];

    const result = await runSeedCommand(["--help"], {
      readTextFile,
      prompt: vi.fn(),
      write: (text) => output.push(text),
      store: { insert },
    });

    expect(result).toBe("help");
    expect(readTextFile).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(output.join("\n")).toContain(
      "pnpm seed [path-to-list.md]",
    );
  });

  it("shows the review and does not write without final approval", async () => {
    const answers = ["2", "no"];
    const output: string[] = [];
    const insert = vi.fn();

    const result = await runSeedCommand(["private-list.md"], {
      readTextFile: async (path) => {
        expect(path).toBe("private-list.md");
        return exampleMarkdown;
      },
      prompt: async () => answers.shift() ?? "",
      write: (text) => output.push(text),
      store: { insert },
    });

    expect(result).toBe("cancelled");
    expect(insert).not.toHaveBeenCalled();
    expect(output.join("\n")).toContain("SOURCE");
    expect(output.join("\n")).toContain("PROPOSED STRUCTURE");
    expect(output.join("\n")).toContain("Task: Clean the basin");
    expect(output.join("\n")).toContain("No database changes were made.");
  });

  it("asks again when an ambiguity answer is not valid", async () => {
    const answers = ["maybe", "1", "no"];
    const prompts: string[] = [];

    await runSeedCommand(["private-list.md"], {
      readTextFile: async () => exampleMarkdown,
      prompt: async (message) => {
        prompts.push(message);
        return answers.shift() ?? "";
      },
      write: () => undefined,
      store: { insert: vi.fn() },
    });

    expect(prompts).toHaveLength(3);
    expect(prompts[0]).toContain("Select 1 or 2");
    expect(prompts[1]).toContain("Select 1 or 2");
  });

  it("shows child bullets in an ambiguity question", async () => {
    const answers = ["2", "no"];
    const prompts: string[] = [];

    await runSeedCommand(["private-list.md"], {
      readTextFile: async () => exampleMarkdown,
      prompt: async (message) => {
        prompts.push(message);
        return answers.shift() ?? "";
      },
      write: () => undefined,
      store: { insert: vi.fn() },
    });

    expect(prompts[0]).toContain(
      "- Remember behind the storage box",
    );
  });

  it("writes the reviewed plan after explicit approval", async () => {
    const answers = ["2", "WRITE"];
    const insert = vi.fn();

    const result = await runSeedCommand(["private-list.md"], {
      readTextFile: async () => exampleMarkdown,
      prompt: async () => answers.shift() ?? "",
      write: () => undefined,
      store: { insert },
    });

    expect(result).toBe("written");
    expect(insert).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        routines: [
          expect.objectContaining({ name: "Weekly", cadenceDays: 7 }),
        ],
        rooms: [expect.objectContaining({ name: "Bathroom" })],
        tasks: [expect.objectContaining({ text: "Clean the basin" })],
      }),
    );
  });
});
