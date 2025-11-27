import dns from "node:dns/promises";
import { URL } from "node:url";

const isProd = process.env.NODE_ENV === "production";
const DEV_DEFAULT = "http://base:8080"; // only valid in docker-compose

export const GEO_BASE_URL =
  process.env.GEO_BASE_URL ?? (isProd ? undefined : DEV_DEFAULT);

if (!GEO_BASE_URL) throw new Error("GEO_BASE_URL is required in production");

// Fast-fail DNS so bad hostnames are obvious
(async () => {
  const host = new URL(GEO_BASE_URL).hostname;
  if (host === "base" && isProd) throw new Error("Refusing to use 'base' in production");
  await dns.lookup(host);
  console.info(`[geo] baseURL: ${GEO_BASE_URL} (DNS OK)`);
})();

export async function geoGet(path: string, params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const url = `${GEO_BASE_URL}${path}${qs}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`geo GET ${url} -> ${res.status} ${res.statusText}`);
  return res.json();
}
