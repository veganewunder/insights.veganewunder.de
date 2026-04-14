import { formatCompactNumber, formatPercent } from "@/lib/insights/comparisons";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { MetaContentItem, MetricKey } from "@/types/insights";

export type ReportStatItem = {
  key: string;
  label: string;
  value: string;
  helper?: string;
};

const AVERAGE_METRIC_ORDER: MetricKey[] = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
  "replies",
  "reach",
];

function sumMetric(items: MetaContentItem[], metricKey: MetricKey) {
  return items.reduce((sum, item) => sum + (item.metrics[metricKey] ?? 0), 0);
}

export function formatAudienceDataDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function buildAverageMetrics(items: MetaContentItem[]): ReportStatItem[] {
  if (items.length === 0) {
    return [];
  }

  const averageMetrics: ReportStatItem[] = AVERAGE_METRIC_ORDER
    .map((metricKey) => {
      const total = sumMetric(items, metricKey);
      if (total <= 0) {
        return null;
      }

      return {
        key: metricKey,
        label: `Ø ${getMetricLabel(metricKey)}`,
        value: formatCompactNumber(Math.round(total / items.length)),
        helper: `pro Inhalt im gewählten Zeitraum`,
      } satisfies ReportStatItem;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  const interactions =
    sumMetric(items, "likes") +
    sumMetric(items, "comments") +
    sumMetric(items, "shares") +
    sumMetric(items, "saves") +
    sumMetric(items, "replies");
  const reach = sumMetric(items, "reach");

  if (reach > 0 && interactions > 0) {
    averageMetrics.unshift({
      key: "engagement-rate",
      label: "Engagement Rate",
      value: formatPercent(Number(((interactions / reach) * 100).toFixed(1))),
      helper: "(Likes + Kommentare + Shares + Saves + Antworten) / Reichweite",
    });
  }

  return averageMetrics.slice(0, 4);
}
