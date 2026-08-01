// AUTO-GENERATED — Last synced: 2026-08-01T10:03:00.492Z
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
export const listingsSyncedAt = "2026-08-01T10:03:00.492Z";

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
    address: "1113 Linn Cv Ct",
    city: "Gallatin, TN 37066 | MLS #3306475",
    price: 499900,
    beds: 4,
    baths: 4,
    sqft: 2869,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/1113-Linn-Cv-Ct-Gallatin-TN-37066/SPCI8_pid/",
    imageUrl: "https://www.compass.com/m/60a6fdc8112389a3764c5cfd1daf97bdf574197abd273eaf774a732b627db89d/2048x1536.webp",
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
    city: "Goodlettsville, TN 37072 | MLS #3297936",
    price: 339900,
    beds: 3,
    baths: 2,
    sqft: 1068,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/107-Overlook-Trail-Goodlettsville-TN-37072/S1YDH_pid/",
    imageUrl: "https://www.compass.com/m/8985df27c4ffe884adc4d99e9b53e58edb750887ca26b1f7b5e7df7c1f58a106/2048x1536.webp",
    lastVerified: listingsSyncedAt,
  }
];
