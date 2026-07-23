// AUTO-GENERATED — Last synced: 2026-07-23T10:26:47.283Z
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
export const listingsSyncedAt = "2026-07-23T10:26:47.283Z";

export const listings: Listing[] = [
  {
    address: "1901 New Bristol Ln",
    city: "Brentwood, TN 37027",
    price: 1849000,
    beds: 5,
    baths: 5,
    sqft: 5855,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/1901-New-Bristol-Ln-Brentwood-TN-37027/RS25E_pid/",
    imageUrl: "https://www.compass.com/m/5e20f6de5ae242cba0b75f7227f5a4b1f5937902cfbf792d921c2e860034cf71/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "4127 Edwards Ave",
    city: "Nashville, TN 37216 | MLS #3270404",
    price: 429900,
    beds: 3,
    baths: 1,
    sqft: 1223,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/4127-Edwards-Ave-Nashville-TN-37216/THUS9_pid/",
    imageUrl: "https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "511 Wanda Dr",
    city: "Nashville, TN 37210",
    price: 419900,
    beds: 4,
    baths: 2,
    sqft: 1400,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/511-Wanda-Dr-Nashville-TN-37210/SDYP1_pid/",
    imageUrl: "https://www.compass.com/m/4e9cb7fc9872c9dbd0b0f820634b2dfa965d3cfe_img_0_e40e3/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "3814 Plantation Dr",
    city: "Hermitage, TN 37076 | MLS #3247526",
    price: 389900,
    beds: 3,
    baths: 1,
    sqft: 1325,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/3814-Plantation-Dr-Hermitage-TN-37076/TFS3S_pid/",
    imageUrl: "https://www.compass.com/m/6638e69bad59ee73eea6230dca8bfcd087a0286d5c135137d7132007baeefea4/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "870 Reeves Rd",
    city: "Antioch, TN 37013",
    price: 349900,
    beds: 3,
    baths: 2,
    sqft: 1134,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/870-Reeves-Rd-Antioch-TN-37013/SW1BU_pid/",
    imageUrl: "https://www.compass.com/m/ce49d43899de5afcb9e0c75704d5e6a63a12a2c584826f54faf7ebb96ef704be/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "4874 Sparta Pike",
    city: "Watertown, TN 37184 | MLS #3247524",
    price: 339900,
    beds: 3,
    baths: 1,
    sqft: 1248,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/4874-Sparta-Pike-Watertown-TN-37184/TMU6R_pid/",
    imageUrl: "https://www.compass.com/m/bbc96932a4def1b58a65235f0c21695ff8c7c77087887c7c1cdc852cf4ab3759/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  }
];
