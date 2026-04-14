import { Panel } from "@/components/ui/panel";
import { ReportStatItem } from "@/lib/insights/reporting";

export function ReportStatGrid({
  items,
  columns = "four",
}: {
  items: ReportStatItem[];
  columns?: "three" | "four";
}) {
  if (items.length === 0) {
    return null;
  }

  const gridClassName =
    columns === "three"
      ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

  return (
    <section className={gridClassName}>
      {items.map((item) => (
        <Panel key={item.key} className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">
            {item.label}
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-ink">{item.value}</p>
          {item.helper ? <p className="mt-2 text-sm text-stone">{item.helper}</p> : null}
        </Panel>
      ))}
    </section>
  );
}
