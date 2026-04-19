import { reviewStats } from '@/lib/reviews'

type Variant = 'light' | 'dark'

const badges = [
  { label: 'Licensed TN Affiliate Broker', sub: 'TREC License #351484' },
  { label: '17+ Years in Middle TN', sub: 'Since 2008' },
  { label: `${reviewStats.total}+ Five-Star Reviews`, sub: `${reviewStats.rating.toFixed(1)} avg rating` },
  { label: 'Compass Real Estate', sub: 'Diamond & Titan Award' },
]

export default function TrustBadges({ variant = 'dark' }: { variant?: Variant }) {
  const isDark = variant === 'dark'
  return (
    <ul
      aria-label="Trust signals"
      className={`flex flex-wrap items-stretch gap-2 sm:gap-3 ${isDark ? 'text-white' : 'text-black'}`}
    >
      {badges.map((b) => (
        <li
          key={b.label}
          className={`flex flex-col rounded-2xl px-4 py-3 border backdrop-blur-sm ${
            isDark
              ? 'border-white/20 bg-white/[0.04]'
              : 'border-neutral-200 bg-white/80'
          }`}
        >
          <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${
            isDark ? 'text-white/60' : 'text-neutral-500'
          }`}>
            {b.sub}
          </span>
          <span className="text-xs sm:text-sm font-bold mt-0.5 leading-tight">{b.label}</span>
        </li>
      ))}
    </ul>
  )
}
