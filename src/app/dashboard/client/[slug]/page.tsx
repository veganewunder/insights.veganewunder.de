import { notFound } from "next/navigation";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { AudienceGenderPie } from "@/components/dashboard/audience-gender-pie";
import { ComparisonGrid } from "@/components/dashboard/comparison-grid";
import { ClientHeader } from "@/components/dashboard/client-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MediaGallery } from "@/components/dashboard/media-gallery";
import { ReportExportActions } from "@/components/dashboard/report-export-actions";
import { ReportStatGrid } from "@/components/dashboard/report-stat-grid";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientBySlug } from "@/lib/data/dashboard-store";
import { CONTENT_TYPE_CONFIG, DEFAULT_CONTENT_TYPE, isContentType } from "@/lib/insights/content-config";
import { buildAverageMetrics, formatAudienceDataDate } from "@/lib/insights/reporting";

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
    const media = contentSlice.media;
    const contentConfig = CONTENT_TYPE_CONFIG[activeContentType];
    const summaryMetrics = metrics.slice(0, 3);
    const contextLabel = `${contentConfig.label} · ${activeRange === "7d" ? "Letzte 7 Tage" : "Letzte 30 Tage"}`;
    const averageMetrics = buildAverageMetrics(media);
    const reportElementId = `client-report-${client.slug}`;

    return (
      <DashboardShell>
        <ClientHeader
          client={client}
          activeRange={activeRange}
          activeContentType={activeContentType}
          activeMetric={activeMetric}
          availableMetrics={availableMetrics}
        />
        <ReportExportActions
          reportElementId={reportElementId}
          clientName={client.name}
          activeContentLabel={contentConfig.label}
          activeRangeLabel={activeRange === "7d" ? "Letzte 7 Tage" : "Letzte 30 Tage"}
          reportDateLabel={formatAudienceDataDate(client.lastSyncedAt)}
          mediaItems={media}
        />

        <div id={reportElementId} className="space-y-6">
          <SyncBanner lastSyncedAt={client.lastSyncedAt} showSyncButton />

          <Panel className="p-5">
            <SectionHeading
              eyebrow="Inhalte"
              title={
                activeContentType === "stories"
                  ? `Story-Abfolge der ${activeRange === "7d" ? "letzten 7 Tage" : "letzten 30 Tage"}`
                  : `${contentConfig.label} im Detail`
              }
              description={
                activeContentType === "stories"
                  ? "Stories werden in chronologischer Reihenfolge mit den wichtigsten Reaktionen dargestellt."
                  : `Alle ${contentConfig.label.toLowerCase()} des gewählten Zeitraums auf einen Blick.`
              }
            />
            <MediaGallery items={media} contentType={activeContentType} />
          </Panel>

          {summaryMetrics.length > 0 ? (
            <section>
              <div className="mb-4">
                <SectionHeading
                  title={`${contentConfig.label} auf einen Blick`}
                  description={`${contextLabel} auf Basis der wichtigsten Kennzahlen.`}
                />
              </div>
              <KpiGrid metrics={summaryMetrics} contextLabel={contextLabel} />
            </section>
          ) : null}

          {averageMetrics.length > 0 ? (
            <section>
              <div className="mb-4">
                <SectionHeading
                  title="Durchschnittliche Performance"
                  description="Durchschnittswerte pro Inhalt inklusive berechneter Engagement Rate."
                />
              </div>
              <ReportStatGrid items={averageMetrics} />
            </section>
          ) : null}

          {summaryMetrics.length > 0 ? (
            <section>
              <div className="mb-4">
                <SectionHeading
                  title={`${contentConfig.label} im Zeitvergleich`}
                  description={`${contextLabel} im Vergleich zum vorherigen Zeitraum.`}
                />
              </div>
              <ComparisonGrid metrics={summaryMetrics} />
            </section>
          ) : null}

          <section>
            <div className="mb-4">
              <SectionHeading
                title="Zielgruppe im Überblick"
                description="Standorte und demografische Schwerpunkte Ihrer Community."
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
                <p className="text-xs font-semibold uppercase tracking-widest text-stone">Geschlechterverteilung</p>
                <AudienceGenderPie items={audience.gender} />
              </Panel>
            </div>
          </section>
        </div>
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
