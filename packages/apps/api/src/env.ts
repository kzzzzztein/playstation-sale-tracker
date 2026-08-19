export interface Env {
  // Secrets - set with `wrangler secret put <NAME>`
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_API_TOKEN: string;
  EXCHANGE_RATE_API_KEY?: string;

  // Vars - set in wrangler.toml [vars]
  ENVIRONMENT: "development" | "production";
  CORS_ALLOWED_ORIGIN: string;
}
