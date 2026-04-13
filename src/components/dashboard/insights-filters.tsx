"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { CONTENT_TYPE_CONFIG, CONTENT_TYPE_ORDER } from "@/lib/insights/content-config";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { ContentType, MetricKey, RangeKey } from "@/types/insights";

type InsightsFiltersProps = {
  basePath: string;
  activeRange: RangeKey;
  activeContentType: ContentType;
  activeMetric: MetricKey;
  availableMetrics: MetricKey[];
};

type SheetMode = "content" | "range" | "metric" | "all" | null;

function getRangeLabel(range: RangeKey) {
  return range === "30d" ? "Letzte 30 Tage" : "Letzte 7 Tage";
}

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

function OptionRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between py-4 text-left"
    >
      <span className="text-base font-medium text-ink">{label}</span>
      <span
        className={`flex size-6 items-center justify-center rounded-full border ${
          active ? "border-ink" : "border-stone/40"
        }`}
      >
        <span
          className={`size-3 rounded-full ${active ? "bg-ink" : "bg-transparent"}`}
        />
      </span>
    </button>
  );
}

function SectionLink({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between py-4 text-left"
    >
      <span className="text-base font-medium text-ink">{label}</span>
      <span className="flex items-center gap-2 text-sm text-stone">
        {value}
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}

export function InsightsFilters({
  basePath,
  activeRange,
  activeContentType,
  activeMetric,
  availableMetrics,
}: InsightsFiltersProps) {
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const metricOptions = useMemo(
    () => availableMetrics.map((metric) => ({ key: metric, label: getMetricLabel(metric) })),
    [availableMetrics],
  );

  function applyFilters(next: {
    range?: RangeKey;
    contentType?: ContentType;
    metric?: MetricKey;
  }) {
    const range = next.range ?? activeRange;
    const contentType = next.contentType ?? activeContentType;
    const fallbackMetric =
      next.metric ??
      (availableMetrics.includes(activeMetric) ? activeMetric : availableMetrics[0]);

    router.push(buildHref(basePath, range, contentType, fallbackMetric));
    setSheetMode(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSheetMode("content")}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-ink shadow-panel transition hover:border-ink"
        >
          {CONTENT_TYPE_CONFIG[activeContentType].label}
        </button>

        <button
          type="button"
          onClick={() => setSheetMode("range")}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-ink shadow-panel transition hover:border-ink"
        >
          {getRangeLabel(activeRange)}
        </button>

        <button
          type="button"
          onClick={() => setSheetMode("all")}
          className="inline-flex items-center justify-center rounded-full border border-line bg-panel p-2.5 text-stone shadow-panel transition hover:border-ink hover:text-ink"
          aria-label="Sortieren und filtern"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      {sheetMode ? (
        <div className="fixed inset-0 z-50 bg-black/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="mx-auto flex h-full max-w-md items-end">
            <div className="w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <div className="mx-auto h-1 w-12 rounded-full bg-zinc-300" />
                <button
                  type="button"
                  onClick={() => setSheetMode(null)}
                  className="absolute right-8 rounded-full p-2 text-stone hover:text-ink"
                  aria-label="Schließen"
                >
                  <X className="size-4" />
                </button>
              </div>

              {sheetMode === "all" ? (
                <div className="px-6 pb-6">
                  <h3 className="text-center text-xl font-semibold text-ink">
                    Sortieren & Filtern
                  </h3>
                  <div className="mt-4 divide-y divide-line">
                    <SectionLink
                      label="Content Art"
                      value={CONTENT_TYPE_CONFIG[activeContentType].label}
                      onClick={() => setSheetMode("content")}
                    />
                    <SectionLink
                      label="Zeitraum"
                      value={getRangeLabel(activeRange)}
                      onClick={() => setSheetMode("range")}
                    />
                    <SectionLink
                      label="Kennzahl"
                      value={getMetricLabel(activeMetric)}
                      onClick={() => setSheetMode("metric")}
                    />
                  </div>
                </div>
              ) : null}

              {sheetMode === "content" ? (
                <div className="px-6 pb-6">
                  <h3 className="text-center text-xl font-semibold text-ink">Content Art</h3>
                  <div className="mt-4 divide-y divide-line">
                    {CONTENT_TYPE_ORDER.map((contentType) => (
                      <OptionRow
                        key={contentType}
                        label={CONTENT_TYPE_CONFIG[contentType].label}
                        active={activeContentType === contentType}
                        onClick={() => applyFilters({ contentType })}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {sheetMode === "range" ? (
                <div className="px-6 pb-6">
                  <h3 className="text-center text-xl font-semibold text-ink">
                    Zeitraum auswählen
                  </h3>
                  <div className="mt-4 divide-y divide-line">
                    {([
                      { key: "7d", label: "Letzte 7 Tage" },
                      { key: "30d", label: "Letzte 30 Tage" },
                    ] as const).map((range) => (
                      <OptionRow
                        key={range.key}
                        label={range.label}
                        active={activeRange === range.key}
                        onClick={() => applyFilters({ range: range.key })}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {sheetMode === "metric" ? (
                <div className="px-6 pb-6">
                  <h3 className="text-center text-xl font-semibold text-ink">Kennzahl</h3>
                  <div className="mt-4 divide-y divide-line">
                    {metricOptions.map((metric) => (
                      <OptionRow
                        key={metric.key}
                        label={metric.label}
                        active={activeMetric === metric.key}
                        onClick={() => applyFilters({ metric: metric.key })}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

