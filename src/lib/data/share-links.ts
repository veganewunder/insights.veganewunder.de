import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ShareLinkRow = {
  id: string;
  client_id: string;
  token: string;
  is_active: boolean;
  expires_at_nullable: string | null;
  created_at: string;
};

export async function getShareLinksForClient(clientId: string): Promise<ShareLinkRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("id, client_id, token, is_active, expires_at_nullable, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ShareLinkRow[];
}

export async function createShareLink(clientId: string): Promise<ShareLinkRow> {
  const supabase = createSupabaseAdminClient();
  const token = crypto.randomUUID();

  const { data, error } = await supabase
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

  if (error) throw new Error(error.message);
  return data as ShareLinkRow;
}

export async function setShareLinkActive(id: string, isActive: boolean): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("share_links")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
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
