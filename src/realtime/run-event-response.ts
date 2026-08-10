import type { RunChange } from "./run-events";

type RunChangeSubscriber = (
  onChange: (change: RunChange) => void,
) => Promise<() => Promise<void>>;

const encoder = new TextEncoder();

function encodeEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function createRunEventResponse({
  signal,
  subscribe,
}: {
  signal: AbortSignal;
  subscribe: RunChangeSubscriber;
}): Response {
  let stopListening: (() => Promise<void>) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      async function closeStream(): Promise<void> {
        if (closed) {
          return;
        }

        closed = true;
        signal.removeEventListener("abort", handleAbort);

        if (heartbeat) {
          clearInterval(heartbeat);
        }

        if (stopListening) {
          await stopListening();
        }

        controller.close();
      }

      function handleAbort(): void {
        void closeStream();
      }

      signal.addEventListener("abort", handleAbort, { once: true });
      stopListening = await subscribe((change) => {
        if (!closed) {
          controller.enqueue(encodeEvent("run-change", change));
        }
      });

      if (closed) {
        await stopListening();
        return;
      }

      controller.enqueue(
        encoder.encode("retry: 2000\n\nevent: connected\ndata: {}\n\n"),
      );
      heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        }
      }, 25_000);
    },
    async cancel() {
      if (closed) {
        return;
      }

      closed = true;

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      if (stopListening) {
        await stopListening();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
