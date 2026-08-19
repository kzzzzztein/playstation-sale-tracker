import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./schema.js";

export interface SupabaseEnv {
  SUPABASE_URL: string;
  /**
   * Service-role key. This must ONLY ever be read from Worker secrets
   * (`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`), never bundled into
   * frontend code, never logged, never returned in API responses.
   */
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export type DB = SupabaseClient<Database>;

/**
 * Creates a Supabase client authenticated with the service-role key.
 * This client bypasses Row Level Security and must only be instantiated
 * inside the Cloudflare Worker (apps/api), never sent to the browser.
 */
export function createServiceClient(env: SupabaseEnv): DB {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
