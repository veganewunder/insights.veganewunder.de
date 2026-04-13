import Image from "next/image";
import { notFound } from "next/navigation";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { ComparisonGrid } from "@/components/dashboard/comparison-grid";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { MediaGallery } from "@/components/dashboard/media-gallery";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { InsightsFilters } from "@/components/dashboard/insights-filters";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientByShareToken } from "@/lib/data/dashboard-store";
import { getShareLinkByToken } from "@/lib/data/share-links";
import { CONTENT_TYPE_CONFIG, DEFAULT_CONTENT_TYPE, isContentType } from "@/lib/insights/content-config";
import { buildContentListForMetric, buildTimelineForMetric } from "@/lib/insights/content-insights";
import { getVisibilityForMetric, hasShareAccess } from "@/lib/share-visibility";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ range?: string; type?: string; metric?: string }>;
};

export default async function SharePage({ params, searchParams }: PageProps) {
  try {
    const { token } = await params;
    const { range, type, metric } = await searchParams;
    const [client, shareLink] = await Promise.all([
      getDashboardClientByShareToken(token),
      getShareLinkByToken(token),
    ]);

    if (!client || !shareLink) {
      notFound();
    }

    const activeRange = range === "30d" ? "30d" : "7d";
    const activeContentType = isContentType(type) ? type : DEFAULT_CONTENT_TYPE;
    const visibleSections = shareLink.visible_sections_json;
    const contentSlice = client.contentInsights[activeRange][activeContentType];
    const metrics = contentSlice.metrics.filter((entry) => {
      const visibilityKey = getVisibilityForMetric(entry.key);
      return visibilityKey ? hasShareAccess(visibleSections, visibilityKey) : true;
    });
    const availableMetrics = metrics.map((entry) => entry.key);
    const activeMetric = availableMetrics.includes(metric as typeof availableMetrics[number])
      ? (metric as typeof availableMetrics[number])
      : (availableMetrics[0] ?? CONTENT_TYPE_CONFIG[activeContentType].primaryMetric);
    const audience = client.audience[activeRange];
    const content = hasShareAccess(visibleSections, "content_performance")
      ? buildContentListForMetric(
          contentSlice.media,
          activeMetric,
          CONTENT_TYPE_CONFIG[activeContentType].secondaryMetric,
        )
      : [];
    const timelinePoints = hasShareAccess(visibleSections, "timeline")
      ? buildTimelineForMetric(contentSlice.media, activeMetric)
      : [];
    const media = hasShareAccess(visibleSections, "media_gallery") ? contentSlice.media : [];
    const contentConfig = CONTENT_TYPE_CONFIG[activeContentType];
    const summaryMetrics = metrics.slice(0, 3);
    const contextLabel = `${contentConfig.label} · ${activeRange === "7d" ? "Letzte 7 Tage" : "Letzte 30 Tage"}`;
    const showAudienceSection =
      hasShareAccess(visibleSections, "audience_countries") ||
      hasShareAccess(visibleSections, "audience_cities") ||
      hasShareAccess(visibleSections, "audience_age_groups") ||
      hasShareAccess(visibleSections, "audience_gender");

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-3">
              <Image src="/logo.png" alt="Vegane Wunder Logo" width={48} height={48} className="size-12 object-contain" />
              <div>
                {client.igUsername && (
                  <p className="text-sm font-medium text-stone">@{client.igUsername}</p>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-ink">Instagram Insights</h1>
              </div>
            </div>
            <InsightsFilters
              basePath={`/share/${token}`}
              activeRange={activeRange}
              activeContentType={activeContentType}
              activeMetric={activeMetric}
              availableMetrics={availableMetrics}
            />
          </div>
        </header>

        <SyncBanner lastSyncedAt={client.lastSyncedAt} compact />

        {hasShareAccess(visibleSections, "media_gallery") ? (
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
                  ? "Stories werden als sequenzieller Stream mit Replies, Exits und Navigation dargestellt."
                  : `Visuelle Einzelansicht für ${contentConfig.label.toLowerCase()} im freigegebenen Reporting.`
              }
            />
            <MediaGallery items={media} contentType={activeContentType} />
          </Panel>
        ) : null}

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

        {summaryMetrics.length > 0 ? (
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
        ) : null}


        {showAudienceSection ? (
          <section>
            <div className="mb-4">
              <SectionHeading
                eyebrow="Audience"
                title="Audience Composition"
                description="Demografische Verteilung deiner Follower"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {hasShareAccess(visibleSections, "audience_countries") ? (
                <Panel className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone">Top Länder</p>
                  {audience.countries.length > 0 ? (
                    <AudienceBars items={audience.countries} />
                  ) : (
                    <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
                  )}
                </Panel>
              ) : null}
              {hasShareAccess(visibleSections, "audience_cities") ? (
                <Panel className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone">Top Städte</p>
                  {audience.cities.length > 0 ? (
                    <AudienceBars items={audience.cities} />
                  ) : (
                    <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
                  )}
                </Panel>
              ) : null}
              {hasShareAccess(visibleSections, "audience_age_groups") ? (
                <Panel className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone">Altersgruppen</p>
                  {audience.ageGroups.length > 0 ? (
                    <AudienceBars items={audience.ageGroups} />
                  ) : (
                    <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
                  )}
                </Panel>
              ) : null}
              {hasShareAccess(visibleSections, "audience_gender") ? (
                <Panel className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone">Geschlecht</p>
                  {audience.gender.length > 0 ? (
                    <AudienceBars items={audience.gender} />
                  ) : (
                    <p className="mt-4 text-sm text-stone">Keine Daten verfügbar.</p>
                  )}
                </Panel>
              ) : null}
            </div>
          </section>
        ) : null}
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
