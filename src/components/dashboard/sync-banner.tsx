"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/insights/formatters";

type SyncState = "idle" | "loading" | "success" | "error";

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
      className={`rounded-2xl border border-line bg-panel shadow-panel ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            {syncState === "success" ? (
              <CheckCircle className="size-4 text-green-600" />
            ) : syncState === "error" ? (
              <AlertCircle className="size-4 text-red-500" />
            ) : (
              <RefreshCw className={`size-4 text-stone ${syncState === "loading" ? "animate-spin" : ""}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {syncState === "success"
                ? "Sync erfolgreich"
                : syncState === "error"
                ? "Sync fehlgeschlagen"
                : `Letzter Sync ${formatDateTime(syncedAt)}`}
            </p>
            <p className="text-xs text-stone">
              {syncState === "error"
                ? errorMsg
                : syncState === "success"
                ? "Daten werden neu geladen…"
                : "Neueste Plattformdaten können zeitverzögert nachlaufen."}
            </p>
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
            {syncState === "loading" ? "Lädt…" : "Jetzt syncen"}
          </button>
        )}
      </div>
    </section>
  );
}
