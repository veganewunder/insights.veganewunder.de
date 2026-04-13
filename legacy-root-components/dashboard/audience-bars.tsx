import { AudienceBreakdownItem } from "@/types/insights";

export function AudienceBars({ items }: { items: AudienceBreakdownItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => (
        <div key={item.key} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink">{item.label}</span>
            <span className="text-stone">{item.value}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e8e2d5]">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
