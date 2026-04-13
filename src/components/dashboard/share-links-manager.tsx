"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, Plus, Trash2, EyeOff, Eye, ChevronDown } from "lucide-react";
import type { ShareLinkRow } from "@/lib/data/share-links";
import { SHARE_VISIBILITY_OPTIONS } from "@/lib/share-visibility";
import { ShareVisibilityKey } from "@/types/insights";

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
  const [error, setError] = useState<string | null>(null);
  const [openVisibilityId, setOpenVisibilityId] = useState<string | null>(null);
  const [draftVisibility, setDraftVisibility] = useState<Record<string, ShareVisibilityKey[]>>(
    Object.fromEntries(initialLinks.map((link) => [link.id, link.visible_sections_json])),
  );

  function getVisibilitySummary(selectedVisibility: ShareVisibilityKey[]) {
    if (selectedVisibility.length === 0) {
      return "Keine Auswahl";
    }

    if (selectedVisibility.length <= 2) {
      return SHARE_VISIBILITY_OPTIONS
        .filter((option) => selectedVisibility.includes(option.key))
        .map((option) => option.label)
        .join(", ");
    }

    return `${selectedVisibility.length} Bereiche ausgewählt`;
  }

  function toggleVisibility(linkId: string, key: ShareVisibilityKey) {
    setDraftVisibility((prev) => {
      const current = prev[linkId] ?? [];
      const next = current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key];

      return {
        ...prev,
        [linkId]: next,
      };
    });
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          visibleSections: SHARE_VISIBILITY_OPTIONS.map((option) => option.key),
        }),
      });
      const payload = await res.json() as ShareLinkRow | { message?: string };
      if (!res.ok) {
        setError((payload as { message?: string }).message ?? "Share Link konnte nicht erstellt werden");
        return;
      }
      const link = payload as ShareLinkRow;
      setLinks((prev) => [link, ...prev]);
      setDraftVisibility((prev) => ({
        ...prev,
        [link.id]: link.visible_sections_json,
      }));
      setOpenVisibilityId(link.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(link: ShareLinkRow) {
    setPendingId(link.id);
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !link.is_active }),
      });
      if (!res.ok) {
        setError("Status konnte nicht aktualisiert werden");
        return;
      }
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l)),
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleSaveVisibility(link: ShareLinkRow) {
    setPendingId(link.id);
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibleSections: draftVisibility[link.id] ?? [],
        }),
      });
      const payload = await res.json() as ShareLinkRow | { message?: string };
      if (!res.ok) {
        setError((payload as { message?: string }).message ?? "Rechte konnten nicht gespeichert werden");
        return;
      }
      const updated = payload as ShareLinkRow;
      setLinks((prev) => prev.map((entry) => (entry.id === link.id ? updated : entry)));
      setDraftVisibility((prev) => ({
        ...prev,
        [link.id]: updated.visible_sections_json,
      }));
      setOpenVisibilityId(null);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Link konnte nicht geloescht werden");
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

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
        const selectedVisibility = draftVisibility[link.id] ?? [];

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
                <Link
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-mono text-sm text-ink underline underline-offset-4 hover:text-stone"
                >
                  {url}
                </Link>
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

            <div className="mt-4 rounded-xl border border-line bg-white/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Sichtbare Insights</p>
                  <p className="mt-1 text-xs leading-5 text-stone">
                    Pro Link legst du fest, welche Bereiche der Kunde sehen darf.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenVisibilityId((current) => (current === link.id ? null : link.id))
                    }
                    className="inline-flex min-w-[240px] items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-left text-sm text-ink transition-colors hover:border-ink"
                  >
                    <span className="truncate">{getVisibilitySummary(selectedVisibility)}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-stone transition-transform ${
                        openVisibilityId === link.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveVisibility(link)}
                    disabled={isLoading || selectedVisibility.length === 0}
                    className="rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                  >
                    Rechte speichern
                  </button>
                </div>
              </div>

              {openVisibilityId === link.id ? (
                <div className="mt-4 rounded-xl border border-line bg-panel p-3 shadow-panel">
                  <div className="grid gap-2 md:grid-cols-2">
                    {SHARE_VISIBILITY_OPTIONS.map((option) => {
                      const checked = selectedVisibility.includes(option.key);

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => toggleVisibility(link.id, option.key)}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                            checked ? "border-ink bg-white" : "border-line bg-white/70"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                              checked
                                ? "border-ink bg-ink text-white"
                                : "border-line bg-white text-transparent"
                            }`}
                          >
                            <Check className="size-3" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">{option.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-stone">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
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
