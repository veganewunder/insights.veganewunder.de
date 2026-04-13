import { ContentPerformanceItem } from "@/types/insights";

export function ContentPerformanceList({ items }: { items: ContentPerformanceItem[] }) {
  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-zinc-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{item.title}</p>
            <p className="mt-0.5 text-xs text-stone">
              {item.platformLabel} · {item.secondaryLabel}
            </p>
          </div>
          <div className="ml-4 shrink-0 text-right">
            <p className="text-sm font-bold text-ink">{item.primaryValue}</p>
            <p className="text-xs text-stone">{item.changeLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
