import { Panel } from "@/components/ui/panel";
import { InsightPermissionKey, KpiMetricSet } from "@/types/insights";

type KpiGridProps = {
  metrics: KpiMetricSet;
  compact?: boolean;
  visibleKeys?: InsightPermissionKey[];
};

const order: Array<keyof KpiMetricSet> = [
  "reach",
  "impressions",
  "storyViews",
  "linkClicks",
];

export function KpiGrid({ metrics, compact = false, visibleKeys }: KpiGridProps) {
  const filteredOrder = order.filter((key) =>
    visibleKeys ? visibleKeys.includes(key) : true,
  );

  if (filteredOrder.length === 0) {
    return null;
  }

  return (
    <section className={`grid gap-4 ${compact ? "md:grid-cols-2 xl:grid-cols-4" : "xl:grid-cols-4 md:grid-cols-2"}`}>
      {filteredOrder.map((key) => {
        const metric = metrics[key];

        return (
          <Panel key={key} className="p-5">
            <p className="text-sm text-stone">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">
              {metric.value.toLocaleString("de-DE")}
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <span className="text-stone">Vergleich zur Vorperiode</span>
              <span className="font-semibold text-ink">{metric.changeLabel}</span>
            </div>
          </Panel>
        );
      })}
    </section>
  );
}
