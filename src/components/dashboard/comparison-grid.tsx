import { Panel } from "@/components/ui/panel";
import { KpiCardRecord } from "@/types/insights";

export function ComparisonGrid({ metrics }: { metrics: KpiCardRecord[] }) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <Panel key={metric.key} className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">
            {metric.label}
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink">
                {metric.changeLabel}
              </p>
              <p className="mt-2 text-xs text-stone">Vergleich zur Vorperiode</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                metric.changePercent >= 0
                  ? "bg-green-50 text-success"
                  : "bg-red-50 text-danger"
              }`}
            >
              {metric.changePercent >= 0 ? "↑" : "↓"} {metric.changeLabel}
            </span>
          </div>
        </Panel>
      ))}
    </div>
  );
}

