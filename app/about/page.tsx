import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Joshua Fink',
  description:
    'Learn about Joshua Fink — Affiliate Broker at Compass Real Estate with 13+ years of experience, 100+ homes sold annually, and multiple top-producer awards in Middle Tennessee.',
}

const specialties = [
  "Buyer's Agent",
  'Listing Agent',
  'Relocation Specialist',
  'Short Sale Specialist',
  'Landlord',
]

const awards = [
  { name: 'Diamond Award', desc: 'Compass Real Estate top-producer recognition' },
  { name: 'Titan Award', desc: 'Elite sales performance designation' },
  { name: 'Top Producing Agent of the Year', desc: 'Recognized annually for outstanding results' },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Meet Your Agent
          </p>
          <h1 className="text-5xl font-black tracking-tight">Joshua Fink</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">
            Affiliate Broker · Compass Real Estate · Middle Tennessee
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Headshot */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[3/4] bg-[#E8E8E8] overflow-hidden">
              <Image
                src="/headshot.jpg"
                alt="Joshua Fink — Affiliate Broker at Compass Real Estate"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>

            {/* Contact card */}
            <div className="mt-6 border border-[#E8E8E8] p-6">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
                Get In Touch
              </p>
              <div className="space-y-3 text-sm">
                <a
                  href="tel:6155512727"
                  className="flex items-center gap-3 text-black hover:underline font-medium"
                >
                  <span className="text-[#A0A0A0]">📞</span>
                  615-551-2727
                </a>
                <a
                  href="mailto:joshua@joshuafink.com"
                  className="flex items-center gap-3 text-black hover:underline font-medium"
                >
                  <span className="text-[#A0A0A0]">✉️</span>
                  joshua@joshuafink.com
                </a>
                <a
                  href="https://www.compass.com/agents/joshua-fink/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-black hover:underline font-medium"
                >
                  <span className="text-[#A0A0A0]">🔗</span>
                  Compass Profile
                </a>
              </div>
              <Link
                href="/contact"
                className="mt-6 block text-center bg-black text-white text-sm font-bold py-3 px-6 tracking-wide hover:bg-[#222] transition-colors"
              >
                Send a Message
              </Link>
            </div>
          </div>

          {/* Bio + details */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
              Biography
            </p>
            <div className="text-[#333] leading-relaxed space-y-4 text-base">
              <p>
                Joshua Fink is a leading realtor in Middle Tennessee. Josh is an experienced and
                knowledgeable professional with in-depth knowledge of the market, strong negotiation
                skills, and valuable relationships with local agents. Most importantly, he knows how
                to close deals.
              </p>
              <p>
                Joshua Fink has over 13 years of experience and averages 100+ homes personally sold
                each year. Joshua has been honored with a multitude of awards including Diamond and
                Titan Awards as well as Top Producing Agent of the Year.
              </p>
              <p>
                Josh is a full-time agent who is fully committed to his clients. He will put your
                goals first and truly loves what he does…and it shows! He also donates a portion of
                all commissions to the Children&apos;s Miracle Network and local charity partners
                each quarter.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-y border-[#E8E8E8] py-8">
              {[
                { val: '13+', label: 'Years Experience' },
                { val: '100+', label: 'Homes / Year' },
                { val: '3+', label: 'Major Awards' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-black text-black">{s.val}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Specialties */}
            <div className="mt-10">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
                Specialties
              </p>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-semibold px-3 py-1.5 border border-[#E8E8E8] text-[#444] tracking-wide"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Awards */}
            <div className="mt-10">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
                Awards &amp; Recognition
              </p>
              <div className="space-y-3">
                {awards.map((award) => (
                  <div
                    key={award.name}
                    className="flex items-start gap-4 border-l-2 border-black pl-4 py-1"
                  >
                    <div>
                      <p className="font-bold text-black text-sm">{award.name}</p>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">{award.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charity note */}
            <div className="mt-10 bg-[#F5F5F5] p-6">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                Giving Back
              </p>
              <p className="text-sm text-[#444] leading-relaxed">
                Joshua donates a portion of all commissions to the{' '}
                <strong className="text-black">Children&apos;s Miracle Network</strong> and local
                charity partners each quarter. When you work with Josh, your transaction helps kids
                and families in need right here in Tennessee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
