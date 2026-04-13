import Link from "next/link";
import { ClientDashboardRecord } from "@/types/insights";
import { formatDateTime } from "@/lib/format/kpi";

type ClientHeaderProps = {
  client: ClientDashboardRecord;
  activeRange: "7d" | "30d";
};

export function ClientHeader({ client, activeRange }: ClientHeaderProps) {
  return (
    <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone">Kundenansicht intern</p>
          <h1
            className="text-4xl leading-none text-ink md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {client.name}
          </h1>
          <p className="text-sm leading-6 text-stone">
            Plattform {client.platform} / Konto {client.accountName}
          </p>
        </div>

        <div className="space-y-4">
          <div className="inline-flex rounded-full border border-line bg-white/70 p-1">
            {[
              { key: "7d", label: "7 Tage" },
              { key: "30d", label: "30 Tage" },
            ].map((option) => (
              <Link
                key={option.key}
                href={`?range=${option.key}`}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeRange === option.key ? "bg-ink text-white" : "text-stone"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <div className="text-right text-sm text-stone">
            Letzter Sync {formatDateTime(client.lastSyncedAt)}
          </div>
        </div>
      </div>
    </section>
  );
}
