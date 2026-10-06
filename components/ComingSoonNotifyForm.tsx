import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'

type Props = {
  address: string
  propertyAddress: string
  suburb?: string
}

const inputClass =
  'w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors'

export default function ComingSoonNotifyForm({ address, propertyAddress, suburb }: Props) {
  return (
    <div id="notify">
      <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
        Coming soon
      </p>
      <h2 className="text-2xl font-black text-black tracking-tight mb-2">Get notified when it&apos;s live</h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
        Joshua will contact you when {address} is on the market. Checking the box also adds you to new-listing emails.
      </p>
      <SuburbLeadForm
        successTitle="You'll hear when it's live"
        successMessage={
          <>
            Joshua will reach out about {address}. Call{' '}
            <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="coming-soon-success-call">
              615-551-2727
            </TrackedTelLink>{' '}
            if you need him sooner.
          </>
        }
        resetLabel="Send another"
      >
        <input type="hidden" name="lead_type" value="buyer" />
        <input type="hidden" name="source" value="listing-coming-soon" />
        <input type="hidden" name="property_address" value={propertyAddress} />
        {suburb && <input type="hidden" name="suburb" value={suburb} />}
        <input type="hidden" name="body" value={`Please notify me when ${propertyAddress} is live.`} />
        <div>
          <label htmlFor="notify-name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Full name *
          </label>
          <input id="notify-name" name="name" type="text" required autoComplete="name" placeholder="Jane Smith" className={inputClass} />
        </div>
        <div>
          <label htmlFor="notify-phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Phone
          </label>
          <input id="notify-phone" name="phone" type="tel" autoComplete="tel" placeholder="615-555-0000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="notify-email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Email
          </label>
          <input id="notify-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>
        <label className="flex items-start gap-3 text-sm text-[#333] leading-relaxed">
          <input type="checkbox" name="alert_opt_in" value="yes" className="mt-1" />
          <span>Also email me about other Compass listings like this one. Unsubscribe anytime.</span>
        </label>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-neutral-800 transition-colors"
        >
          Notify me when it&apos;s live →
        </button>
      </SuburbLeadForm>
    </div>
  )
}
