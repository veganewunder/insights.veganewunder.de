import { formatDateTime } from "@/lib/insights/formatters";

export function SyncBanner({
  lastSyncedAt,
  compact = false,
}: {
  lastSyncedAt: Date;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-line bg-panel shadow-panel ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            Letzter Sync {formatDateTime(lastSyncedAt)}
          </p>
          <p className="mt-1 text-sm leading-6 text-stone">
            Neueste Plattformdaten koennen zeitverzoegert nachlaufen.
          </p>
        </div>
      </div>
    </section>
  );
}
