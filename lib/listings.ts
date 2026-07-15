// AUTO-GENERATED — Last synced: 2026-07-15T10:07:08.566Z
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
export const listingsSyncedAt = "2026-07-15T10:07:08.566Z";

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
    address: "9560 Dresden Square",
    city: "Brentwood, TN 37027",
    price: 1299000,
    beds: 6,
    baths: 6,
    sqft: 4256,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/9560-Dresden-Square-Brentwood-TN-37027/T863Z_pid/",
    imageUrl: "https://www.compass.com/m/1726667bfbabb4404e04bd62941b072da078e36ffe55a775567367f26ee41f7d/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "1113 Linn Cv Ct",
    city: "Gallatin, TN 37066 | MLS #3214253",
    price: 499900,
    beds: 4,
    baths: 4,
    sqft: 2869,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/1113-Linn-Cv-Ct-Gallatin-TN-37066/SPCI8_pid/",
    imageUrl: "https://www.compass.com/m/27a44fbc63c0ae824484f63820d4fad5edb0c0001545ea2e13f041c543ada11d/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "Undisclosed Address",
    city: "Nashville, TN 37216 | MLS #3270404",
    price: 429900,
    beds: 3,
    baths: 1,
    sqft: 1223,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/Undisclosed-Address-Nashville-TN-37216/2146596257497587577_lid/",
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
    imageUrl: "https://www.compass.com/m/a7ef33f971b3f98f9c9df198198d003671a4c04ee14a9a100ddb182a937911e6/2048x1536.webp",
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
    imageUrl: "https://www.compass.com/m/187622680f986b0b05fa461aa832ce13b251e2de56a4139db9633366657b3f15/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  }
];
