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
    mediaUrl: row.media_url,
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
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-2 text-sm text-stone hover:border-ink hover:text-ink"
      >
        <Plus className="size-4" />
        Vergangene Story-IDs manuell hinzufügen
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-zinc-50 p-4">
      <p className="mb-2 text-sm font-medium text-ink">Story-IDs einfügen</p>
      <p className="mb-3 text-xs text-stone">
        Eine ID pro Zeile oder kommagetrennt. Die ID findest du in Meta Business Suite in der URL einer Story.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"17841407887765785\n18078799889397602"}
        rows={4}
        className="w-full rounded-lg border border-line bg-white p-3 font-mono text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-ink/20"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Wird gespeichert…" : "Hinzufügen"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setText(""); }}
          className="rounded-lg border border-line px-4 py-2 text-sm text-stone hover:text-ink"
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
        <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-stone">
          Noch keine Stories gespeichert. Ab dem nächsten Sync werden aktive Stories automatisch erfasst.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stories.map((row) => (
            <div key={row.id} className="overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
              <div className="aspect-[9/16] bg-zinc-100">
                {row.media_url ? (
                  <img
                    src={row.media_url}
                    alt="Story"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-stone">
                    Keine Vorschau
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-stone">{formatDate(row.timestamp)}</p>
                {row.caption && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink">{row.caption}</p>
                )}
                <div className="mt-2">
                  <StoryDownloadButton story={toMetaContentItem(row)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
