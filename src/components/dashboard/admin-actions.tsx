"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminActions() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync");
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={handleSync} disabled={syncing}>
        <RefreshCcw className="size-4" />
        {syncing ? "Sync laeuft" : "Sync"}
      </Button>
      <Button type="button" variant="secondary" onClick={handleLogout} disabled={loggingOut}>
        <LogOut className="size-4" />
        {loggingOut ? "Meldet ab" : "Logout"}
      </Button>
    </>
  );
}
