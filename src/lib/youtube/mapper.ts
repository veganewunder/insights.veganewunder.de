import { normalizeInsightMetric } from "@/lib/insights/normalize";
import { MetricKey } from "@/types/insights";

const youtubeMetricMap: Record<string, MetricKey> = {
  views: "views",
  estimatedMinutesWatched: "watch_time",
  averageViewDuration: "avg_view_duration",
  country: "audience_country",
  ageGroup: "audience_age",
  subscribersGained: "subscribers",
};

export function mapYouTubeMetric(rawMetricKey: string) {
  return youtubeMetricMap[rawMetricKey];
}

export function mapYouTubeInsightRecord(input: {
  accountId: string;
  rawMetricKey: string;
  rawMetricLabel: string;
  value: number;
  periodKey: "7d" | "30d" | "daily";
  startDate: string;
  endDate: string;
  fetchedAt: string;
}) {
  const metricKey = mapYouTubeMetric(input.rawMetricKey);

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
