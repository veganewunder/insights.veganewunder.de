"use client";

import { useState } from "react";
import { Copy, Check, Plus, Trash2, EyeOff, Eye } from "lucide-react";
import type { ShareLinkRow } from "@/lib/data/share-links";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="URL kopieren"
      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-stone transition-colors hover:border-ink hover:text-ink"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

type Props = {
  initialLinks: ShareLinkRow[];
  clientId: string;
  baseUrl: string;
};

export function ShareLinksManager({ initialLinks, clientId, baseUrl }: Props) {
  const [links, setLinks] = useState<ShareLinkRow[]>(initialLinks);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const link = await res.json() as ShareLinkRow;
      setLinks((prev) => [link, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(link: ShareLinkRow) {
    setPendingId(link.id);
    try {
      await fetch(`/api/share-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !link.is_active }),
      });
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l)),
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      await fetch(`/api/share-links/${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone">
          {links.length === 0 ? "Noch keine Links erstellt." : `${links.length} Link${links.length !== 1 ? "s" : ""}`}
        </p>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        >
          <Plus className="size-4" />
          {creating ? "Wird erstellt…" : "Neuen Link erstellen"}
        </button>
      </div>

      {links.map((link) => {
        const url = `${baseUrl}/share/${link.token}`;
        const isLoading = pendingId === link.id;
        const isConfirming = confirmDeleteId === link.id;

        return (
          <div
            key={link.id}
            className={`rounded-xl border p-4 transition-colors ${
              link.is_active ? "border-line bg-panel" : "border-line bg-zinc-50 opacity-60"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      link.is_active
                        ? "bg-green-50 text-success"
                        : "bg-zinc-100 text-stone"
                    }`}
                  >
                    {link.is_active ? "Aktiv" : "Inaktiv"}
                  </span>
                  <span className="text-xs text-stone">{formatDate(link.created_at)}</span>
                </div>
                <p className="truncate font-mono text-sm text-ink">{url}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <CopyButton url={url} />

                <button
                  type="button"
                  onClick={() => handleToggle(link)}
                  disabled={isLoading}
                  title={link.is_active ? "Deaktivieren" : "Aktivieren"}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-stone transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
                >
                  {link.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {link.is_active ? "Deaktivieren" : "Aktivieren"}
                </button>

                {isConfirming ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      disabled={isLoading}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-100 disabled:opacity-50"
                    >
                      Wirklich löschen
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-stone hover:text-ink"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(link.id)}
                    title="Löschen"
                    className="flex items-center rounded-lg border border-line p-1.5 text-stone transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {links.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-stone">
          Erstelle deinen ersten Link und schicke ihn per Mail an den Kunden.
        </div>
      )}
    </div>
  );
}
