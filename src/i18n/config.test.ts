import { describe, expect, it } from "vitest";
import {
  dictionaries,
  getLocale,
  isLocale,
  pluralDictionaries,
} from "./config";

describe("language configuration", () => {
  it("uses English when the cookie is missing", () => {
    expect(getLocale(undefined)).toBe("en");
  });

  it("accepts supported languages", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fi")).toBe(true);
    expect(getLocale("fi")).toBe("fi");
  });

  it("rejects an unsupported cookie value", () => {
    expect(isLocale("sv")).toBe(false);
    expect(getLocale("sv")).toBe("en");
  });

  it("uses sentence case for domain terms in both locales", () => {
    const interfaceCopy = [
      ...Object.values(dictionaries).flatMap(Object.values),
      ...Object.values(pluralDictionaries).flatMap((dictionary) =>
        Object.values(dictionary).flatMap(Object.values),
      ),
    ];
    const sentences = interfaceCopy.flatMap((value) =>
      value.split(/(?<=[.!?…])\s+/),
    );
    const capitalizedDomainTerm =
      /.+\b(?:Archived|Cadence|Due|Group|Ignored|Note|Presented|Room|Rooms|Routine|Routines|Run|Runs|Task|Tasks|Tick)\b/;

    expect(sentences.filter((value) => capitalizedDomainTerm.test(value))).toEqual([]);
  });

  it("keeps matching sentence-case labels across locales", () => {
    expect(dictionaries.en).toMatchObject({
      addRoom: "Add room",
      allTasks: "All tasks",
      archiveTask: "Archive task",
      archivedRooms: "Archived rooms",
      nextRoom: "Next room",
      roomsInRun: "Choose a room",
    });
    expect(dictionaries.fi).toMatchObject({
      addRoom: "Lisää huone",
      allTasks: "Kaikki tehtävät",
      archiveTask: "Arkistoi tehtävä",
      archivedRooms: "Arkistoidut huoneet",
      nextRoom: "Seuraava huone",
      roomsInRun: "Valitse huone",
    });
  });
});
