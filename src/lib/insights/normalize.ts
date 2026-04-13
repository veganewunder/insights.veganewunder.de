import { MetricKey, PeriodKey } from "@/types/insights";
import { Platform } from "@/types/platform";

export type NormalizedInsightMetric = {
  account_id: string;
  metric_key: MetricKey;
  metric_label: string;
  period_key: PeriodKey;
  value_numeric: number | null;
  value_json: Record<string, unknown> | null;
  start_date: string;
  end_date: string;
  fetched_at: string;
};

export function normalizeInsightMetric(input: {
  accountId: string;
  metricKey: MetricKey;
  metricLabel: string;
  periodKey: PeriodKey;
  valueNumeric: number | null;
  startDate: string;
  endDate: string;
  fetchedAt: string;
  valueJson?: Record<string, unknown> | null;
}): NormalizedInsightMetric {
  return {
    account_id: input.accountId,
    metric_key: input.metricKey,
    metric_label: input.metricLabel,
    period_key: input.periodKey,
    value_numeric: input.valueNumeric,
    value_json: input.valueJson ?? null,
    start_date: input.startDate,
    end_date: input.endDate,
    fetched_at: input.fetchedAt,
  };
}

export function buildPreparedSyncPayload() {
  return [
    {
      clientId: "live-meta-client",
      clientName: "Verbundenes Meta Konto",
      platforms: ["instagram"] as const,
      windows: ["7d", "30d"] as const,
    },
  ];
}

export function mapPlatformMetric(input: {
  platform: Platform;
  rawMetricKey: string;
}): MetricKey | null {
  const { platform, rawMetricKey } = input;

  const metaMap: Record<string, MetricKey> = {
    reach: "reach",
    impressions: "impressions",
    story_views: "story_views",
    profile_links_taps: "clicks",
    audience_country: "audience_country",
    audience_age: "audience_age",
  };

  const youtubeMap: Record<string, MetricKey> = {
    views: "views",
    estimatedMinutesWatched: "watch_time",
    averageViewDuration: "avg_view_duration",
    country: "audience_country",
    ageGroup: "audience_age",
    subscribersGained: "subscribers",
  };

  if (platform === "instagram" || platform === "facebook") {
    return metaMap[rawMetricKey] ?? null;
  }

  return youtubeMap[rawMetricKey] ?? null;
}
