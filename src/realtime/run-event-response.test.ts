import { describe, expect, it, vi } from "vitest";

import { createRunEventResponse } from "./run-event-response";

describe("Run event response", () => {
  it("streams Run changes and releases the database listener", async () => {
    const abortController = new AbortController();
    const stopListening = vi.fn(async () => undefined);
    let announceRunChange: (change: { runId: string }) => void = () => undefined;
    const response = createRunEventResponse({
      signal: abortController.signal,
      subscribe: async (onChange) => {
        announceRunChange = onChange;
        return stopListening;
      },
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    expect(response.headers.get("content-type")).toBe(
      "text/event-stream; charset=utf-8",
    );
    expect(response.headers.get("cache-control")).toBe(
      "no-cache, no-transform",
    );

    const connected = await reader.read();
    expect(decoder.decode(connected.value)).toBe(
      "event: connected\ndata: {}\n\n",
    );

    announceRunChange({ runId: "a3b6f09d-a5f5-4608-b1c3-3ee25f03914c" });
    const changed = await reader.read();
    expect(decoder.decode(changed.value)).toBe(
      'event: run-change\ndata: {"runId":"a3b6f09d-a5f5-4608-b1c3-3ee25f03914c"}\n\n',
    );

    abortController.abort();
    await expect.poll(() => stopListening).toHaveBeenCalledOnce();
  });

  it("releases a slow listener when the HTTP stream closes", async () => {
    const abortController = new AbortController();
    let finishUnlistening: () => void = () => undefined;
    const stopListening = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishUnlistening = resolve;
        }),
    );
    const response = createRunEventResponse({
      signal: abortController.signal,
      subscribe: async () => stopListening,
    });
    const reader = response.body!.getReader();
    await reader.read();

    abortController.abort();
    const canceled = reader.cancel();
    finishUnlistening();

    await canceled;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stopListening).toHaveBeenCalledOnce();
  });
});
