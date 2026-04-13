"use client";

import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { MetaContentItem } from "@/types/insights";

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

function GalleryGrid({ items, emptyText }: { items: MetaContentItem[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-zinc-50 p-5 text-sm text-stone">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border border-line bg-panel shadow-panel"
        >
          <div className="aspect-[4/5] bg-zinc-100">
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
          <div className="space-y-3 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone">
                {item.mediaTypeLabel}
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-ink">
                {item.caption ?? item.title}
              </p>
              <p className="mt-1 text-xs text-stone">{formatPublishedAt(item.publishedAt)}</p>
            </div>

            {item.mediaTypeLabel !== "Story" ? (
              <div className="flex items-center gap-4 text-xs text-stone">
                <span className="flex items-center gap-1">
                  <Heart className="size-3.5" />
                  {fmtNum(item.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3.5" />
                  {fmtNum(item.commentCount)}
                </span>
              </div>
            ) : null}

            {item.permalink ? (
              <a
                href={item.permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-medium text-ink underline underline-offset-4 hover:text-stone"
              >
                In Instagram öffnen
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function MediaGallery({
  reels,
  stories,
}: {
  reels: MetaContentItem[];
  stories: MetaContentItem[];
}) {
  const [activeTab, setActiveTab] = useState<"reels" | "stories">(
    reels.length > 0 ? "reels" : "stories",
  );

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
          Reels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stories")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "stories" ? "bg-ink text-white" : "text-stone hover:text-ink"
          }`}
        >
          Stories
        </button>
      </div>

      {activeTab === "reels" ? (
        <GalleryGrid items={reels} emptyText="Keine aktuellen Reels verfügbar." />
      ) : (
        <GalleryGrid
          items={stories}
          emptyText="Keine aktiven Stories verfügbar. Stories sind nur begrenzt sichtbar."
        />
      )}
    </div>
  );
}
