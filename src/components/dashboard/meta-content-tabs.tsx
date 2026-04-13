"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { MetaContentItem } from "@/types/insights";
import { StoryDownloadButton } from "@/components/dashboard/story-download-button";

function formatPublishedAt(value: string | null) {
  if (!value) return "Unbekanntes Datum";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("de-DE");
}

function MetaContentGrid({ items, isStories }: { items: MetaContentItem[]; isStories: boolean }) {
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
    <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border border-line bg-panel shadow-panel"
        >
          <div className="aspect-square bg-zinc-100">
            {item.mediaUrl ? (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone">
                Keine Vorschau
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">
              {item.caption ?? item.title}
            </p>
            <p className="mt-1 text-xs text-stone">{formatPublishedAt(item.publishedAt)}</p>
            {!isStories && (
              <div className="mt-2 flex items-center gap-3 text-xs text-stone">
                <span className="flex items-center gap-1">
                  <Heart className="size-3" />
                  {fmtNum(item.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" />
                  {fmtNum(item.commentCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3" />
                  —
                </span>
              </div>
            )}
            {isStories && (
              <div className="mt-2">
                <StoryDownloadButton story={item} />
              </div>
            )}
            {item.permalink && (
              <a
                href={item.permalink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-xs font-medium text-stone underline underline-offset-2 hover:text-ink"
              >
                Beitrag öffnen
              </a>
            )}
          </div>
        </article>
      ))}
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

      {activeTab === "reels" ? (
        <MetaContentGrid items={reels} isStories={false} />
      ) : (
        <MetaContentGrid items={stories} isStories={true} />
      )}
    </div>
  );
}
