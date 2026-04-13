import { ContentPerformanceItem } from "@/types/insights";

export function ContentPerformanceList({ items }: { items: ContentPerformanceItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-zinc-50 px-4 py-3 text-sm text-stone">
        Keine Inhalte im gewählten Zeitraum verfügbar.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-stone">
              {item.platformLabel} · {item.secondaryLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 sm:ml-4">
            <div className="text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-widest text-stone">Primär</p>
              <p className="mt-1 text-sm font-bold text-ink">{item.primaryValue}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-widest text-stone">Sekundär</p>
              <p className="mt-1 text-sm text-stone">{item.changeLabel}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
