import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SHARE_VISIBILITY, sanitizeShareVisibility } from "@/lib/share-visibility";
import { ShareVisibilityKey } from "@/types/insights";

export type ShareLinkRow = {
  id: string;
  client_id: string;
  token: string;
  link_name_nullable: string | null;
  visible_sections_json: ShareVisibilityKey[];
  is_active: boolean;
  expires_at_nullable: string | null;
  created_at: string;
};

type RawShareLinkRow = {
  id: string;
  client_id: string;
  token: string;
  link_name_nullable?: string | null;
  visible_sections_json?: unknown;
  is_active: boolean;
  expires_at_nullable: string | null;
  created_at: string;
};

function isMissingShareLinksColumn(message: string, column: string) {
  return message.includes(column);
}

function normalizeLinkName(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function selectColumns(includeLinkName = true, includeVisibility = true) {
  const parts = ["id", "client_id", "token"];

  if (includeLinkName) {
    parts.push("link_name_nullable");
  }

  if (includeVisibility) {
    parts.push("visible_sections_json");
  }

  parts.push("is_active", "expires_at_nullable", "created_at");
  return parts.join(", ");
}

function mapShareLinkRow(
  link: RawShareLinkRow,
): ShareLinkRow {
  return {
    id: link.id,
    client_id: link.client_id,
    token: link.token,
    link_name_nullable: normalizeLinkName(link.link_name_nullable),
    visible_sections_json: sanitizeShareVisibility(link.visible_sections_json),
    is_active: link.is_active,
    expires_at_nullable: link.expires_at_nullable,
    created_at: link.created_at,
  };
}

export async function getShareLinksForClient(clientId: string): Promise<ShareLinkRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select(selectColumns())
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    if (
      !isMissingShareLinksColumn(error.message, "visible_sections_json") &&
      !isMissingShareLinksColumn(error.message, "link_name_nullable")
    ) {
      throw new Error(error.message);
    }

    const includeVisibility = !isMissingShareLinksColumn(error.message, "visible_sections_json");
    const includeLinkName = !isMissingShareLinksColumn(error.message, "link_name_nullable");
    const fallback = await supabase
      .from("share_links")
      .select(selectColumns(includeLinkName, includeVisibility))
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message);

    return ((fallback.data ?? []) as unknown as RawShareLinkRow[]).map((link) =>
      mapShareLinkRow(link),
    );
  }
  return ((data ?? []) as unknown as RawShareLinkRow[]).map((link) => mapShareLinkRow(link));
}

export async function createShareLink(
  clientId: string,
  linkName: string | null,
  visibleSections: ShareVisibilityKey[] = DEFAULT_SHARE_VISIBILITY,
): Promise<ShareLinkRow> {
  const supabase = createSupabaseAdminClient();
  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      client_id: clientId,
      token,
      link_name_nullable: normalizeLinkName(linkName),
      visible_sections_json: visibleSections,
      is_active: true,
      password_hash_nullable: null,
      expires_at_nullable: null,
    })
    .select(selectColumns())
    .single();

  if (error) {
    if (
      !isMissingShareLinksColumn(error.message, "visible_sections_json") &&
      !isMissingShareLinksColumn(error.message, "link_name_nullable")
    ) {
      throw new Error(error.message);
    }

    const includeVisibility = !isMissingShareLinksColumn(error.message, "visible_sections_json");
    const includeLinkName = !isMissingShareLinksColumn(error.message, "link_name_nullable");
    const insertPayload: {
      client_id: string;
      token: string;
      link_name_nullable?: string | null;
      visible_sections_json?: ShareVisibilityKey[];
      is_active: boolean;
      password_hash_nullable: null;
      expires_at_nullable: null;
    } = {
      client_id: clientId,
      token,
      is_active: true,
      password_hash_nullable: null,
      expires_at_nullable: null,
    };

    if (includeLinkName) {
      insertPayload.link_name_nullable = normalizeLinkName(linkName);
    }

    if (includeVisibility) {
      insertPayload.visible_sections_json = visibleSections;
    }

    const fallback = await supabase
      .from("share_links")
      .insert(insertPayload)
      .select(selectColumns(includeLinkName, includeVisibility))
      .single();

    if (fallback.error) throw new Error(fallback.error.message);

    return mapShareLinkRow(fallback.data as unknown as RawShareLinkRow);
  }
  return mapShareLinkRow(data as unknown as RawShareLinkRow);
}

export async function setShareLinkActive(id: string, isActive: boolean): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("share_links")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateShareLinkVisibility(
  id: string,
  visibleSections: ShareVisibilityKey[],
): Promise<ShareLinkRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .update({ visible_sections_json: visibleSections })
    .eq("id", id)
    .select(selectColumns())
    .single();

  if (error) {
    if (isMissingShareLinksColumn(error.message, "visible_sections_json")) {
      throw new Error("Bitte zuerst das Share Link Schema in Supabase aktualisieren");
    }

    throw new Error(error.message);
  }

  return mapShareLinkRow(data as unknown as RawShareLinkRow);
}

export async function updateShareLinkName(
  id: string,
  linkName: string | null,
): Promise<ShareLinkRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .update({ link_name_nullable: normalizeLinkName(linkName) })
    .eq("id", id)
    .select(selectColumns())
    .single();

  if (error) {
    if (isMissingShareLinksColumn(error.message, "link_name_nullable")) {
      throw new Error("Bitte zuerst das Share Link Schema in Supabase aktualisieren");
    }

    throw new Error(error.message);
  }

  return mapShareLinkRow(data as unknown as RawShareLinkRow);
}

export async function getShareLinkByToken(token: string): Promise<ShareLinkRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select(selectColumns())
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (
      !isMissingShareLinksColumn(error.message, "visible_sections_json") &&
      !isMissingShareLinksColumn(error.message, "link_name_nullable")
    ) {
      throw new Error(error.message);
    }

    const includeVisibility = !isMissingShareLinksColumn(error.message, "visible_sections_json");
    const includeLinkName = !isMissingShareLinksColumn(error.message, "link_name_nullable");
    const fallback = await supabase
      .from("share_links")
      .select(selectColumns(includeLinkName, includeVisibility))
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (fallback.error) throw new Error(fallback.error.message);
    if (!fallback.data) return null;

    return mapShareLinkRow(fallback.data as unknown as RawShareLinkRow);
  }
  if (!data) return null;

  return mapShareLinkRow(data as unknown as RawShareLinkRow);
}

export async function deleteShareLink(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getFirstClientId(): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
}
