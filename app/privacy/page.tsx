import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Joshua Fink Group',
  description: 'Privacy Policy for joshuafink.com and Joshua Fink Group.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Legal</p>
          <h1 className="text-5xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">Last updated: March 20, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-sm">
        <h2 className="text-xl font-black text-black mt-8 mb-4">Information We Collect</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          When you submit a contact form on joshuafink.com, we collect your name, email address, phone number, and message. This information is used solely to respond to your real estate inquiry.
        </p>

        <h2 className="text-xl font-black text-black mt-8 mb-4">How We Use Your Information</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          Your information is used to respond to your inquiry and provide real estate services. We do not sell, trade, or share your personal information with third parties except as required by law.
        </p>

        <h2 className="text-xl font-black text-black mt-8 mb-4">Cookies</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          This website may use cookies to improve your browsing experience. You can disable cookies in your browser settings at any time.
        </p>

        <h2 className="text-xl font-black text-black mt-8 mb-4">Third-Party Services</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          This site uses Formspree to process contact form submissions. Form data is transmitted securely and subject to Formspree&apos;s privacy policy. Listings are sourced from Compass Real Estate.
        </p>

        <h2 className="text-xl font-black text-black mt-8 mb-4">Contact</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          If you have questions about this privacy policy, contact us at:{' '}
          <a href="mailto:joshua@joshuafink.com" className="text-black underline">joshua@joshuafink.com</a>
          {' '}or call{' '}
          <a href="tel:6155512727" className="text-black underline">615-551-2727</a>.
        </p>

        <h2 className="text-xl font-black text-black mt-8 mb-4">User Data Deletion</h2>
        <p className="text-[#444] leading-relaxed mb-4">
          To request deletion of your personal data, email{' '}
          <a href="mailto:joshua@joshuafink.com" className="text-black underline">joshua@joshuafink.com</a>{' '}
          with the subject line &quot;Data Deletion Request&quot;. We will process your request within 30 days.
        </p>
      </div>
    </div>
  )
}
