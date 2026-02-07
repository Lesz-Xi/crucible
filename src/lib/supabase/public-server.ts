import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for read-only/public registry routes.
 * Prefers service role to avoid auth-gated read failures for canonical frameworks.
 */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or key for public registry access.");
  }

  return createClient(url, key);
}

