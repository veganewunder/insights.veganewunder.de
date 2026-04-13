import { notFound } from "next/navigation";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { ClientHeader } from "@/components/dashboard/client-header";
import { ContentPerformanceList } from "@/components/dashboard/content-performance-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LiveMetaContentPanel } from "@/components/dashboard/live-meta-content-panel";
import { StoryTimeline } from "@/components/dashboard/story-timeline";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientBySlug } from "@/lib/data/dashboard-store";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

export default async function ClientPage({ params, searchParams }: PageProps) {
  try {
    const { slug } = await params;
    const { range } = await searchParams;
    const client = await getDashboardClientBySlug(slug);

    if (!client) {
      notFound();
    }

    const activeRange = range === "30d" ? "30d" : "7d";
    const metrics = client.metrics[activeRange];
    const audience = client.audience[activeRange];
    const content = client.contentPerformance[activeRange];

    return (
      <DashboardShell>
        <ClientHeader client={client} activeRange={activeRange} />
        <SyncBanner lastSyncedAt={client.lastSyncedAt} />

        <KpiGrid metrics={metrics} />

        {/* Performance Trends */}
        <section>
          <div className="mb-4">
            <SectionHeading
              title="Performance Trends"
              description="Entwicklung deiner wichtigsten Metriken"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <Panel key={metric.key} className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone">
                    {metric.label}
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <p className="text-2xl font-bold tracking-tight text-ink">
                      {metric.changeLabel}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        metric.changePercent >= 0
                          ? "bg-green-50 text-success"
                          : "bg-red-50 text-danger"
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
              <SectionHeading
                title={activeRange === "7d" ? "Verlauf 7 Tage" : "Verlauf 30 Tage"}
              />
              <StoryTimeline points={client.timeline[activeRange]} />
            </Panel>
          </div>
        </section>

        {/* Audience Composition */}
        <section>
          <div className="mb-4">
            <SectionHeading
              title="Audience Composition"
              description="Demografische Verteilung deiner Follower"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone">Geschlecht</p>
              {audience.gender.length > 0 ? (
                <AudienceBars items={audience.gender} />
              ) : (
                <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
              )}
            </Panel>
          </div>
        </section>

        {/* Content Performance */}
        <Panel className="p-5">
          <SectionHeading
            title="Content Performance"
            description="Top Inhalte im ausgewählten Zeitraum"
          />
          <ContentPerformanceList items={content} />
        </Panel>

        {/* Recent Content */}
        <LiveMetaContentPanel />
      </DashboardShell>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Live Daten konnten nicht geladen werden";

    return (
      <DashboardShell>
        <LiveDataErrorPanel
          title="Kundenansicht konnte nicht geladen werden"
          message={message}
        />
      </DashboardShell>
    );
  }
}
