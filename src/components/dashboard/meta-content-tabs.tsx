"use client";

import { useState } from "react";
import { Clapperboard, CirclePlay } from "lucide-react";
import { MetaContentItem } from "@/types/insights";
import type { MetricKey } from "@/types/insights";
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

const STORY_KPIS: KpiOption[] = [
  { key: "views", label: "Aufrufe" },
  { key: "reach", label: "Reichweite" },
  { key: "replies", label: "Antworten" },
];

function KpiPills({
  options,
  items,
  selected,
  onSelect,
}: {
  options: KpiOption[];
  items: MetaContentItem[];
  selected: MetricKey;
  onSelect: (key: MetricKey) => void;
}) {
  const available = options.filter((opt) =>
    items.some((item) => (item.metrics[opt.key] ?? 0) > 0),
  );
  if (available.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {available.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected === opt.key
              ? "bg-ink text-white"
              : "bg-zinc-100 text-stone hover:bg-zinc-200 hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MetaContentGrid({
  items,
  isStories,
  selectedKpi,
}: {
  items: MetaContentItem[];
  isStories: boolean;
  selectedKpi: MetricKey;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-zinc-50 p-5 text-sm text-stone">
        {isStories
          ? "Keine aktiven Stories gefunden. Stories sind nur 24 Stunden sichtbar."
          : "Keine aktuellen Inhalte gefunden."}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-1 sm:gap-2">
      {items.map((item) => {
        const kpiValue = item.metrics[selectedKpi];
        return (
          <article key={item.id}>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
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
              <div className="absolute right-2 top-2 rounded-md bg-black/40 p-1 backdrop-blur-sm">
                {isStories ? (
                  <CirclePlay className="size-4 text-white" />
                ) : (
                  <Clapperboard className="size-4 text-white" />
                )}
              </div>

              {/* KPI value — bottom left */}
              {kpiValue !== undefined && (
                <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                  <span className="text-sm font-semibold tabular-nums text-white">
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
  );
}

type Tab = "reels" | "stories";

export function MetaContentTabs({
  reels,
  stories,
}: {
  reels: MetaContentItem[];
  stories: MetaContentItem[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("reels");
  const [reelKpi, setReelKpi] = useState<MetricKey>("views");
  const [storyKpi, setStoryKpi] = useState<MetricKey>("views");

  const isStories = activeTab === "stories";
  const items = isStories ? stories : reels;
  const kpiOptions = isStories ? STORY_KPIS : REEL_KPIS;
  const selectedKpi = isStories ? storyKpi : reelKpi;
  const setSelectedKpi = isStories ? setStoryKpi : setReelKpi;

  return (
    <div>
      <div className="mt-4 inline-flex rounded-xl border border-line bg-zinc-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("reels")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "reels" ? "bg-ink text-white" : "text-stone hover:text-ink"
          }`}
        >
          Aktuelle Reels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stories")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "stories" ? "bg-ink text-white" : "text-stone hover:text-ink"
          }`}
        >
          Aktuelle Stories
        </button>
      </div>

      <KpiPills
        options={kpiOptions}
        items={items}
        selected={selectedKpi}
        onSelect={setSelectedKpi}
      />

      <MetaContentGrid items={items} isStories={isStories} selectedKpi={selectedKpi} />
    </div>
  );
}
