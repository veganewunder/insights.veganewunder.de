import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveDataErrorPanel } from "@/components/dashboard/live-data-error-panel";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { ShareLinksManager } from "@/components/dashboard/share-links-manager";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDashboardClient } from "@/lib/data/dashboard-store";
import { getShareLinksForClient, getFirstClientId } from "@/lib/data/share-links";
import { formatDateTime } from "@/lib/insights/formatters";

export default async function DashboardPage() {
  try {
    const client = await getDashboardClient();
    const clientId = await getFirstClientId();
    const shareLinks = clientId ? await getShareLinksForClient(clientId) : [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insights.veganewunder.de";

    return (
      <DashboardShell>
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Kunden & Share Links</h1>
          </div>
          <div className="rounded-xl border border-line bg-panel px-4 py-3 text-sm shadow-panel">
            <p className="text-stone">Letzter Sync</p>
            <p className="mt-0.5 font-semibold text-ink">{formatDateTime(client.lastSyncedAt)}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <OverviewCard client={client} />
        </section>

        <Panel className="p-5">
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

        <Panel className="p-5">
          <SectionHeading
            title="Import Architektur"
            description="Der Import ist für manuelle und geplante Server Syncs vorbereitet."
          />
          <div className="mt-4 space-y-2 text-sm text-stone">
            <div className="rounded-xl border border-line bg-zinc-50 px-4 py-3">
              Letzter Sync wird immer sichtbar angezeigt.
            </div>
            <div className="rounded-xl border border-line bg-zinc-50 px-4 py-3">
              Plattformdaten können zeitverzögert nachlaufen.
            </div>
            <div className="rounded-xl border border-line bg-zinc-50 px-4 py-3">
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
