import { comparePercent, formatCompactNumber, formatPercent } from "@/lib/insights/comparisons";
import { CONTENT_TYPE_CONFIG, CONTENT_TYPE_ORDER } from "@/lib/insights/content-config";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import {
  ClientDashboardRecord,
  ContentInsightsRecord,
  ContentPerformanceItem,
  ContentType,
  KpiCardRecord,
  MetaContentItem,
  MetricKey,
  RangeKey,
  TimelinePoint,
} from "@/types/insights";

function getDaysForRange(rangeKey: RangeKey) {
  return rangeKey === "30d" ? 30 : 7;
}

function getRangeBounds(rangeKey: RangeKey, offsetDays = 0) {
  const days = getDaysForRange(rangeKey);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  end.setUTCDate(end.getUTCDate() - offsetDays);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}

function isWithinRange(publishedAt: string | null, rangeKey: RangeKey, offsetDays = 0) {
  if (!publishedAt) {
    return false;
  }

  const timestamp = new Date(publishedAt).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const { start, end } = getRangeBounds(rangeKey, offsetDays);
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function getMetricValue(item: MetaContentItem, metricKey: MetricKey) {
  return item.metrics[metricKey] ?? 0;
}

export function sortContentItemsByMetric(items: MetaContentItem[], metricKey: MetricKey) {
  return [...items].sort(
    (left, right) => getMetricValue(right, metricKey) - getMetricValue(left, metricKey),
  );
}

function aggregateMetric(items: MetaContentItem[], metricKey: MetricKey) {
  return items.reduce((sum, item) => sum + getMetricValue(item, metricKey), 0);
}

function buildKpiCard(
  metricKey: MetricKey,
  value: number,
  previousValue: number,
  contentType: ContentType,
): KpiCardRecord {
  const hasPrevious = previousValue > 0;
  const changePercent = hasPrevious ? comparePercent(value, previousValue) : 0;

  return {
    key: metricKey,
    label: getMetricLabel(metricKey),
    value,
    previousValue,
    displayValue: formatCompactNumber(value),
    changePercent,
    changeLabel: hasPrevious ? formatPercent(changePercent) : "Noch nicht verfuegbar",
    platformAvailabilityLabel: `Verfuegbar fuer ${CONTENT_TYPE_CONFIG[contentType].label}`,
  };
}

function buildTimeline(items: MetaContentItem[], contentType: ContentType): TimelinePoint[] {
  const primaryMetric = CONTENT_TYPE_CONFIG[contentType].primaryMetric;

  return [...items]
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return leftTime - rightTime;
    })
    .slice(-6)
    .map((item) => ({
      label: item.publishedAt
        ? new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
          }).format(new Date(item.publishedAt))
        : item.title.slice(0, 8),
      value: getMetricValue(item, primaryMetric),
      displayValue: formatCompactNumber(getMetricValue(item, primaryMetric)),
    }));
}

function buildContentList(
  items: MetaContentItem[],
  contentType: ContentType,
): ContentPerformanceItem[] {
  const { primaryMetric, secondaryMetric } = CONTENT_TYPE_CONFIG[contentType];

  return [...items]
    .sort((left, right) => getMetricValue(right, primaryMetric) - getMetricValue(left, primaryMetric))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      platformLabel: item.platformLabel,
      secondaryLabel: item.mediaTypeLabel,
      primaryValue: `${formatCompactNumber(getMetricValue(item, primaryMetric))} ${getMetricLabel(primaryMetric)}`,
      changeLabel: `${formatCompactNumber(getMetricValue(item, secondaryMetric))} ${getMetricLabel(secondaryMetric)}`,
    }));
}

export function buildContentInsights(
  items: MetaContentItem[],
): ClientDashboardRecord["contentInsights"] {
  const byRange = {} as ClientDashboardRecord["contentInsights"];

  for (const rangeKey of ["7d", "30d"] as const) {
    const byType = {} as Record<ContentType, ContentInsightsRecord>;

    for (const contentType of CONTENT_TYPE_ORDER) {
      const allTypeItems = items.filter((item) => item.contentType === contentType);
      const currentItems = allTypeItems.filter(
        (item) => isWithinRange(item.publishedAt, rangeKey),
      );
      const previousItems = allTypeItems.filter(
        (item) => isWithinRange(item.publishedAt, rangeKey, getDaysForRange(rangeKey)),
      );

      const metrics = CONTENT_TYPE_CONFIG[contentType].kpiMetrics
        .map((metricKey) =>
          buildKpiCard(
            metricKey,
            aggregateMetric(currentItems, metricKey),
            aggregateMetric(previousItems, metricKey),
            contentType,
          ),
        )
        .filter((metric) => metric.value > 0 || metric.previousValue > 0);

      // Media gallery always shows all available items, not limited to the selected date range
      const allSorted = [...allTypeItems].sort((left, right) => {
        const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
        const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
        return rightTime - leftTime;
      });

      byType[contentType] = {
        metrics,
        timeline: buildTimeline(currentItems, contentType),
        content: buildContentList(currentItems, contentType),
        media: allSorted,
      };
    }

    byRange[rangeKey] = byType;
  }

  return byRange;
}

export function getDefaultContentSlice(
  contentInsights: ClientDashboardRecord["contentInsights"],
  rangeKey: RangeKey,
) {
  return contentInsights[rangeKey].reels;
}

export function buildTimelineForMetric(items: MetaContentItem[], metricKey: MetricKey): TimelinePoint[] {
  return [...items]
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return leftTime - rightTime;
    })
    .slice(-6)
    .map((item) => ({
      label: item.publishedAt
        ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(
            new Date(item.publishedAt),
          )
        : item.title.slice(0, 8),
      value: getMetricValue(item, metricKey),
      displayValue: formatCompactNumber(getMetricValue(item, metricKey)),
    }));
}

export function buildContentListForMetric(
  items: MetaContentItem[],
  metricKey: MetricKey,
  secondaryMetric: MetricKey,
): ContentPerformanceItem[] {
  return sortContentItemsByMetric(items, metricKey)
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      platformLabel: item.platformLabel,
      secondaryLabel: item.mediaTypeLabel,
      primaryValue: `${formatCompactNumber(getMetricValue(item, metricKey))} ${getMetricLabel(metricKey)}`,
      changeLabel: `${formatCompactNumber(getMetricValue(item, secondaryMetric))} ${getMetricLabel(secondaryMetric)}`,
    }));
}

