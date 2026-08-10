import { describe, expect, it, vi } from "vitest";

import { connectRunSync, type RunEventSource } from "./run-sync";

class FakeRunEventSource implements RunEventSource {
  private listeners = new Map<string, Set<() => void>>();
  close = vi.fn();

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  announce(type: "connected" | "error" | "run-change"): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

describe("Run synchronization", () => {
  it("fetches current state for changes and reconnections", async () => {
    const eventSource = new FakeRunEventSource();
    const refresh = vi.fn(async () => undefined);
    const disconnect = connectRunSync({
      openEventSource: () => eventSource,
      refresh,
    });

    eventSource.announce("connected");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(1);

    eventSource.announce("run-change");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(2);

    eventSource.announce("connected");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(3);

    disconnect();
    expect(eventSource.close).toHaveBeenCalledOnce();
  });

  it("increases the delay after consecutive connection failures", () => {
    const eventSources: FakeRunEventSource[] = [];
    const scheduled: Array<{ delay: number; reconnect: () => void }> = [];
    const disconnect = connectRunSync({
      openEventSource: () => {
        const eventSource = new FakeRunEventSource();
        eventSources.push(eventSource);
        return eventSource;
      },
      refresh: async () => undefined,
      scheduleReconnect: (reconnect, delay) => {
        scheduled.push({ delay, reconnect });
        return () => undefined;
      },
    });

    eventSources[0]!.announce("error");
    expect(scheduled[0]?.delay).toBe(1_000);
    scheduled[0]!.reconnect();

    eventSources[1]!.announce("error");
    expect(scheduled[1]?.delay).toBe(2_000);
    scheduled[1]!.reconnect();

    eventSources[2]!.announce("connected");
    eventSources[2]!.announce("error");
    expect(scheduled[2]?.delay).toBe(1_000);

    disconnect();
  });
});
