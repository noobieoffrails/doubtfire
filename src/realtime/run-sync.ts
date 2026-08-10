export type RunEventSource = {
  addEventListener(type: string, listener: () => void): void;
  close(): void;
};

export function connectRunSync({
  eventSource,
  refresh,
}: {
  eventSource: RunEventSource;
  refresh: () => Promise<void>;
}): () => void {
  let refreshQueue = Promise.resolve();

  function refreshCurrentState(): void {
    refreshQueue = refreshQueue
      .catch(() => undefined)
      .then(refresh)
      .then(() => undefined);
  }

  eventSource.addEventListener("connected", refreshCurrentState);
  eventSource.addEventListener("run-change", refreshCurrentState);

  return () => eventSource.close();
}
