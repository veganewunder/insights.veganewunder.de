import { AudienceBreakdownItem } from "@/types/insights";

const COLORS = ["#18181b", "#65a30d", "#d4d4d8", "#f59e0b"];

function buildChartGradient(items: AudienceBreakdownItem[]) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return null;
  }

  let current = 0;
  const slices = items.map((item, index) => {
    const start = current;
    current += (item.value / total) * 100;

    return {
      ...item,
      color: COLORS[index % COLORS.length],
      start,
      end: current,
    };
  });

  const gradient = slices
    .map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`)
    .join(", ");

  return { slices, gradient };
}

export function AudienceGenderPie({ items }: { items: AudienceBreakdownItem[] }) {
  const chart = buildChartGradient(items);

  if (!chart) {
    return <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>;
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative size-40 rounded-full"
          style={{
            background: `conic-gradient(${chart.gradient})`,
          }}
          aria-label="Geschlechterverteilung"
          role="img"
        >
          <div className="absolute inset-[22%] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,24,27,0.04)]" />
        </div>
      </div>

      <div className="space-y-2">
        {chart.slices.map((slice) => (
          <div
            key={slice.key}
            className="flex items-center justify-between rounded-2xl border border-line bg-zinc-50/80 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              <span className="truncate text-sm font-medium text-ink">{slice.label}</span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-ink">
              {slice.value.toLocaleString("de-DE", {
                minimumFractionDigits: slice.value % 1 === 0 ? 0 : 1,
                maximumFractionDigits: 1,
              })}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
