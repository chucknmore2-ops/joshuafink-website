// AUTO-GENERATED — Last synced: 2026-10-01T15:20:44.920Z
// Source: https://www.compass.com/agents/joshua-fink/
// Do not edit manually — run: node scripts/fetch-images.mjs

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
  // ISO timestamp of the last Compass sync that confirmed this listing.
  // Used by /listings to flag the grid as 'Verifying…' if the file goes stale.
  lastVerified?: string;
}

// Mirrors the header timestamp so server components can compute sync staleness
// without parsing comments. Updated by scripts/fetch-images.mjs each sync.
export const listingsSyncedAt = "2026-10-01T15:20:44.920Z";

export const listings: Listing[] = [
  {
    address: "1100 Gibson Dr",
    city: "Madison, TN 37115",
    price: 389900,
    beds: 3,
    baths: 2,
    sqft: 1378,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/1100-Gibson-Dr-Madison-TN-37115/SJV0E_pid/",
    imageUrl: "https://www.compass.com/m/11e587962d972824bcfa83986a2a18c8b7991d767be1f8ec6b0cb060ef148290/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "3814 Plantation Dr",
    city: "Hermitage, TN 37076 | MLS #3319960",
    price: 369900,
    beds: 3,
    baths: 1,
    sqft: 1325,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/3814-Plantation-Dr-Hermitage-TN-37076/TFS3S_pid/",
    imageUrl: "https://www.compass.com/m/6639cc5243226d377992b3c778d4794a2f72457c3b18b67263cd98c6a21838fa/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "107 Overlook Trail",
    city: "Goodlettsville, TN 37072",
    price: 339900,
    beds: 3,
    baths: 2,
    sqft: 1068,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/107-Overlook-Trail-Goodlettsville-TN-37072/S1YDH_pid/",
    imageUrl: "https://www.compass.com/m/8985df27c4ffe884adc4d99e9b53e58edb750887ca26b1f7b5e7df7c1f58a106/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "316 7th Ave",
    city: "Columbia, TN 38401 | MLS #3527081",
    price: 319900,
    beds: 2,
    baths: 2,
    sqft: 1053,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/316-7th-Ave-Columbia-TN-38401/SQ46B_pid/",
    imageUrl: "https://www.compass.com/m/4f489e005c9f2045d6bbcce5471fc3b26542e22acea65390028536c64024397d/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "2037 Walnut Ln",
    city: "Gallatin, TN 37066 | MLS #3527618",
    price: 319900,
    beds: 3,
    baths: 3,
    sqft: 1544,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/2037-Walnut-Ln-Gallatin-TN-37066/SFFDI_pid/",
    imageUrl: "https://www.compass.com/m/cfb0b5c09b81c0659c2b0baa6b3bc9332777f4a2bd4d6d647b185638b946738f/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  }
];
