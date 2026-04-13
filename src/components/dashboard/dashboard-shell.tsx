import Link from "next/link";
import { BarChart3, RefreshCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Veganewunder Insights</span>
          <span className="text-stone">/</span>
          <Link href="/dashboard" className="text-sm text-stone hover:text-ink">Dashboard</Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-stone shadow-panel">
            <BarChart3 className="size-3.5" />
            Gecachte Plattformdaten
          </div>
          <Button type="button">
            <RefreshCcw className="size-4" />
            Sync
          </Button>
          <Button asChild variant="secondary">
            <Link href="/share/kf93share">
              <Send className="size-4" />
              Teilen
            </Link>
          </Button>
        </div>
      </header>

      {children}
    </main>
  );
}
