import Link from "next/link";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { ContentType, MetricKey, RangeKey } from "@/types/insights";

type MetricSwitcherProps = {
  basePath: string;
  activeRange: RangeKey;
  activeContentType: ContentType;
  activeMetric: MetricKey;
  availableMetrics: MetricKey[];
};

function buildHref(
  basePath: string,
  range: RangeKey,
  contentType: ContentType,
  metric: MetricKey,
) {
  const params = new URLSearchParams({
    range,
    type: contentType,
    metric,
  });

  return `${basePath}?${params.toString()}`;
}

export function MetricSwitcher({
  basePath,
  activeRange,
  activeContentType,
  activeMetric,
  availableMetrics,
}: MetricSwitcherProps) {
  if (availableMetrics.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone">
        Metrik
      </p>
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map((metricKey) => (
          <Link
            key={metricKey}
            href={buildHref(basePath, activeRange, activeContentType, metricKey)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeMetric === metricKey
                ? "border-ink bg-ink text-white"
                : "border-line bg-panel text-stone hover:border-ink hover:text-ink"
            }`}
          >
            {getMetricLabel(metricKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}

