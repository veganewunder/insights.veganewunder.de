"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  AdminClientRecord,
  ClientAccessAssignment,
  ClientAccessRole,
  InsightPermissionKey,
  InternalProfile,
} from "@/types/insights";
import { cn } from "@/lib/utils";
import { insightPermissionOptions } from "@/lib/data/mock-insights";

const roles: ClientAccessRole[] = ["admin", "manager", "viewer"];

type AdminClientManagerProps = {
  initialClients: AdminClientRecord[];
  profiles: InternalProfile[];
};

type DraftClientState = {
  name: string;
  slug: string;
  notes: string;
  linkedAccounts: string;
  visibleInsightKeys: InsightPermissionKey[];
};

const emptyDraft: DraftClientState = {
  name: "",
  slug: "",
  notes: "",
  linkedAccounts: "",
  visibleInsightKeys: ["reach", "impressions", "storyViews", "linkClicks"],
};

export function AdminClientManager({
  initialClients,
  profiles,
}: AdminClientManagerProps) {
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? "");
  const [draft, setDraft] = useState<DraftClientState>(emptyDraft);
  const [saveMessage, setSaveMessage] = useState("Noch nicht gespeichert");

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId],
  );

  function createClient() {
    if (!draft.name.trim() || !draft.slug.trim()) {
      setSaveMessage("Name und Slug werden fuer einen neuen Kunden benoetigt");
      return;
    }

    const nextClient: AdminClientRecord = {
      id: `admin_client_${Date.now()}`,
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      notes: draft.notes.trim(),
      linkedAccounts: draft.linkedAccounts
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      assignments: [],
      visibleInsightKeys: draft.visibleInsightKeys,
    };

    setClients((current) => [nextClient, ...current]);
    setSelectedClientId(nextClient.id);
    setDraft(emptyDraft);
    setSaveMessage(`Kunde ${nextClient.name} lokal angelegt`);
  }

  function toggleInsightPermission(permissionKey: InsightPermissionKey) {
    if (!selectedClient) {
      return;
    }

    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        const hasPermission = client.visibleInsightKeys.includes(permissionKey);

        return {
          ...client,
          visibleInsightKeys: hasPermission
            ? client.visibleInsightKeys.filter((key) => key !== permissionKey)
            : [...client.visibleInsightKeys, permissionKey],
        };
      }),
    );

    setSaveMessage(`Insight-Freigaben fuer ${selectedClient.name} lokal aktualisiert`);
  }

  function toggleDraftPermission(permissionKey: InsightPermissionKey) {
    setDraft((current) => {
      const hasPermission = current.visibleInsightKeys.includes(permissionKey);

      return {
        ...current,
        visibleInsightKeys: hasPermission
          ? current.visibleInsightKeys.filter((key) => key !== permissionKey)
          : [...current.visibleInsightKeys, permissionKey],
      };
    });
  }

  function toggleRole(profileId: string, role: ClientAccessRole) {
    if (!selectedClient) {
      return;
    }

    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        const existing = client.assignments.find(
          (assignment) => assignment.profileId === profileId,
        );

        let assignments: ClientAccessAssignment[];

        if (existing?.role === role) {
          assignments = client.assignments.filter(
            (assignment) => assignment.profileId !== profileId,
          );
        } else if (existing) {
          assignments = client.assignments.map((assignment) =>
            assignment.profileId === profileId ? { ...assignment, role } : assignment,
          );
        } else {
          assignments = [...client.assignments, { profileId, role }];
        }

        return { ...client, assignments };
      }),
    );

    setSaveMessage(`Rechte fuer ${selectedClient.name} lokal aktualisiert`);
  }

  function revokeRole(profileId: string) {
    if (!selectedClient) {
      return;
    }

    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        return {
          ...client,
          assignments: client.assignments.filter(
            (assignment) => assignment.profileId !== profileId,
          ),
        };
      }),
    );

    setSaveMessage(`Zugriff fuer ${selectedClient.name} lokal entzogen`);
  }

  function revokeInsightPermission(permissionKey: InsightPermissionKey) {
    if (!selectedClient) {
      return;
    }

    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        return {
          ...client,
          visibleInsightKeys: client.visibleInsightKeys.filter(
            (key) => key !== permissionKey,
          ),
        };
      }),
    );

    setSaveMessage(`Insight-Freigabe fuer ${selectedClient.name} lokal entzogen`);
  }

  async function deleteSelectedClient() {
    if (!selectedClient) {
      return;
    }

    const clientToDelete = selectedClient;

    try {
      const response = await fetch("/api/admin/clients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: clientToDelete.id,
          slug: clientToDelete.slug,
        }),
      });

      if (!response.ok) {
        throw new Error("delete_failed");
      }

      const remainingClients = clients.filter(
        (client) => client.id !== clientToDelete.id,
      );

      setClients(remainingClients);
      setSelectedClientId(remainingClients[0]?.id ?? "");

      const result = (await response.json()) as { message?: string };
      setSaveMessage(
        result.message ?? `Kunde ${clientToDelete.name} wurde lokal entfernt`,
      );
    } catch {
      setSaveMessage(
        `Kunde ${clientToDelete.name} konnte noch nicht geloescht werden`,
      );
    }
  }

  async function saveAssignments() {
    if (!selectedClient) {
      return;
    }

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client: selectedClient,
        }),
      });

      if (!response.ok) {
        throw new Error("save_failed");
      }

      const result = (await response.json()) as { message?: string };
      setSaveMessage(
        result.message ?? `Aenderungen fuer ${selectedClient.name} vorbereitet`,
      );
    } catch {
      setSaveMessage(
        `Aenderungen fuer ${selectedClient.name} konnten noch nicht gespeichert werden`,
      );
    }
  }

  return (
    <div className="grid gap-6">
      <Panel className="p-6">
        <SectionHeading
          eyebrow="Neuer Kunde"
          title="Firma anlegen"
          description="Neue Kunden koennen direkt im Admin Panel vorbereitet werden."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Firmenname</span>
            <input
              className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-ink"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Kaufland"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Slug</span>
            <input
              className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-ink"
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="kaufland"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-ink">Verknuepfte Konten</span>
            <input
              className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-ink"
              value={draft.linkedAccounts}
              onChange={(event) =>
                setDraft((current) => ({ ...current, linkedAccounts: event.target.value }))
              }
              placeholder="Instagram Hauptprofil, Facebook Brand Page"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-ink">Notizen</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-ink"
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Interne Hinweise zum Kunden oder zum Reporting."
            />
          </label>
          <div className="space-y-3 md:col-span-2">
            <span className="text-sm font-medium text-ink">Freigegebene Insights</span>
            <div className="grid gap-3 md:grid-cols-2">
              {insightPermissionOptions.map((permission) => {
                const checked = draft.visibleInsightKeys.includes(permission.key);

                return (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-white/70 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDraftPermission(permission.key)}
                      className="mt-1 size-4 rounded border-line text-ink focus:ring-ink"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-ink">
                        {permission.label}
                      </span>
                      <span className="block text-xs leading-5 text-stone">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-stone">{saveMessage}</p>
          <Button type="button" onClick={createClient}>
            <Plus className="size-4" />
            Kunde anlegen
          </Button>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeading
          eyebrow="Zugriffsrechte"
          title="Rollen pro Kunde vergeben"
          description="Ein Klick setzt oder aendert die Rolle. Ein zweiter Klick auf dieselbe Rolle entfernt den Zugriff wieder."
        />

        <div className="mt-6 flex flex-wrap gap-3">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => setSelectedClientId(client.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                selectedClient?.id === client.id
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white/70 text-stone",
              )}
            >
              {client.name}
            </button>
          ))}
        </div>

        {selectedClient ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-line bg-white/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone">
                    Ausgewaehlter Kunde
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-ink">
                    {selectedClient.name}
                  </h3>
                  <p className="mt-2 text-sm text-stone">Slug {selectedClient.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={deleteSelectedClient}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cbb8a3] bg-[#f5ede4] px-4 py-2 text-sm text-ink transition hover:opacity-90"
                >
                  <Trash2 className="size-4" />
                  Kunde loeschen
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone">{selectedClient.notes}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedClient.linkedAccounts.map((account) => (
                  <span
                    key={account}
                    className="rounded-full border border-line px-3 py-1 text-xs text-stone"
                  >
                    {account}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedClient.visibleInsightKeys.map((permissionKey) => {
                  const permission = insightPermissionOptions.find(
                    (entry) => entry.key === permissionKey,
                  );

                  return (
                    <span
                      key={permissionKey}
                      className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-stone"
                    >
                      {permission?.label ?? permissionKey}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {profiles.map((profile) => {
                const assignment = selectedClient.assignments.find(
                  (entry) => entry.profileId === profile.id,
                );

                return (
                  <div
                    key={profile.id}
                    className="rounded-3xl border border-line bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-ink">{profile.fullName}</p>
                        <p className="text-sm text-stone">{profile.email}</p>
                      </div>
                      <div className="rounded-full border border-line px-3 py-1 text-xs text-stone">
                        Standardrolle {profile.defaultRole}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {roles.map((role) => {
                        const active = assignment?.role === role;

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(profile.id, role)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                              active
                                ? "border-ink bg-ink text-white"
                                : "border-line bg-panel text-stone",
                            )}
                          >
                            {active ? <Check className="size-4" /> : null}
                            {role}
                          </button>
                        );
                      })}
                    </div>

                    {assignment ? (
                      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel px-4 py-3">
                        <p className="text-sm text-stone">
                          Aktiver Zugriff <span className="font-semibold text-ink">{assignment.role}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => revokeRole(profile.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm text-stone transition hover:border-ink hover:text-ink"
                        >
                          <X className="size-4" />
                          Zugriff entziehen
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {selectedClient ? (
          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-ink">Sichtbare Insight-Bereiche</p>
            <p className="mt-1 text-sm leading-6 text-stone">
              Nur diese Bereiche werden spaeter im Kunden-Dashboard und auf der
              Share-Seite gerendert.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {insightPermissionOptions.map((permission) => {
                const checked = selectedClient.visibleInsightKeys.includes(permission.key);

                return (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-panel p-4"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleInsightPermission(permission.key)}
                      className="mt-1 size-4 rounded border-line text-ink focus:ring-ink"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-ink">
                        {permission.label}
                      </span>
                      <span className="block text-xs leading-5 text-stone">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedClient.visibleInsightKeys.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedClient.visibleInsightKeys.map((permissionKey) => {
                  const permission = insightPermissionOptions.find(
                    (entry) => entry.key === permissionKey,
                  );

                  return (
                    <button
                      key={permissionKey}
                      type="button"
                      onClick={() => revokeInsightPermission(permissionKey)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm text-stone transition hover:border-ink hover:text-ink"
                    >
                      <X className="size-4" />
                      {permission?.label ?? permissionKey} entfernen
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={saveAssignments}>
            <Save className="size-4" />
            Rechte speichern
          </Button>
        </div>
      </Panel>
    </div>
  );
}
