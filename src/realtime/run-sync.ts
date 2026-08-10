export type RunEventSource = {
  addEventListener(type: string, listener: () => void): void;
  close(): void;
};

type ReconnectScheduler = (
  reconnect: () => void,
  delay: number,
) => () => void;

const INITIAL_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

function scheduleWithTimeout(
  reconnect: () => void,
  delay: number,
): () => void {
  const timeout = setTimeout(reconnect, delay);
  return () => clearTimeout(timeout);
}

export function connectRunSync({
  openEventSource,
  refresh,
  scheduleReconnect = scheduleWithTimeout,
}: {
  openEventSource: () => RunEventSource;
  refresh: () => Promise<void>;
  scheduleReconnect?: ReconnectScheduler;
}): () => void {
  let refreshQueue = Promise.resolve();
  let eventSource: RunEventSource | null = null;
  let cancelScheduledReconnect: (() => void) | null = null;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let disconnected = false;

  function refreshCurrentState(): void {
    refreshQueue = refreshQueue
      .catch(() => undefined)
      .then(refresh)
      .then(() => undefined);
  }

  function openConnection(): void {
    const connection = openEventSource();
    eventSource = connection;

    connection.addEventListener("connected", () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      refreshCurrentState();
    });
    connection.addEventListener("run-change", refreshCurrentState);
    connection.addEventListener("error", () => {
      connection.close();

      if (disconnected || cancelScheduledReconnect) {
        return;
      }

      const delay = reconnectDelay;
      reconnectDelay = Math.min(
        reconnectDelay * 2,
        MAX_RECONNECT_DELAY,
      );
      cancelScheduledReconnect = scheduleReconnect(() => {
        cancelScheduledReconnect = null;

        if (!disconnected) {
          openConnection();
        }
      }, delay);
    });
  }

  openConnection();

  return () => {
    disconnected = true;
    cancelScheduledReconnect?.();
    eventSource?.close();
  };
}
