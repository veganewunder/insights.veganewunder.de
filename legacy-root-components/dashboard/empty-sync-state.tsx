import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";

export function EmptySyncState() {
  return (
    <Panel className="p-6">
      <SectionHeading
        eyebrow="Sync"
        title="Naechster Ausbauschritt"
        description="Die Service-Schichten fuer OAuth, Token-Verwaltung und geplante Syncs sind vorbereitet."
      />

      <div className="mt-6 rounded-3xl border border-dashed border-line bg-white/60 p-5">
        <p className="text-sm leading-6 text-stone">
          In Phase 2 wird hier der echte manueller Import ausgelost und spaeter ueber
          Vercel Cron oder Supabase Scheduled Jobs automatisiert.
        </p>
        <Button className="mt-5">
          <RefreshCw className="size-4" />
          Sync vorbereiten
        </Button>
      </div>
    </Panel>
  );
}
