import Link from "next/link";
import { ClientDashboardRecord } from "@/types/insights";
import { formatDateTime, formatPlatformsLabel } from "@/lib/insights/formatters";

export function OverviewCard({ client }: { client: ClientDashboardRecord }) {
  const metrics = client.metrics["7d"];

  return (
    <Link
      href={`/dashboard/client/${client.slug}`}
      className="group rounded-[2rem] border border-line bg-panel p-6 shadow-panel transition hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone">
            {formatPlatformsLabel(client.platforms)}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{client.name}</h2>
          <p className="mt-2 text-sm text-stone">{client.accountSummary}</p>
        </div>
        <div className="rounded-full border border-line px-3 py-1 text-xs text-stone">
          {client.shareToken}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
        {metrics.slice(0, 2).map((metric) => (
          <div key={metric.key} className="rounded-2xl bg-white/70 p-4">
            <p className="text-stone">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{metric.displayValue}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-stone">
        <span>Datenstand {formatDateTime(client.lastSyncedAt)}</span>
        <span className="font-medium text-ink transition group-hover:translate-x-1">
          Oeffnen
        </span>
      </div>
    </Link>
  );
}
