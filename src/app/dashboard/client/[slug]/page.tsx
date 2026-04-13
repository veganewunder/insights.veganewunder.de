import { notFound } from "next/navigation";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { ComparisonGrid } from "@/components/dashboard/comparison-grid";
import { ClientHeader } from "@/components/dashboard/client-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MediaGallery } from "@/components/dashboard/media-gallery";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientBySlug } from "@/lib/data/dashboard-store";
import { CONTENT_TYPE_CONFIG, DEFAULT_CONTENT_TYPE, isContentType } from "@/lib/insights/content-config";
import {
  buildContentListForMetric,
  buildTimelineForMetric,
} from "@/lib/insights/content-insights";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string; type?: string; metric?: string }>;
};

export default async function ClientPage({ params, searchParams }: PageProps) {
  try {
    const { slug } = await params;
    const { range, type, metric } = await searchParams;
    const client = await getDashboardClientBySlug(slug);

    if (!client) {
      notFound();
    }

    const activeRange = range === "30d" ? "30d" : "7d";
    const activeContentType = isContentType(type) ? type : DEFAULT_CONTENT_TYPE;
    const contentSlice = client.contentInsights[activeRange][activeContentType];
    const metrics = contentSlice.metrics;
    const availableMetrics = metrics.map((entry) => entry.key);
    const activeMetric = availableMetrics.includes(metric as typeof availableMetrics[number])
      ? (metric as typeof availableMetrics[number])
      : (availableMetrics[0] ?? CONTENT_TYPE_CONFIG[activeContentType].primaryMetric);
    const audience = client.audience[activeRange];
    const content = buildContentListForMetric(
      contentSlice.media,
      activeMetric,
      CONTENT_TYPE_CONFIG[activeContentType].secondaryMetric,
    );
    const timeline = buildTimelineForMetric(contentSlice.media, activeMetric);
    const media = contentSlice.media;
    const contentConfig = CONTENT_TYPE_CONFIG[activeContentType];
    const summaryMetrics = metrics.slice(0, 3);
    const contextLabel = `${contentConfig.label} · ${activeRange === "7d" ? "Letzte 7 Tage" : "Letzte 30 Tage"}`;

    return (
      <DashboardShell>
        <ClientHeader
          client={client}
          activeRange={activeRange}
          activeContentType={activeContentType}
          activeMetric={activeMetric}
          availableMetrics={availableMetrics}
        />
        <SyncBanner lastSyncedAt={client.lastSyncedAt} showSyncButton />

        <Panel className="p-5">
          <SectionHeading
            eyebrow="Inhalte"
            title={
              activeContentType === "stories"
                ? `Story Strip der ${activeRange === "7d" ? "letzten 7 Tage" : "letzten 30 Tage"}`
                : `${contentConfig.label} im Detail`
            }
            description={
              activeContentType === "stories"
                ? `Stories werden als sequenzieller Stream mit Replies, Exits und Navigation gezeigt.`
                : `Visuelle Einzelansicht für ${contentConfig.label.toLowerCase()} aus dem letzten Sync.`
            }
          />
          <MediaGallery items={media} contentType={activeContentType} />
        </Panel>

        {summaryMetrics.length > 0 ? (
          <section>
            <div className="mb-4">
              <SectionHeading
                eyebrow="KPI Summary"
                title={`${contentConfig.label} auf einen Blick`}
                description={`${contextLabel} auf Basis der wichtigsten Kennzahlen.`}
              />
            </div>
            <KpiGrid metrics={summaryMetrics} contextLabel={contextLabel} />
          </section>
        ) : null}

        <section>
          <div className="mb-4">
            <SectionHeading
              eyebrow="Vorperiode"
              title={`${contentConfig.label} im Vergleich`}
              description={`${contextLabel} im Vergleich zur direkt vorherigen Periode.`}
            />
          </div>
          <ComparisonGrid metrics={summaryMetrics} />
        </section>


        <section>
          <div className="mb-4">
            <SectionHeading
              eyebrow="Audience"
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
