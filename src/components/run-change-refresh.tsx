"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { connectRunSync } from "@/realtime/run-sync";

export function useRunChangeRefresh(
  refreshCurrent?: () => Promise<void>,
): void {
  const router = useRouter();
  const refresh = useCallback(async () => {
    if (refreshCurrent) {
      await refreshCurrent();
    } else {
      router.refresh();
    }
  }, [refreshCurrent, router]);

  useEffect(() => {
    return connectRunSync({
      openEventSource: () => new EventSource("/api/run-events"),
      refresh,
    });
  }, [refresh]);
}

export function RunChangeRefresh() {
  useRunChangeRefresh();
  return null;
}
