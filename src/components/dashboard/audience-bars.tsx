import { AudienceBreakdownItem } from "@/types/insights";

export function AudienceBars({ items }: { items: AudienceBreakdownItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-ink">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-stone">
            {item.value}%
          </span>
        </div>
      ))}
    </div>
  );
}
