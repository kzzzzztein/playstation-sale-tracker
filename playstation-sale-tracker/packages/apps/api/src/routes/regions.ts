import { IRequest } from "itty-router";
import { createServiceClient, listRegions, listExchangeRates } from "@pst/database";
import type { Env } from "../env.js";
import { jsonResponse } from "../lib/http.js";

export async function handleListRegions(_request: IRequest, env: Env, origin: string) {
  const db = createServiceClient(env);
  const regions = await listRegions(db);
  return jsonResponse(regions, { origin });
}

export async function handleListExchangeRates(_request: IRequest, env: Env, origin: string) {
  const db = createServiceClient(env);
  const rates = await listExchangeRates(db);
  return jsonResponse(rates, { origin });
}
