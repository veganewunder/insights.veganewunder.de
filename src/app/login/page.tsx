import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="grid-pattern absolute inset-0 -z-10 opacity-60" />
      <Panel className="w-full max-w-md space-y-8 p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-stone">Interner Zugang</p>
          <h1
            className="text-4xl leading-none text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Veganewunder Insights
          </h1>
          <p className="text-sm leading-6 text-stone">
            Login fuer den internen Bereich. Supabase Auth ist als produktionsreifer
            Anschluss vorbereitet.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">E Mail</span>
            <input
              type="email"
              defaultValue="admin@veganewunder.de"
              className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ink"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Passwort</span>
            <input
              type="password"
              defaultValue="demo-passwort"
              className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ink"
            />
          </label>
        </div>

        <Button asChild className="w-full justify-center">
          <Link href="/dashboard">
            <LockKeyhole className="size-4" />
            Zum Dashboard
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <p className="text-xs leading-5 text-stone">
          OAuth und Session Handling werden spaeter mit Supabase Auth verbunden.
        </p>
      </Panel>
    </main>
  );
}
