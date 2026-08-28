// AUTO-GENERATED — Last synced: 2026-08-28T20:00:10.970Z
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
export const listingsSyncedAt = "2026-08-28T20:00:10.970Z";

export const listings: Listing[] = [
  {
    address: "159 N Berwick Ln",
    city: "Franklin, TN 37069",
    price: 1224900,
    beds: 5,
    baths: 5,
    sqft: 4948,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/159-N-Berwick-Ln-Franklin-TN-37069/SXI63_pid/",
    imageUrl: "https://www.compass.com/m/df12aeb09644a8bbdce04893e44f3c939f35787c3b949436910c3b3d24cd926d/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "1113 Linn Cv Ct",
    city: "Gallatin, TN 37066",
    price: 499900,
    beds: 4,
    baths: 4,
    sqft: 2869,
    status: "Active Under Contract",
    compassUrl: "https://www.compass.com/homedetails/1113-Linn-Cv-Ct-Gallatin-TN-37066/SPCI8_pid/",
    imageUrl: "https://www.compass.com/m/60a6fdc8112389a3764c5cfd1daf97bdf574197abd273eaf774a732b627db89d/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "4127 Edwards Ave",
    city: "Nashville, TN 37216 | MLS #3319964",
    price: 424500,
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
    city: "Nashville, TN 37210 | MLS #3524691",
    price: 419900,
    beds: 4,
    baths: 2,
    sqft: 1400,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/511-Wanda-Dr-Nashville-TN-37210/SDYP1_pid/",
    imageUrl: "https://www.compass.com/m/f0024ff837d3adc039ba8c6d1dc635742a6efeecc314e741179475524cec3185/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "3814 Plantation Dr",
    city: "Hermitage, TN 37076 | MLS #3319960",
    price: 374900,
    beds: 3,
    baths: 1,
    sqft: 1325,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/3814-Plantation-Dr-Hermitage-TN-37076/TFS3S_pid/",
    imageUrl: "https://www.compass.com/m/6639cc5243226d377992b3c778d4794a2f72457c3b18b67263cd98c6a21838fa/2048x1536.webp",
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
    price: 329900,
    beds: 2,
    baths: 2,
    sqft: 1053,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/316-7th-Ave-Columbia-TN-38401/SQ46B_pid/",
    imageUrl: "https://www.compass.com/m/0a998abaf8f79a2963e243e3e6a95f98a671e75f5a412c8ce50e8e191fbbf27b/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  },
  {
    address: "4874 Sparta Pike",
    city: "Watertown, TN 37184 | MLS #3319962",
    price: 324900,
    beds: 3,
    baths: 1,
    sqft: 1248,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/4874-Sparta-Pike-Watertown-TN-37184/TMU6R_pid/",
    imageUrl: "https://www.compass.com/m/9271db1e1cbdb146eb498cd63a192c09a438f39c3b9627023b0cbda6f044a677/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  }
];
