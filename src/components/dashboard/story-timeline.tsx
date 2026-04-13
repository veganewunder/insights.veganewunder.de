import { TimelinePoint } from "@/types/insights";

export function StoryTimeline({ points }: { points: TimelinePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-zinc-50 px-4 py-6 text-sm text-stone">
        Keine Verlaufspunkte für die aktuelle Auswahl verfügbar.
      </div>
    );
  }

  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-6">
      <div className="flex h-48 items-end gap-2">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-md bg-ink/80"
                style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-ink">{point.displayValue}</p>
              <p className="text-[10px] uppercase tracking-wider text-stone">{point.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
