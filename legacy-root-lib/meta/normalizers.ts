type NumericInsight = {
  metricKey: string;
  metricLabel: string;
  periodKey: "7d" | "30d" | "daily";
  value: number;
  startDate: string;
  endDate: string;
  fetchedAt: string;
};

export function normalizeMetricInsight(input: NumericInsight) {
  return {
    metric_key: input.metricKey,
    metric_label: input.metricLabel,
    period_key: input.periodKey,
    value_numeric: input.value,
    start_date: input.startDate,
    end_date: input.endDate,
    fetched_at: input.fetchedAt,
  };
}
