import Link from "next/link";
import { AdminActions } from "@/components/dashboard/admin-actions";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com/veganewunder"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-ink hover:text-zinc-700"
          >
            @veganewunder
          </a>
          <span className="text-stone">/</span>
          <Link href="/dashboard" className="text-sm text-stone hover:text-ink">Dashboard</Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminActions />
        </div>
      </header>

      {children}
    </main>
  );
}
