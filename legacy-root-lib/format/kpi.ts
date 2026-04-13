import { KpiMetric, StoryPoint } from "@/types/insights";

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPercentChange(changePercent: number) {
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent}%`;
}

export function buildMetric(label: string, value: number, changePercent: number): KpiMetric {
  return {
    label,
    value,
    changePercent,
    changeLabel: formatPercentChange(changePercent),
  };
}

export function buildStorySeries(labels: string[], values: number[]): StoryPoint[] {
  return labels.map((label, index) => ({
    label,
    value: values[index] ?? 0,
  }));
}
