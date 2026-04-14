"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { StorySnapshotRow } from "@/lib/data/story-archive";
import { StoryDownloadButton } from "@/components/dashboard/story-download-button";
import type { MetaContentItem } from "@/types/insights";

function formatDate(value: string | null) {
  if (!value) return "Datum unbekannt";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toMetaContentItem(row: StorySnapshotRow): MetaContentItem {
  return {
    id: row.story_id,
    contentType: "stories",
    contentTypeLabel: "Stories",
    title: row.caption ?? "Story",
    caption: row.caption,
    platformLabel: "Instagram",
    mediaTypeLabel: "Story",
    mediaUrl: row.archived_media_url ?? row.media_url,
    permalink: null,
    publishedAt: row.timestamp,
    likeCount: 0,
    commentCount: 0,
    metrics: {},
  };
}

function AddManualIds({ onAdded }: { onAdded: (rows: StorySnapshotRow[]) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const ids = text.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/story-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyIds: ids }),
      });
      if (!res.ok) {
        const body = await res.json() as { message?: string };
        throw new Error(body.message ?? "Fehler");
      }
      // Reload stories
      const listRes = await fetch("/api/story-archive");
      const data = await listRes.json() as { stories: StorySnapshotRow[] };
      onAdded(data.stories);
      setText("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-sm text-stone transition hover:border-ink hover:bg-white hover:text-ink"
      >
        <Plus className="size-4" />
        Vergangene Story-IDs manuell hinzufügen
      </button>
    );
  }

  return (
    <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(244,244,245,0.84))] p-5 shadow-[0_16px_40px_rgba(24,24,27,0.06)]">
      <p className="mb-2 text-sm font-medium text-ink">Story-IDs einfügen</p>
      <p className="mb-3 text-xs text-stone">
        Eine ID pro Zeile oder kommagetrennt. Die ID findest du in Meta Business Suite in der URL einer Story.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"17841407887765785\n18078799889397602"}
        rows={4}
        className="w-full rounded-2xl border border-white/80 bg-white p-3 font-mono text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-ink/20"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/10 disabled:opacity-50"
        >
          {loading ? "Wird gespeichert…" : "Hinzufügen"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setText(""); }}
          className="rounded-2xl border border-line bg-white/70 px-4 py-2.5 text-sm text-stone hover:text-ink"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export function StoryArchivePanel({ initialStories }: { initialStories: StorySnapshotRow[] }) {
  const [stories, setStories] = useState<StorySnapshotRow[]>(initialStories);

  return (
    <div className="mt-4 space-y-4">
      <AddManualIds onAdded={setStories} />

      {stories.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-line bg-white/70 p-8 text-center text-sm text-stone">
          Noch keine Stories gespeichert. Ab dem nächsten Sync werden aktive Stories automatisch erfasst.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stories.map((row) => {
            const previewUrl = row.archived_media_url ?? row.media_url;

            return (
              <div
                key={row.id}
                className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/80 shadow-[0_18px_44px_rgba(24,24,27,0.08)]"
              >
                <div className="relative aspect-[9/16] bg-zinc-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Story"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-stone">
                      Keine Vorschau
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent px-3 pb-3 pt-10">
                    <p className="text-xs font-medium text-white/90">{formatDate(row.timestamp)}</p>
                  </div>
                </div>
                <div className="p-4">
                  {row.caption ? (
                    <p className="line-clamp-3 text-sm leading-6 text-ink">{row.caption}</p>
                  ) : (
                    <p className="text-sm text-stone">Story ohne Caption</p>
                  )}
                  <div className="mt-3">
                    <StoryDownloadButton story={toMetaContentItem(row)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
