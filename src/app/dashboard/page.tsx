import { AutoSyncOnView } from "@/components/dashboard/auto-sync-on-view";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { ShareLinksManager } from "@/components/dashboard/share-links-manager";
import { StoryArchivePanel } from "@/components/dashboard/story-archive-panel";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAppBaseUrl } from "@/lib/app-url";
import { getDashboardClient } from "@/lib/data/dashboard-store";
import { getShareLinksForClient, getFirstClientId } from "@/lib/data/share-links";
import { getStoredStories, getFirstAccountId } from "@/lib/data/story-archive";

export default async function DashboardPage() {
  try {
    const client = await getDashboardClient();
    const [clientIdResult, accountIdResult, baseUrlResult] = await Promise.allSettled([
      getFirstClientId(),
      getFirstAccountId(),
      getAppBaseUrl(),
    ]);

    const clientId = clientIdResult.status === "fulfilled" ? clientIdResult.value : null;
    const accountId = accountIdResult.status === "fulfilled" ? accountIdResult.value : null;
    const baseUrl = baseUrlResult.status === "fulfilled" ? baseUrlResult.value : "http://localhost:3000";

    const [shareLinksResult, storedStoriesResult] = await Promise.allSettled([
      clientId ? getShareLinksForClient(clientId) : Promise.resolve([]),
      accountId ? getStoredStories(accountId) : Promise.resolve([]),
    ]);

    const shareLinks = shareLinksResult.status === "fulfilled" ? shareLinksResult.value : [];
    const storedStories = storedStoriesResult.status === "fulfilled" ? storedStoriesResult.value : [];

    return (
      <DashboardShell>
        <AutoSyncOnView />
        <section className="overflow-hidden rounded-[2rem] border border-line bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(244,244,245,0.72)_55%,_rgba(228,232,221,0.9)_100%)] p-6 shadow-panel md:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-h-[120px] items-center">
              <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-5xl">
                Dashboard
              </h1>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <div className="min-w-[140px] rounded-[1.3rem] border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone">
                  Share Links
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {shareLinks.length}
                </p>
                <p className="mt-1 text-xs text-stone">aktiv</p>
              </div>
              <div className="min-w-[140px] rounded-[1.3rem] border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone">
                  Story Archiv
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {storedStories.length}
                </p>
                <p className="mt-1 text-xs text-stone">gespeichert</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <OverviewCard client={client} />
        </section>

        <Panel className="overflow-hidden border-none bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(250,250,249,0.98))] p-5 shadow-[0_20px_60px_rgba(24,24,27,0.08)] md:p-6">
          <SectionHeading
            title="Share Links"
            description="Erstelle Links für Kunden und deaktiviere oder lösche sie bei Bedarf. Die URL schickst du per Mail."
          />
          {clientId ? (
            <ShareLinksManager
              initialLinks={shareLinks}
              clientId={clientId}
              baseUrl={baseUrl}
            />
          ) : (
            <p className="mt-4 text-sm text-stone">
              Kein Client in der Datenbank gefunden. Führe zuerst einen Sync durch.
            </p>
          )}
        </Panel>

        <Panel className="overflow-hidden border-none bg-[linear-gradient(180deg,_rgba(248,248,247,0.96),_rgba(255,255,255,1))] p-5 shadow-[0_20px_60px_rgba(24,24,27,0.08)] md:p-6">
          <SectionHeading
            title="Story-Archiv"
            description="Gespeicherte Stories mit Insights-Download. Neue Stories werden automatisch bei jedem Sync erfasst."
          />
          <StoryArchivePanel initialStories={storedStories} />
        </Panel>

        <Panel className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(24,24,27,0.96),_rgba(53,63,45,0.94))] p-5 text-white shadow-[0_20px_60px_rgba(24,24,27,0.18)] md:p-6">
          <SectionHeading
            title="Import Architektur"
            description="Der Import ist für manuelle und geplante Server Syncs vorbereitet."
          />
          <div className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
              Letzter Sync wird immer sichtbar angezeigt.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
              Plattformdaten können zeitverzögert nachlaufen.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
              Die Route <code className="text-xs">/api/sync</code> ist für Cron Jobs vorbereitet.
            </div>
          </div>
        </Panel>
      </DashboardShell>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Live Daten konnten nicht geladen werden";

    return (
      <DashboardShell>
        <LiveDataErrorPanel
          title="Dashboard konnte nicht geladen werden"
          message={message}
        />
      </DashboardShell>
    );
  }
}
