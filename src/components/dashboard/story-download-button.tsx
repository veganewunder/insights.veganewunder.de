"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { StoryInsightsData } from "@/lib/meta/story-insights";
import type { MetaContentItem } from "@/types/insights";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function val(n: number) {
  return n > 0 ? fmt(n) : "—";
}

function Section({ title, total, children }: { title: string; total?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#ebebeb] px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-base font-bold">{title}</p>
        {total && <p className="text-xl font-bold">{total}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[#555]">{label}</span>
      <span className="text-sm font-medium text-[#1a1a1a]">{value}</span>
    </div>
  );
}

function InsightsCard({
  insights,
  cardRef,
}: {
  insights: StoryInsightsData;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const profileTotal = insights.profileVisits + insights.bioLinkClicked + insights.follows;

  return (
    <div
      ref={cardRef}
      style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff" }}
      className="w-[390px] overflow-hidden bg-white text-[#1a1a1a]"
    >
      {/* Story preview */}
      <div className="relative h-[260px] w-full overflow-hidden bg-[#1a1a1a]">
        {insights.mediaUrl ? (
          <img
            src={insights.mediaUrl}
            alt="Story"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            Keine Vorschau
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-xs text-white/80">{formatDate(insights.publishedAt)}</p>
          {insights.caption && (
            <p className="mt-1 line-clamp-2 text-sm text-white">{insights.caption}</p>
          )}
        </div>
      </div>

      {/* Reach header */}
      <div className="border-b border-[#ebebeb] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0f0]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="text-lg font-semibold">{fmt(insights.reach)}</span>
          <span className="text-sm text-[#888]">Erreichte Konten</span>
        </div>
      </div>

      {/* Übersicht */}
      <Section title="Übersicht">
        <Row label="Aufrufe" value={fmt(insights.views)} />
        <Row label="Interaktionen" value={val(insights.totalInteractions)} />
        <Row label="Profilaktivitäten" value={val(insights.profileActivity)} />
      </Section>

      {/* Interaktionen */}
      <Section title="Interaktionen">
        <Row label="Antworten" value={val(insights.replies)} />
        <Row label="Geteilte Inhalte" value={val(insights.shares)} />
      </Section>

      {/* Navigation */}
      <Section title="Navigation" total={val(insights.navigationTotal)}>
        <Row label="Weiter" value={val(insights.tapForward)} />
        <Row label="Verlassen" value={val(insights.tapExit)} />
        <Row label="Nächste Story" value={val(insights.swipeForward)} />
        <Row label="Zurück" value={val(insights.tapBack)} />
      </Section>

      {/* Profilaktivitäten */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-base font-bold">Profilaktivitäten</p>
          <p className="text-xl font-bold">{val(profileTotal)}</p>
        </div>
        <Row label="Profilaufrufe" value={val(insights.profileVisits)} />
        <Row label="Auf externen Link getippt" value={val(insights.bioLinkClicked)} />
        <Row label="Neue Follower" value={val(insights.follows)} />
      </div>

      {/* Footer */}
      <div className="border-t border-[#ebebeb] bg-[#fafafa] px-5 py-3">
        <p className="text-center text-xs text-[#999]">veganewunder.de · Instagram Story Insights</p>
      </div>
    </div>
  );
}

export function StoryDownloadButton({ story }: { story: MetaContentItem }) {
  const [state, setState] = useState<"idle" | "loading" | "preview" | "downloading" | "error">("idle");
  const [insights, setInsights] = useState<StoryInsightsData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleOpen() {
    setState("loading");
    try {
      const res = await fetch(`/api/meta/story-insights?id=${story.id}`);
      if (!res.ok) {
        const body = await res.json() as { message?: string };
        throw new Error(body.message ?? "Unbekannter Fehler");
      }
      const data = await res.json() as StoryInsightsData;
      setInsights(data);
      setState("preview");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Fehler beim Laden");
      setState("error");
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setState("downloading");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `story-insights-${story.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setState("preview");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-stone transition-colors hover:border-ink hover:text-ink"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Insights herunterladen
      </button>

      {state !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setState("idle"); }}
        >
          <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-semibold text-ink">Story Insights</p>
              <button type="button" onClick={() => setState("idle")} className="text-stone hover:text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {state === "loading" && (
              <div className="flex h-48 items-center justify-center px-8">
                <p className="text-sm text-stone">Insights werden geladen…</p>
              </div>
            )}

            {state === "error" && (
              <div className="flex h-48 flex-col items-center justify-center gap-3 px-8">
                <p className="text-sm text-stone">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="rounded-full border border-line px-4 py-2 text-sm text-stone hover:text-ink"
                >
                  Schließen
                </button>
              </div>
            )}

            {(state === "preview" || state === "downloading") && insights && (
              <>
                <div className="overflow-y-auto">
                  <InsightsCard insights={insights} cardRef={cardRef} />
                </div>
                <div className="border-t border-line px-5 py-4">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={state === "downloading"}
                    className="w-full rounded-full bg-ink py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                  >
                    {state === "downloading" ? "Wird gespeichert…" : "Als PNG herunterladen"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
