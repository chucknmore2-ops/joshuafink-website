// Pure parser for lib/listings.ts. No database and no network, so tests can
// import it without AUTOPOSTER env vars.

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
  /** ISO time of the first sync that included this home. Absent on older files. */
  firstSeen?: string;
  /** Open-house line from Compass, when the card actually shows one. */
  openHouse?: string;
}

export function parseListings(source: string): Listing[] {
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
    const note = get("note");
    const imageUrl = get("imageUrl");
    const firstSeen = get("firstSeen");
    const openHouse = get("openHouse");
    out.push({
      address,
      city: get("city") ?? "",
      price: Number(priceRaw),
      beds: optionalNumber(get("beds")),
      baths: optionalNumber(get("baths")),
      sqft: optionalNumber(get("sqft")),
      acres: optionalNumber(get("acres")),
      status: get("status") ?? "Active",
      note: note ?? undefined,
      compassUrl:
        get("compassUrl") ?? "https://www.compass.com/agents/joshua-fink/",
      imageUrl: imageUrl ?? undefined,
      firstSeen: firstSeen ?? undefined,
      openHouse: openHouse ?? undefined,
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
