import type { ByTheNumbersSection } from '@/lib/by-the-numbers'

/**
 * Dated, quotable stat block. The sentences are built in lib/by-the-numbers.ts
 * so the visible line and the Dataset schema cannot drift.
 */
export default function ByTheNumbers({ section }: { section: ByTheNumbersSection }) {
  return (
    <section
      id="by-the-numbers"
      aria-labelledby="by-the-numbers-heading"
      className="border-b border-[#E8E8E8] bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          Quoted figures
        </p>
        <h2
          id="by-the-numbers-heading"
          className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-3"
        >
          {section.heading}
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-3xl mb-8">{section.intro}</p>
        <ul className="space-y-4 max-w-3xl">
          {section.stats.map((stat) => (
            <li key={stat.id} className="text-sm text-[#444] leading-relaxed">
              {stat.claim}{' '}
              (
              <a
                href={stat.sourceUrl}
                className="underline underline-offset-2 hover:text-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source: {stat.source}
              </a>
              {`, as of ${stat.asOfMonth}`}
              ).
            </li>
          ))}
        </ul>
        <div className="mt-10 max-w-3xl space-y-6">
          {section.answers.map((answer) => (
            <div key={answer.q}>
              <h3 className="text-base font-black text-black mb-1">{answer.q}</h3>
              <p className="text-sm text-[#444] leading-relaxed">{answer.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
