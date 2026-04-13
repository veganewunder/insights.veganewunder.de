import Link from "next/link";
import { BarChart3, Share2 } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="rounded-[2rem] border border-line bg-panel p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-stone">
              Veganewunder Insights
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="text-sm font-semibold text-ink">
                Dashboard
              </Link>
              <span className="text-stone">/</span>
              <Link href="/dashboard/admin" className="text-sm text-stone">
                Admin
              </Link>
              <span className="text-stone">/</span>
              <Link href="/login" className="text-sm text-stone">
                Login
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-stone">
              <BarChart3 className="size-4" />
              Datenbankbasiertes Dashboard
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-stone">
              <Share2 className="size-4" />
              Reduzierte Share-Seiten
            </div>
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
