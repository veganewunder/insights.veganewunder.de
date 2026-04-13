import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Panel } from "@/components/ui/panel";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export default async function LoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/dashboard");
  }

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
            Login fuer den internen Admin Bereich. Nur nach erfolgreicher Anmeldung
            sind Dashboard, Kundenverwaltung und Share Links verfuegbar.
          </p>
        </div>

        <AdminLoginForm />

        <p className="text-xs leading-5 text-stone">
          Zugang nur fuer das Veganewunder Team.
        </p>
      </Panel>
    </main>
  );
}
