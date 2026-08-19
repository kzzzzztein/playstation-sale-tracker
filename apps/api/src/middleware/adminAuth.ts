import type { Env } from "../env.js";
import { unauthorized } from "../lib/http.js";

/**
 * Protects /api/admin/* routes with a bearer token compared against the
 * ADMIN_API_TOKEN Worker secret (`wrangler secret put ADMIN_API_TOKEN`).
 * This is intentionally simple (single shared token, not a user system) -
 * appropriate for a personal project with one operator. If you need
 * multi-user admin access later, swap this for Supabase Auth and check
 * a verified JWT + role claim instead.
 */
export function requireAdmin(request: Request, env: Env): void {
  if (!env.ADMIN_API_TOKEN) {
    throw unauthorized("Admin access is not configured on this deployment.");
  }
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token || token !== env.ADMIN_API_TOKEN) {
    throw unauthorized("Invalid or missing admin token.");
  }
}
