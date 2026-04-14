import Image from "next/image";
import Link from "next/link";
import { ClientDashboardRecord } from "@/types/insights";
import { formatDateTime } from "@/lib/insights/formatters";

export function OverviewCard({ client }: { client: ClientDashboardRecord }) {
  const metrics = client.metrics["30d"];

  return (
    <Link
      href={`/dashboard/client/${client.slug}`}
      className="group block overflow-hidden rounded-[2rem] border border-line bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(246,244,239,0.92)_50%,_rgba(229,234,223,0.96)_100%)] p-6 shadow-[0_24px_70px_rgba(24,24,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(24,24,27,0.12)]"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-white/70 bg-white shadow-[0_12px_30px_rgba(24,24,27,0.08)]">
            <Image
              src="/logo.png"
              alt="Vegane Wunder Logo"
              width={52}
              height={52}
              className="size-12 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone">
              Instagram Reporting
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{client.name}</h2>
            <p className="mt-2 text-sm text-stone">{client.accountSummary}</p>
            <p className="mt-3 text-sm text-stone">
              Die wichtigsten KPIs der letzten 30 Tage im schnellen Überblick.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 text-sm shadow-sm backdrop-blur">
          <p className="text-stone">Datenstand</p>
          <p className="mt-1 font-semibold text-ink">{formatDateTime(client.lastSyncedAt)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-[1.6rem] border border-white/70 bg-white/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-stone">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-ink">{metric.displayValue}</p>
            <p className="mt-2 text-sm text-stone">Letzte 30 Tage</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-stone">
        <span>Im Stil der Share-Ansicht zusammengefasst</span>
        <span className="font-medium text-ink transition group-hover:translate-x-1">
          Details öffnen
        </span>
      </div>
    </Link>
  );
}
