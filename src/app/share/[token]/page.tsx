import Image from "next/image";
import { notFound } from "next/navigation";
import { AutoSyncOnView } from "@/components/dashboard/auto-sync-on-view";
import { AudienceBars } from "@/components/dashboard/audience-bars";
import { AudienceGenderPie } from "@/components/dashboard/audience-gender-pie";
import { ComparisonGrid } from "@/components/dashboard/comparison-grid";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { MediaGallery } from "@/components/dashboard/media-gallery";
import { ReportStatGrid } from "@/components/dashboard/report-stat-grid";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { InsightsFilters } from "@/components/dashboard/insights-filters";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClientByShareToken } from "@/lib/data/dashboard-store";
import { getShareLinkByToken } from "@/lib/data/share-links";
import { CONTENT_TYPE_CONFIG, DEFAULT_CONTENT_TYPE, isContentType } from "@/lib/insights/content-config";
import { buildAverageMetrics } from "@/lib/insights/reporting";
import { isNextNotFoundError } from "@/lib/next-errors";
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

    const activeRange = range === "7d" ? "7d" : "30d";
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
    const media = hasShareAccess(visibleSections, "media_gallery") ? contentSlice.media : [];
    const contentConfig = CONTENT_TYPE_CONFIG[activeContentType];
    const summaryMetrics = metrics.slice(0, 3);
    const contextLabel = `${contentConfig.label} · ${activeRange === "7d" ? "Letzte 7 Tage" : "Letzte 30 Tage"}`;
    const averageMetrics = buildAverageMetrics(media);
    const showAudienceSection =
      hasShareAccess(visibleSections, "audience_countries") ||
      hasShareAccess(visibleSections, "audience_cities") ||
      hasShareAccess(visibleSections, "audience_age_groups") ||
      hasShareAccess(visibleSections, "audience_gender");
    const reportElementId = `share-report-${token}`;
    const greeting = shareLink.recipient_name_nullable
      ? `Hey, ${shareLink.recipient_name_nullable}, hier findest du unsere aktuellen Insights. Wir freuen uns auf eine mögliche Zusammenarbeit.`
      : "Hey, hier findest du unsere aktuellen Insights, wir freuen uns auf eine mögliche Zusammenarbeit.";

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <AutoSyncOnView />
        <header className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-3">
              <Image src="/logo.png" alt="Vegane Wunder Logo" width={48} height={48} className="size-12 object-contain" />
              <div>
                {client.igUsername && (
                  <p className="text-sm font-medium text-stone">@{client.igUsername}</p>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-ink">Instagram Reporting</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone">{greeting}</p>
                <a
                  href="https://instagram.com/veganewunder"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
                >
                  @veganewunder
                </a>
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

        <div id={reportElementId} className="space-y-6">
          <SyncBanner lastSyncedAt={client.lastSyncedAt} compact />

          {hasShareAccess(visibleSections, "media_gallery") ? (
            <Panel className="p-5">
              <SectionHeading
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
          ) : null}

          {summaryMetrics.length > 0 ? (
            <Panel className="p-5">
              <div>
                <SectionHeading
                  title={`${contentConfig.label} auf einen Blick`}
                  description={`${contextLabel} auf Basis der wichtigsten Kennzahlen.`}
                />
              </div>
              <div className="mt-5">
                <KpiGrid metrics={summaryMetrics} contextLabel={contextLabel} />
              </div>
            </Panel>
          ) : null}

          {averageMetrics.length > 0 ? (
            <Panel className="p-5">
              <div>
                <SectionHeading
                  title="Durchschnittliche Performance"
                  description="Durchschnittswerte pro Inhalt inklusive berechneter Engagement Rate."
                />
              </div>
              <div className="mt-5">
                <ReportStatGrid items={averageMetrics} />
              </div>
            </Panel>
          ) : null}

          {summaryMetrics.length > 0 ? (
            <Panel className="p-5">
              <div>
                <SectionHeading
                  title={`${contentConfig.label} im Zeitvergleich`}
                  description={`${contextLabel} im Vergleich zum vorherigen Zeitraum.`}
                />
              </div>
              <div className="mt-5">
                <ComparisonGrid metrics={summaryMetrics} />
              </div>
            </Panel>
          ) : null}

          {showAudienceSection ? (
            <Panel className="p-5">
              <div>
                <SectionHeading
                  title="Zielgruppe im Überblick"
                  description="Standorte und demografische Schwerpunkte Ihrer Community."
                />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-4">
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
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone">Geschlechterverteilung</p>
                    <AudienceGenderPie items={audience.gender} />
                  </Panel>
                ) : null}
              </div>
            </Panel>
          ) : null}
        </div>
      </main>
    );
  } catch (error) {
    if (isNextNotFoundError(error)) {
      throw error;
    }

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
