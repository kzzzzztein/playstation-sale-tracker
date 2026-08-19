import type { ApiError } from "@pst/types";

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonResponse(body: unknown, init: ResponseInit & { origin?: string } = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (init.origin) headers.set("Access-Control-Allow-Origin", init.origin);
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(err: unknown, origin: string): Response {
  if (err instanceof HttpError) {
    const body: ApiError = { error: { code: err.code, message: err.message, details: err.details } };
    return jsonResponse(body, { status: err.status, origin });
  }
  console.error("Unhandled error:", err);
  const body: ApiError = { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } };
  return jsonResponse(body, { status: 500, origin });
}

export function badRequest(message: string, details?: unknown) {
  return new HttpError(400, "BAD_REQUEST", message, details);
}
export function notFound(message = "Not found") {
  return new HttpError(404, "NOT_FOUND", message);
}
export function unauthorized(message = "Unauthorized") {
  return new HttpError(401, "UNAUTHORIZED", message);
}
