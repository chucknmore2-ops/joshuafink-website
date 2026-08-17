import { env } from "./env.ts";
import { log } from "./log.ts";

export interface Listing {
  address: string;
  city: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  acres?: number;
  status: string;
  note?: string;
  compassUrl: string;
  imageUrl?: string;
}

// raw.githubusercontent.com rate-limits by egress IP, which on Railway is
// shared — so a cron run can eat a `429 Too Many Requests` through no fault of
// its own (this killed the Mon 2026-08-17 9am post). Retry a few times, then
// fall back to the GitHub Contents API, which has a separate limit bucket.
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reasonOf(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 240);
}

/** `raw.githubusercontent.com/OWNER/REPO/REF/PATH` → Contents API URL. */
function apiFallbackUrl(rawUrl: string): string | null {
  const m = rawUrl.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/
  );
  if (!m) return null;
  const [, owner, repo, ref, path] = m;
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
}

async function fetchText(url: string, accept?: string): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": "joshuafink-autoposter/0.1",
  };
  if (accept) headers.Accept = accept;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch listings (${res.status} ${res.statusText}) from ${url}`
    );
  }
  return res.text();
}

async function fetchListingsSource(): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await fetchText(env.listingsUrl);
    } catch (err) {
      lastErr = err;
      if (attempt < ATTEMPTS) {
        log.warn(
          `Listings fetch attempt ${attempt}/${ATTEMPTS} failed (${reasonOf(err)}) — retrying in ${RETRY_DELAY_MS / 1000}s`
        );
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  const fallback = apiFallbackUrl(env.listingsUrl);
  if (!fallback) throw lastErr;
  log.warn(
    `Raw fetch exhausted (${reasonOf(lastErr)}) — falling back to the GitHub API`
  );
  return fetchText(fallback, "application/vnd.github.raw");
}

export async function loadListings(): Promise<Listing[]> {
  return parseListings(await fetchListingsSource());
}

function parseListings(source: string): Listing[] {
  const arrayStart = source.indexOf("export const listings");
  if (arrayStart === -1) throw new Error("listings export not found");
  const open = source.indexOf("[", arrayStart);
  const close = source.lastIndexOf("];");
  if (open === -1 || close === -1) throw new Error("listings array not found");
  const body = source.slice(open + 1, close);

  const out: Listing[] = [];
  for (const block of splitObjects(body)) {
    const get = (key: string) => extractValue(block, key);
    const address = get("address");
    const priceRaw = get("price");
    if (!address || !priceRaw) continue;
    out.push({
      address,
      city: get("city") ?? "",
      price: Number(priceRaw),
      beds: optionalNumber(get("beds")),
      baths: optionalNumber(get("baths")),
      sqft: optionalNumber(get("sqft")),
      acres: optionalNumber(get("acres")),
      status: get("status") ?? "Active",
      note: get("note") ?? undefined,
      compassUrl:
        get("compassUrl") ?? "https://www.compass.com/agents/joshua-fink/",
      imageUrl: get("imageUrl") ?? undefined,
    });
  }
  return out;
}

function splitObjects(body: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        blocks.push(body.slice(start, i));
        start = -1;
      }
    }
  }
  return blocks;
}

function extractValue(block: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*:\\s*("([^"]*)"|'([^']*)'|([0-9.]+))`);
  const m = block.match(re);
  if (!m) return null;
  return (m[2] ?? m[3] ?? m[4] ?? "").trim() || null;
}

function optionalNumber(v: string | null | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
