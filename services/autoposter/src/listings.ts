import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.ts";

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

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadListings(): Promise<Listing[]> {
  const path = resolve(__dirname, "..", env.listingsTsPath);
  const source = await readFile(path, "utf8");
  return parseListings(source);
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
