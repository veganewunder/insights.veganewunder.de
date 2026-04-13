import { StoryPoint } from "@/types/insights";

export function StoryTimeline({ points }: { points: StoryPoint[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-8">
      <div className="flex h-60 items-end gap-3">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-[1.5rem] bg-ink/90"
                style={{ height: `${(point.value / max) * 100}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink">{point.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone">
                {point.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
