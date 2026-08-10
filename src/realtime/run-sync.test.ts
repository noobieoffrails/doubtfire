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

  announce(type: "connected" | "run-change"): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

describe("Run synchronization", () => {
  it("fetches current state for changes and reconnections", async () => {
    const eventSource = new FakeRunEventSource();
    const refresh = vi.fn(async () => undefined);
    const disconnect = connectRunSync({ eventSource, refresh });

    eventSource.announce("connected");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(1);

    eventSource.announce("run-change");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(2);

    eventSource.announce("connected");
    await expect.poll(() => refresh).toHaveBeenCalledTimes(3);

    disconnect();
    expect(eventSource.close).toHaveBeenCalledOnce();
  });
});
