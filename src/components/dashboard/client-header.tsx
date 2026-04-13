import Image from "next/image";
import { CONTENT_TYPE_CONFIG } from "@/lib/insights/content-config";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { ClientDashboardRecord, ContentType, MetricKey, RangeKey } from "@/types/insights";
import { InsightsFilters } from "@/components/dashboard/insights-filters";

type ClientHeaderProps = {
  client: ClientDashboardRecord;
  activeRange: RangeKey;
  activeContentType: ContentType;
  activeMetric: MetricKey;
  availableMetrics: MetricKey[];
};

function getRangeLabel(range: RangeKey) {
  return range === "30d" ? "30 Tage" : "7 Tage";
}

export function ClientHeader({
  client,
  activeRange,
  activeContentType,
  activeMetric,
  availableMetrics,
}: ClientHeaderProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Vegane Wunder Logo" width={28} height={28} className="size-7 object-contain" />
              <p className="text-xs font-medium uppercase tracking-widest text-stone">
                Analyseansicht
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-ink">{client.name}</h1>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-widest text-stone">
                {CONTENT_TYPE_CONFIG[activeContentType].label}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone">
              {CONTENT_TYPE_CONFIG[activeContentType].description}. Zeitraum{" "}
              {getRangeLabel(activeRange)}. Aktive Metrik {getMetricLabel(activeMetric)}.
            </p>
          </div>

          <div className="min-w-0 xl:max-w-xl">
            <InsightsFilters
              basePath={`/dashboard/client/${client.slug}`}
              activeRange={activeRange}
              activeContentType={activeContentType}
              activeMetric={activeMetric}
              availableMetrics={availableMetrics}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
