import Link from "next/link";
import { ClientDashboardRecord, RangeKey } from "@/types/insights";

type ClientHeaderProps = {
  client: ClientDashboardRecord;
  activeRange: RangeKey;
};

function getRangeLabel(range: RangeKey) {
  if (range === "30d") return "30 Tage";
  return "7 Tage";
}

export function ClientHeader({ client, activeRange }: ClientHeaderProps) {
  return (
    <section className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-widest text-stone">Analysezeitraum</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{client.name}</h1>
          <p className="mt-0.5 text-sm text-stone">Zeitraum: {getRangeLabel(activeRange)}</p>
        </div>

        <div className="inline-flex rounded-xl border border-line bg-panel p-1 shadow-panel">
          {[
            { key: "7d", label: "7 Tage" },
            { key: "30d", label: "30 Tage" },
          ].map((option) => (
            <Link
              key={option.key}
              href={`?range=${option.key}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeRange === option.key
                  ? "bg-ink text-white"
                  : "text-stone hover:text-ink"
              }`}
            >
              {option.key === activeRange ? option.label : option.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
