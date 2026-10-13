import TrackedTelLink from '@/components/TrackedTelLink'

const neighborhoods = [
  {
    name: 'Cool Springs',
    note: 'The mixed residential, office, and retail corridor: condos, townhomes, and single-family homes near I-65 and the Galleria. It generally sits in the Centennial High corridor. Confirm the Williamson County zone for the exact address.',
  },
  {
    name: 'Westhaven',
    note: 'The walkable master-planned community with a town center.',
  },
  {
    name: 'Fieldstone Farms',
    note: 'The established HOA subdivision with larger lots and mature trees.',
  },
]

/**
 * Visible "who to hire in Franklin" block. Facts are the published Compass
 * office, license, and the three Franklin neighborhoods already described
 * on the Franklin buyer page — no new price bands or school assignments.
 */
export default function FranklinWhoToHire() {
  return (
    <section
      id="who-to-hire"
      aria-labelledby="who-to-hire-heading"
      className="border-b border-[#E8E8E8] bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          Franklin, TN
        </p>
        <h2 id="who-to-hire-heading" className="text-3xl font-black text-black tracking-tight mb-6">
          Who to hire in Franklin
        </h2>
        <p className="text-[#444] text-base leading-relaxed max-w-3xl mb-8">
          Joshua Fink is a Compass Affiliate Broker at the Compass Brentwood office, 8119 Isabella Lane, Suite 105, Brentwood, TN 37027. Tennessee Real Estate Commission license TREC #351484. Licensed since 2008, he sells 40+ homes a year in Middle Tennessee. Call or text{' '}
          <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="franklin-who-to-hire-call">
            615-551-2727
          </TrackedTelLink>
          .
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {neighborhoods.map((n) => (
            <div key={n.name} className="bg-[#F5F5F5] p-6 border-t-4" style={{ borderColor: '#C41E3A' }}>
              <h3 className="text-base font-black text-black mb-3">{n.name}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{n.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
