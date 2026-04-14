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
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openVisibilityId, setOpenVisibilityId] = useState<string | null>(null);
  const [newLinkName, setNewLinkName] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>(
    Object.fromEntries(
      initialLinks.map((link) => [link.id, link.link_name_nullable ?? ""]),
    ),
  );
  const [draftRecipientNames, setDraftRecipientNames] = useState<Record<string, string>>(
    Object.fromEntries(
      initialLinks.map((link) => [link.id, link.recipient_name_nullable ?? ""]),
    ),
  );
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
          linkName: newLinkName.trim() || null,
          recipientName: newRecipientName.trim() || null,
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
      setDraftNames((prev) => ({
        ...prev,
        [link.id]: link.link_name_nullable ?? "",
      }));
      setDraftRecipientNames((prev) => ({
        ...prev,
        [link.id]: link.recipient_name_nullable ?? "",
      }));
      setDraftVisibility((prev) => ({
        ...prev,
        [link.id]: link.visible_sections_json,
      }));
      setOpenVisibilityId(link.id);
      setNewLinkName("");
      setNewRecipientName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveName(link: ShareLinkRow) {
    setPendingId(link.id);
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkName: draftNames[link.id] ?? "",
        }),
      });
      const payload = await res.json() as ShareLinkRow | { message?: string };
      if (!res.ok) {
        setError((payload as { message?: string }).message ?? "Bezeichnung konnte nicht gespeichert werden");
        return;
      }
      const updated = payload as ShareLinkRow;
      setLinks((prev) => prev.map((entry) => (entry.id === link.id ? updated : entry)));
      setDraftNames((prev) => ({
        ...prev,
        [link.id]: updated.link_name_nullable ?? "",
      }));
      setEditingNameId(null);
    } finally {
      setPendingId(null);
    }
  }

  async function handleSaveRecipientName(link: ShareLinkRow) {
    setPendingId(link.id);
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: draftRecipientNames[link.id] ?? "",
        }),
      });
      const payload = await res.json() as ShareLinkRow | { message?: string };
      if (!res.ok) {
        setError((payload as { message?: string }).message ?? "Empfängername konnte nicht gespeichert werden");
        return;
      }
      const updated = payload as ShareLinkRow;
      setLinks((prev) => prev.map((entry) => (entry.id === link.id ? updated : entry)));
      setDraftRecipientNames((prev) => ({
        ...prev,
        [link.id]: updated.recipient_name_nullable ?? "",
      }));
      setEditingRecipientId(null);
    } finally {
      setPendingId(null);
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
    <div className="mt-5 space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-danger shadow-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(244,244,245,0.82)_55%,_rgba(233,237,226,0.9)_100%)] p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)] xl:grid-cols-[1fr_1fr_auto] xl:items-end">
        <div className="w-full">
          <label htmlFor="new-share-link-name" className="text-sm font-semibold text-ink">
            Firma
          </label>
          <p className="mt-1 text-xs leading-5 text-stone">
            Zum Beispiel: Kaufland, Edeka oder REWE.
          </p>
          <input
            id="new-share-link-name"
            type="text"
            value={newLinkName}
            onChange={(event) => setNewLinkName(event.target.value)}
            placeholder="Firma eintragen"
            className="mt-3 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone/70 focus:border-ink"
          />
        </div>
        <div className="w-full">
          <label htmlFor="new-share-link-recipient" className="text-sm font-semibold text-ink">
            Ansprechpartner
          </label>
          <p className="mt-1 text-xs leading-5 text-stone">
            Dieser Name wird direkt im individuellen Link als persönliche Begrüßung angezeigt.
          </p>
          <input
            id="new-share-link-recipient"
            type="text"
            value={newRecipientName}
            onChange={(event) => setNewRecipientName(event.target.value)}
            placeholder="Name des Empfängers"
            className="mt-3 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone/70 focus:border-ink"
          />
        </div>
        <div className="flex flex-col gap-3 xl:items-end">
          <p className="text-sm text-stone">
            {links.length === 0 ? "Noch keine Links erstellt." : `${links.length} Link${links.length !== 1 ? "s" : ""}`}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:translate-y-[-1px] disabled:opacity-60"
          >
            <Plus className="size-4" />
            {creating ? "Sync und Link werden erstellt…" : "Neuen Link erstellen"}
          </button>
        </div>
      </div>

      {links.map((link) => {
        const url = `${baseUrl}/share/${link.token}`;
        const isLoading = pendingId === link.id;
        const isConfirming = confirmDeleteId === link.id;
        const selectedVisibility = draftVisibility[link.id] ?? [];

        return (
          <div
            key={link.id}
            className={`rounded-[1.7rem] border p-5 shadow-[0_14px_40px_rgba(24,24,27,0.06)] transition-colors ${
              link.is_active
                ? "border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(246,244,239,0.92))]"
                : "border-line bg-zinc-50 opacity-70"
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
                <div className="rounded-[1.2rem] border border-white/80 bg-white/75 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
                        Firma
                      </p>
                      {editingNameId === link.id ? (
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={draftNames[link.id] ?? ""}
                            onChange={(event) =>
                              setDraftNames((prev) => ({ ...prev, [link.id]: event.target.value }))
                            }
                            placeholder="Firma eintragen"
                            className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-ink"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveName(link)}
                            disabled={isLoading}
                            className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/90 px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-50"
                          >
                            Speichern
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftNames((prev) => ({
                                ...prev,
                                [link.id]: link.link_name_nullable ?? "",
                              }));
                              setEditingNameId(null);
                            }}
                            className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/70 px-3 py-2.5 text-xs font-semibold text-stone transition hover:text-ink"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 truncate text-base font-semibold text-ink">
                          {link.link_name_nullable ?? "Keine Firma hinterlegt"}
                        </p>
                      )}
                    </div>

                    {editingNameId !== link.id ? (
                      <button
                        type="button"
                        onClick={() => setEditingNameId(link.id)}
                        className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                      >
                        Bearbeiten
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-white/80 bg-white/75 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
                        Ansprechpartner
                      </p>
                      {editingRecipientId === link.id ? (
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={draftRecipientNames[link.id] ?? ""}
                            onChange={(event) =>
                              setDraftRecipientNames((prev) => ({ ...prev, [link.id]: event.target.value }))
                            }
                            placeholder="Ansprechpartner eintragen"
                            className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-ink"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRecipientName(link)}
                            disabled={isLoading}
                            className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/90 px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-50"
                          >
                            Speichern
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftRecipientNames((prev) => ({
                                ...prev,
                                [link.id]: link.recipient_name_nullable ?? "",
                              }));
                              setEditingRecipientId(null);
                            }}
                            className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/70 px-3 py-2.5 text-xs font-semibold text-stone transition hover:text-ink"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 truncate text-base font-semibold text-ink">
                          {link.recipient_name_nullable ?? "Kein Ansprechpartner hinterlegt"}
                        </p>
                      )}
                    </div>

                    {editingRecipientId !== link.id ? (
                      <button
                        type="button"
                        onClick={() => setEditingRecipientId(link.id)}
                        className="inline-flex shrink-0 items-center rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                      >
                        Bearbeiten
                      </button>
                    ) : null}
                  </div>
                </div>
                {draftRecipientNames[link.id]?.trim() ? (
                  <p className="text-xs leading-5 text-stone">
                    Vorschau: Hey, {draftRecipientNames[link.id].trim()}, hier findest du unsere aktuellen Insights. Wir freuen uns auf eine mögliche Zusammenarbeit.
                  </p>
                ) : null}
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
                  className="flex items-center gap-1.5 rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs font-medium text-stone transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
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
                    className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-danger hover:bg-red-100 disabled:opacity-50"
                  >
                    Wirklich löschen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-2xl border border-line bg-white/80 px-3 py-2 text-xs text-stone hover:text-ink"
                  >
                    Abbrechen
                  </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(link.id)}
                    title="Löschen"
                    className="flex items-center rounded-2xl border border-line bg-white/80 p-2 text-stone transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
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
                    className="inline-flex min-w-[240px] items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-left text-sm text-ink transition-colors hover:border-ink"
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
                    className="rounded-2xl bg-ink px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-black/10 transition-opacity disabled:opacity-50"
                  >
                    Rechte speichern
                  </button>
                </div>
              </div>

              {openVisibilityId === link.id ? (
                <div className="mt-4 rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(250,250,249,0.95),_rgba(255,255,255,0.9))] p-3 shadow-panel">
                  <div className="grid gap-2 md:grid-cols-2">
                    {SHARE_VISIBILITY_OPTIONS.map((option) => {
                      const checked = selectedVisibility.includes(option.key);

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => toggleVisibility(link.id, option.key)}
                          className={`flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                            checked ? "border-ink bg-white shadow-sm" : "border-line bg-white/70"
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
        <div className="rounded-[1.6rem] border border-dashed border-line bg-white/70 p-8 text-center text-sm text-stone">
          Erstelle deinen ersten Link und schicke ihn per Mail an den Kunden.
        </div>
      )}
    </div>
  );
}
