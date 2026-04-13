"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await res.json()) as { message?: string };

      if (!res.ok) {
        setError(payload.message ?? "Login fehlgeschlagen");
        return;
      }

      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">E Mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ink"
            autoComplete="email"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-ink"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full justify-center" disabled={pending}>
        <LockKeyhole className="size-4" />
        {pending ? "Prueft Zugang" : "Einloggen"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
