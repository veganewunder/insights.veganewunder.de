import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full rounded-[2rem] border border-line bg-panel p-10 shadow-panel">
        <p className="text-xs uppercase tracking-[0.28em] text-stone">Nicht gefunden</p>
        <h1
          className="mt-4 text-4xl leading-none text-ink md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Diese Seite existiert nicht
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone md:text-base">
          Die angeforderte Seite konnte nicht gefunden werden. Gehe zur Uebersicht
          zurueck und oeffne den gewuenschten Bereich erneut.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Zum Dashboard
        </Link>
      </div>
    </main>
  );
}
