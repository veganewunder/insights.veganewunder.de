import { notFound } from "next/navigation";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { ContentPerformanceList } from "@/components/dashboard/content-performance-list";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { StoryTimeline } from "@/components/dashboard/story-timeline";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientByShareToken } from "@/lib/data/dashboard-store";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ range?: string }>;
};

export default async function SharePage({ params, searchParams }: PageProps) {
  try {
    const { token } = await params;
    const { range } = await searchParams;
    const client = await getDashboardClientByShareToken(token);

    if (!client) {
      notFound();
    }

    const activeRange = range === "30d" ? "30d" : "7d";
    const metrics = client.metrics[activeRange];
    const audience = client.audience[activeRange];
    const content = client.contentPerformance[activeRange];

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">Analysezeitraum</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">{client.name}</h1>
          </div>
          <div className="inline-flex rounded-xl border border-line bg-panel p-1 shadow-panel">
            {[
              { key: "7d", label: "7 Tage" },
              { key: "30d", label: "30 Tage" },
            ].map((option) => (
              <a
                key={option.key}
                href={`?range=${option.key}`}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeRange === option.key ? "bg-ink text-white" : "text-stone hover:text-ink"
                }`}
              >
                {option.label}
              </a>
            ))}
          </div>
        </header>

        <SyncBanner lastSyncedAt={client.lastSyncedAt} compact />
        <KpiGrid metrics={metrics} />

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <Panel key={metric.key} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone">{metric.label}</p>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <p className="text-2xl font-bold tracking-tight text-ink">{metric.changeLabel}</p>
                  <span
                    className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      metric.changePercent >= 0 ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                    }`}
                  >
                    {metric.changePercent >= 0 ? "↑" : "↓"} {metric.changeLabel}
                  </span>
                </div>
                <p className="mt-2 text-xs text-stone">Vergleich zur Vorperiode</p>
              </Panel>
            ))}
          </div>
          <Panel className="p-5">
            <SectionHeading title={activeRange === "7d" ? "Verlauf 7 Tage" : "Verlauf 30 Tage"} />
            <StoryTimeline points={client.timeline[activeRange]} />
          </Panel>
        </section>

        <section>
          <div className="mb-4">
            <SectionHeading title="Audience Composition" description="Demografische Verteilung deiner Follower" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone">Top Länder</p>
              {audience.countries.length > 0 ? (
                <AudienceBars items={audience.countries} />
              ) : (
                <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
              )}
            </Panel>
            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone">Top Städte</p>
              {audience.cities.length > 0 ? (
                <AudienceBars items={audience.cities} />
              ) : (
                <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
              )}
            </Panel>
            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone">Altersgruppen</p>
              {audience.ageGroups.length > 0 ? (
                <AudienceBars items={audience.ageGroups} />
              ) : (
                <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
              )}
            </Panel>
          </div>
        </section>

        <Panel className="p-5">
          <SectionHeading title="Content Performance" description="Top Inhalte im ausgewählten Zeitraum" />
          <ContentPerformanceList items={content} />
        </Panel>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Live Daten konnten nicht geladen werden";

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <LiveDataErrorPanel
          title="Share Ansicht konnte nicht geladen werden"
          message={message}
        />
      </main>
    );
  }
}
