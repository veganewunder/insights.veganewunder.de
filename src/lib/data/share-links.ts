import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SHARE_VISIBILITY, sanitizeShareVisibility } from "@/lib/share-visibility";
import { ShareVisibilityKey } from "@/types/insights";

export type ShareLinkRow = {
  id: string;
  client_id: string;
  token: string;
  visible_sections_json: ShareVisibilityKey[];
  is_active: boolean;
  expires_at_nullable: string | null;
  created_at: string;
};

function isMissingVisibilityColumn(message: string) {
  return message.includes("visible_sections_json");
}

export async function getShareLinksForClient(clientId: string): Promise<ShareLinkRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("id, client_id, token, visible_sections_json, is_active, expires_at_nullable, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingVisibilityColumn(error.message)) {
      throw new Error(error.message);
    }

    const fallback = await supabase
      .from("share_links")
      .select("id, client_id, token, is_active, expires_at_nullable, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message);

    return ((fallback.data ?? []) as Array<Omit<ShareLinkRow, "visible_sections_json">>).map((link) => ({
      ...link,
      visible_sections_json: [...DEFAULT_SHARE_VISIBILITY],
    }));
  }
  return ((data ?? []) as Array<ShareLinkRow & { visible_sections_json: unknown }>).map((link) => ({
    ...link,
    visible_sections_json: sanitizeShareVisibility(link.visible_sections_json),
  }));
}

export async function createShareLink(
  clientId: string,
  visibleSections: ShareVisibilityKey[] = DEFAULT_SHARE_VISIBILITY,
): Promise<ShareLinkRow> {
  const supabase = createSupabaseAdminClient();
  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      client_id: clientId,
      token,
      visible_sections_json: visibleSections,
      is_active: true,
      password_hash_nullable: null,
      expires_at_nullable: null,
    })
    .select("id, client_id, token, visible_sections_json, is_active, expires_at_nullable, created_at")
    .single();

  if (error) {
    if (!isMissingVisibilityColumn(error.message)) {
      throw new Error(error.message);
    }

    const fallback = await supabase
      .from("share_links")
      .insert({
        client_id: clientId,
        token,
        is_active: true,
        password_hash_nullable: null,
        expires_at_nullable: null,
      })
      .select("id, client_id, token, is_active, expires_at_nullable, created_at")
      .single();

    if (fallback.error) throw new Error(fallback.error.message);

    return {
      ...(fallback.data as Omit<ShareLinkRow, "visible_sections_json">),
      visible_sections_json: [...DEFAULT_SHARE_VISIBILITY],
    };
  }
  return {
    ...(data as ShareLinkRow & { visible_sections_json: unknown }),
    visible_sections_json: sanitizeShareVisibility((data as { visible_sections_json: unknown }).visible_sections_json),
  };
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
    .select("id, client_id, token, visible_sections_json, is_active, expires_at_nullable, created_at")
    .single();

  if (error) {
    if (isMissingVisibilityColumn(error.message)) {
      throw new Error("Bitte zuerst das Share Link Schema in Supabase aktualisieren");
    }

    throw new Error(error.message);
  }

  return {
    ...(data as ShareLinkRow & { visible_sections_json: unknown }),
    visible_sections_json: sanitizeShareVisibility((data as { visible_sections_json: unknown }).visible_sections_json),
  };
}

export async function getShareLinkByToken(token: string): Promise<ShareLinkRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("id, client_id, token, visible_sections_json, is_active, expires_at_nullable, created_at")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (!isMissingVisibilityColumn(error.message)) {
      throw new Error(error.message);
    }

    const fallback = await supabase
      .from("share_links")
      .select("id, client_id, token, is_active, expires_at_nullable, created_at")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (fallback.error) throw new Error(fallback.error.message);
    if (!fallback.data) return null;

    return {
      ...(fallback.data as Omit<ShareLinkRow, "visible_sections_json">),
      visible_sections_json: [...DEFAULT_SHARE_VISIBILITY],
    };
  }
  if (!data) return null;

  return {
    ...(data as ShareLinkRow & { visible_sections_json: unknown }),
    visible_sections_json: sanitizeShareVisibility((data as { visible_sections_json: unknown }).visible_sections_json),
  };
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
