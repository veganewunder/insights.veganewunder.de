"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/insights/formatters";
import { formatAudienceDataDate } from "@/lib/insights/reporting";

type SyncState = "idle" | "loading" | "success" | "error";

function getFreshnessState(date: Date) {
  const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) {
    return {
      label: "Frische Daten",
      tone: "fresh",
      detail: "Die Auswertung wurde aktuell bereitgestellt.",
    } as const;
  }

  if (diffHours <= 72) {
    return {
      label: "Aktueller Datenstand",
      tone: "recent",
      detail: "Die Auswertung ist aktuell und für Reporting-Zwecke geeignet.",
    } as const;
  }

  return {
    label: "Archivierter Datenstand",
    tone: "aged",
    detail: "Die Daten sind etwas älter, bleiben aber als Referenz nutzbar.",
  } as const;
}

export function SyncBanner({
  lastSyncedAt,
  compact = false,
  showSyncButton = false,
}: {
  lastSyncedAt: Date;
  compact?: boolean;
  showSyncButton?: boolean;
}) {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncedAt, setSyncedAt] = useState<Date>(lastSyncedAt);
  const [errorMsg, setErrorMsg] = useState("");
  const freshness = getFreshnessState(syncedAt);

  async function handleSync() {
    setSyncState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json() as { syncedAt?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Sync fehlgeschlagen");
      if (data.syncedAt) setSyncedAt(new Date(data.syncedAt));
      setSyncState("success");
      setTimeout(() => setSyncState("idle"), 4000);
      // Reload to show fresh data
      window.location.reload();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
      setSyncState("error");
      setTimeout(() => setSyncState("idle"), 6000);
    }
  }

  return (
    <section
      className={`rounded-[2rem] border border-line bg-panel shadow-panel ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
              syncState === "error"
                ? "text-red-500"
                : syncState === "success"
                ? "text-green-600"
                : "text-stone"
            }`}
          >
            {syncState === "success" ? (
              <CheckCircle className="size-5 text-green-600" />
            ) : syncState === "error" ? (
              <AlertCircle className="size-5 text-red-500" />
            ) : (
              <span className="relative flex size-3 items-center justify-center">
                <span
                  className={`absolute inline-flex size-3 rounded-full ${
                    freshness.tone === "fresh"
                      ? "bg-emerald-500/30"
                      : freshness.tone === "recent"
                      ? "bg-lime-500/30"
                      : "bg-amber-500/30"
                  } animate-ping`}
                />
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    freshness.tone === "fresh"
                      ? "bg-emerald-500"
                      : freshness.tone === "recent"
                      ? "bg-lime-500"
                      : "bg-amber-500"
                  } ${syncState === "loading" ? "animate-pulse" : ""}`}
                />
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {syncState === "success"
                ? "Daten werden aktualisiert"
                : syncState === "error"
                ? "Aktualisierung nicht möglich"
                : `Daten vom ${formatAudienceDataDate(syncedAt)}`}
            </p>
            {syncState === "error" ? (
              <p className="mt-1 text-sm text-stone">{errorMsg}</p>
            ) : syncState === "success" ? (
              <p className="mt-1 text-sm text-stone">Die neuesten Werte werden geladen.</p>
            ) : null}
          </div>
        </div>

        {showSyncButton && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncState === "loading"}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 sm:shrink-0"
          >
            <RefreshCw className={`size-4 ${syncState === "loading" ? "animate-spin" : ""}`} />
            {syncState === "loading" ? "Aktualisiert..." : "Daten aktualisieren"}
          </button>
        )}
      </div>
    </section>
  );
}
