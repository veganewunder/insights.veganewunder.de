import { createClient } from "@supabase/supabase-js";
import { EnvConfigError, getSupabaseServiceRoleEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  try {
    const { url, serviceRoleKey } = getSupabaseServiceRoleEnv();

    return createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new Error(error.message);
    }

    throw error;
  }
}
