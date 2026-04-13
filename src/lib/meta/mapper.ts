import { normalizeInsightMetric } from "@/lib/insights/normalize";
import { MetricKey } from "@/types/insights";

const metaMetricMap: Record<string, MetricKey> = {
  reach: "reach",
  impressions: "impressions",
  story_views: "story_views",
  profile_links_taps: "clicks",
  audience_country: "audience_country",
  audience_age: "audience_age",
};

export function mapMetaMetric(rawMetricKey: string) {
  return metaMetricMap[rawMetricKey];
}

export function mapMetaInsightRecord(input: {
  accountId: string;
  rawMetricKey: string;
  rawMetricLabel: string;
  value: number;
  periodKey: "7d" | "30d" | "daily";
  startDate: string;
  endDate: string;
  fetchedAt: string;
}) {
  const metricKey = mapMetaMetric(input.rawMetricKey);

  if (!metricKey) {
    return null;
  }

  return normalizeInsightMetric({
    accountId: input.accountId,
    metricKey,
    metricLabel: input.rawMetricLabel,
    periodKey: input.periodKey,
    valueNumeric: input.value,
    startDate: input.startDate,
    endDate: input.endDate,
    fetchedAt: input.fetchedAt,
  });
}
