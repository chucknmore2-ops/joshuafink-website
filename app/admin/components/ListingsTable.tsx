import type { Listing } from "@/lib/listings";
import type { LastPostByListing } from "@/lib/admin-db";

function fmtPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default function ListingsTable({
  listings,
  lastPostsByRef,
}: {
  listings: Listing[];
  lastPostsByRef: LastPostByListing[];
}) {
  const fbByAddress = new Map<string, LastPostByListing>();
  for (const row of lastPostsByRef) {
    if (row.channel === "facebook") fbByAddress.set(row.ref_key, row);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <Th>Address</Th>
            <Th>City</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Last FB post</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {listings.map((l) => {
            const fb = fbByAddress.get(l.address);
            return (
              <tr key={l.address} className="hover:bg-slate-50">
                <Td>
                  <a
                    href={l.compassUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-slate-900 hover:text-slate-700"
                  >
                    {l.address}
                  </a>
                </Td>
                <Td>
                  <span className="text-slate-600">{l.city.split("|")[0].trim()}</span>
                </Td>
                <Td>
                  <span className="font-medium text-slate-900">
                    {fmtPrice(l.price)}
                  </span>
                </Td>
                <Td>
                  <span className="text-slate-600">{l.status}</span>
                </Td>
                <Td>
                  {fb ? (
                    <span
                      className={
                        daysAgo(fb.posted_at) <= 7
                          ? "text-slate-700"
                          : "text-slate-500"
                      }
                    >
                      {daysAgo(fb.posted_at)}d ago
                      {fb.status === "dry_run" && (
                        <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs text-slate-600">
                          dry
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">never</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 align-top">{children}</td>;
}
