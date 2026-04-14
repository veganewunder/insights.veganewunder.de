"use client";

import { useEffect } from "react";

export function AutoSyncOnView() {
  useEffect(() => {
    void fetch("/api/sync", { method: "POST" }).catch(() => {
      // Background sync failures should not block the current page.
    });
  }, []);

  return null;
}
