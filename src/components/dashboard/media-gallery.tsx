"use client";

import { useState } from "react";
import { Clapperboard, Image, CirclePlay } from "lucide-react";
import { CONTENT_TYPE_CONFIG } from "@/lib/insights/content-config";
import { MetaContentItem, ContentType, MetricKey } from "@/types/insights";
import { StoryDownloadButton } from "@/components/dashboard/story-download-button";

function formatPublishedAt(value: string | null) {
  if (!value) return "Unbekanntes Datum";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function fmtNum(n: number | undefined) {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("de-DE");
}

type KpiOption = { key: MetricKey; label: string };

const REEL_KPIS: KpiOption[] = [
  { key: "views", label: "Aufrufe" },
  { key: "reach", label: "Reichweite" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Kommentare" },
  { key: "shares", label: "Shares" },
];

const POST_KPIS: KpiOption[] = [
  { key: "reach", label: "Reichweite" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Kommentare" },
  { key: "saves", label: "Saves" },
];

const STORY_KPIS: KpiOption[] = [
  { key: "views", label: "Aufrufe" },
  { key: "reach", label: "Reichweite" },
  { key: "replies", label: "Antworten" },
];

function getKpiOptions(contentType: ContentType) {
  if (contentType === "stories") return STORY_KPIS;
  if (contentType === "posts") return POST_KPIS;
  return REEL_KPIS;
}

function getDefaultKpi(contentType: ContentType): MetricKey {
  if (contentType === "stories") return "views";
  if (contentType === "posts") return "reach";
  return "views";
}

function MediaIcon({ contentType }: { contentType: ContentType }) {
  if (contentType === "stories") {
    return <CirclePlay className="size-4 text-white" />;
  }
  if (contentType === "posts") {
    return <Image className="size-4 text-white" />;
  }
  return <Clapperboard className="size-4 text-white" />;
}

export function MediaGallery({
  items,
  contentType,
}: {
  items: MetaContentItem[];
  contentType: ContentType;
}) {
  const kpiOptions = getKpiOptions(contentType);

  const availableKpis = kpiOptions.filter((opt) =>
    items.some((item) => (item.metrics[opt.key] ?? 0) > 0),
  );

  // Pick first available KPI as default — falls back to config default if nothing has data yet
  const [selectedKpi, setSelectedKpi] = useState<MetricKey>(
    () => availableKpis[0]?.key ?? getDefaultKpi(contentType),
  );

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-zinc-50 p-5 text-sm text-stone">
        {CONTENT_TYPE_CONFIG[contentType].emptyState}
      </div>
    );
  }

  const isStories = contentType === "stories";

  return (
    <div className="mt-4">
      {/* KPI pills */}
      {availableKpis.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {availableKpis.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedKpi(opt.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedKpi === opt.key
                  ? "bg-ink text-white"
                  : "bg-zinc-100 text-stone hover:bg-zinc-200 hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid — 3 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:grid-cols-4">
        {items.map((item) => {
          const kpiValue = item.metrics[selectedKpi];

          return (
            <article key={item.id}>
              <div
                className="relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-100"
              >
                {item.mediaUrl ? (
                  <img
                    src={item.mediaUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-stone">
                    Keine Vorschau
                  </div>
                )}

                {/* Media type icon — top right */}
                <div className="absolute right-1.5 top-1.5 rounded-md bg-black/40 p-1 backdrop-blur-sm">
                  <MediaIcon contentType={contentType} />
                </div>

                {/* KPI badge — bottom center */}
                {kpiValue !== undefined && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 backdrop-blur-sm">
                    <span className="text-xs font-semibold tabular-nums text-white">
                      {fmtNum(kpiValue)}
                    </span>
                  </div>
                )}
              </div>

              {/* Below thumbnail */}
              <div className="mt-1.5 px-0.5">
                <p className="text-xs text-stone">{formatPublishedAt(item.publishedAt)}</p>
                {isStories && (
                  <div className="mt-1">
                    <StoryDownloadButton story={item} />
                  </div>
                )}
                {!isStories && item.permalink && (
                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block text-xs text-stone underline underline-offset-2 hover:text-ink"
                  >
                    Öffnen
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
