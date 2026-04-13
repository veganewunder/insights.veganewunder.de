import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";

export function LiveDataErrorPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Panel className="p-6">
      <SectionHeading
        eyebrow="Live Daten"
        title={title}
        description="Die aktive Meta Verbindung hat geantwortet, aber der aktuelle Request konnte nicht verarbeitet werden."
      />
      <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5 text-sm leading-6 text-stone">
        {message}
      </div>
    </Panel>
  );
}
