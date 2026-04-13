import { Panel } from "@/components/ui/panel";
import { KpiCardRecord } from "@/types/insights";

function ChangeBadge({ change, label }: { change: number; label: string }) {
  const positive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive
          ? "bg-green-50 text-success"
          : "bg-red-50 text-danger"
      }`}
    >
      {positive ? "↑" : "↓"} {label}
    </span>
  );
}

export function KpiGrid({ metrics }: { metrics: KpiCardRecord[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Panel key={metric.key} className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">
            {metric.label}
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-ink">
            {metric.displayValue}
          </p>
          <p className="mt-1 text-sm text-stone">{metric.platformAvailabilityLabel}</p>
          <div className="mt-4">
            <ChangeBadge change={metric.changePercent} label={metric.changeLabel} />
          </div>
        </Panel>
      ))}
    </section>
  );
}
