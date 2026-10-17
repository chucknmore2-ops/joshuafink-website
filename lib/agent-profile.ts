import { reviews, reviewStats, reviewDateToIso } from '@/lib/reviews'
import { officePostalAddress } from '@/lib/office'

/**
 * Profiles that resolve to Joshua Fink / Joshua Fink Group.
 * Social, Compass, Zillow, Realtor.com, and Homes.com URLs were already
 * published in app/layout.tsx, the footer, and public/llms.txt.
 * FastExpert and HomeLight were confirmed live on 2026-10-17 (Compass,
 * 615-551-2727, Brentwood). HomeLight's slug is the Nevada-era id; the page
 * itself is his Compass Middle Tennessee profile. No second TN profile exists.
 */
export const AGENT_SAME_AS = [
  'https://www.facebook.com/profile.php?id=100064076493905',
  'https://www.instagram.com/joshuafinkgroup',
  'https://www.linkedin.com/in/joshuafinkgroup/',
  'https://x.com/JoshuaFinkGroup',
  'https://www.youtube.com/channel/UCc6j1NWgJeb00pT5xsenz3g',
  'https://www.compass.com/agents/joshua-fink/',
  'https://www.zillow.com/profile/JoshuaFinkGroup',
  'https://www.realtor.com/realestateagents/56aa7a5489a68901006bed2d',
  'https://www.homes.com/real-estate-agents/joshua-fink/qej2pry/',
  'https://www.fastexpert.com/agents/joshua-fink-143374/',
  'https://www.homelight.com/agents/joshua-fink-nv-hl9585247',
] as const

const TREC_CREDENTIAL = {
  '@type': 'EducationalOccupationalCredential' as const,
  name: 'Tennessee Real Estate Commission Affiliate Broker License #351484',
  credentialCategory: 'license',
  identifier: '351484',
  recognizedBy: {
    '@type': 'GovernmentOrganization' as const,
    name: 'Tennessee Real Estate Commission',
    url: 'https://www.tn.gov/commerce/regboards/trec.html',
  },
}

/** Site-wide JSON-LD graph rendered from app/layout.tsx. */
export function siteJsonLdGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        '@id': 'https://www.joshuafink.com/#agent',
        name: 'Joshua Fink',
        alternateName: 'Joshua Fink Group',
        brand: {
          '@type': 'Brand',
          name: 'Joshua Fink Group',
        },
        description:
          'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate serving Nashville, Brentwood, Franklin, and all of Middle Tennessee. Licensed since 2008, with 40+ homes a year in Middle Tennessee.',
        url: 'https://www.joshuafink.com',
        telephone: '+1-615-551-2727',
        email: 'joshua@joshuafink.com',
        image: 'https://www.joshuafink.com/headshot.webp',
        logo: 'https://www.joshuafink.com/compass-logo-black.png',
        address: officePostalAddress,
        // Approximate office coordinates (Maryland Farms / Cool Springs
        // area of Brentwood) — verify against the exact pin if needed.
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 36.0234,
          longitude: -86.7838,
        },
        hasMap:
          'https://www.google.com/maps/search/?api=1&query=8119+Isabella+Lane+Suite+105+Brentwood+TN+37027',
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday', 'Sunday'],
            opens: '10:00',
            closes: '17:00',
          },
        ],
        // Thing.identifier is valid on RealEstateAgent. hasCredential is a
        // Person property, so the license number lives there on the Person
        // node and here as an identifier.
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'TREC',
          name: 'Tennessee Real Estate Commission Affiliate Broker License',
          value: '351484',
        },
        areaServed: [
          { '@type': 'City', name: 'Franklin, TN' },
          { '@type': 'City', name: 'Brentwood, TN' },
          { '@type': 'City', name: 'Spring Hill, TN' },
          { '@type': 'City', name: 'Nolensville, TN' },
          { '@type': 'City', name: "Thompson's Station, TN" },
          { '@type': 'City', name: 'Nashville, TN' },
          { '@type': 'City', name: 'Murfreesboro, TN' },
          { '@type': 'City', name: 'Gallatin, TN' },
          { '@type': 'City', name: 'Hendersonville, TN' },
          { '@type': 'City', name: 'Columbia, TN' },
          { '@type': 'City', name: 'Mount Juliet, TN' },
          { '@type': 'City', name: 'Lebanon, TN' },
          { '@type': 'City', name: 'Smyrna, TN' },
          { '@type': 'City', name: 'La Vergne, TN' },
          { '@type': 'AdministrativeArea', name: 'Middle Tennessee' },
        ],
        employee: { '@id': 'https://www.joshuafink.com/#joshua-fink' },
        parentOrganization: {
          '@type': 'RealEstateAgent',
          name: 'Compass Real Estate',
          url: 'https://www.compass.com',
        },
        sameAs: [...AGENT_SAME_AS],
        priceRange: '$300000-$2500000',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Real Estate Services',
          itemListElement: [
            {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              itemOffered: {
                '@type': 'Service',
                name: 'Home Buying',
                serviceType: 'Buyer Representation',
                areaServed: 'Middle Tennessee',
                url: 'https://www.joshuafink.com/buy',
                provider: { '@id': 'https://www.joshuafink.com/#agent' },
              },
            },
            {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              itemOffered: {
                '@type': 'Service',
                name: 'Home Selling',
                serviceType: 'Listing Agent',
                areaServed: 'Middle Tennessee',
                url: 'https://www.joshuafink.com/sell',
                provider: { '@id': 'https://www.joshuafink.com/#agent' },
              },
            },
            {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              itemOffered: {
                '@type': 'Service',
                name: 'Cash Offer',
                serviceType: 'Instant Cash Offer',
                areaServed: 'Middle Tennessee',
                url: 'https://www.joshuafink.com/cash-offer',
                provider: { '@id': 'https://www.joshuafink.com/#agent' },
              },
            },
          ],
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: reviewStats.rating.toFixed(1),
          reviewCount: reviewStats.total,
          bestRating: '5',
          worstRating: '1',
        },
        review: reviews.map((r) => ({
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: r.rating,
            bestRating: 5,
          },
          author: { '@type': 'Person', name: r.reviewer },
          datePublished: reviewDateToIso(r.date),
          reviewBody: r.text,
          itemReviewed: { '@id': 'https://www.joshuafink.com/#agent' },
        })),
      },
      {
        '@type': 'Person',
        '@id': 'https://www.joshuafink.com/#joshua-fink',
        name: 'Joshua Fink',
        jobTitle: 'Affiliate Broker',
        worksFor: { '@id': 'https://www.joshuafink.com/#agent' },
        url: 'https://www.joshuafink.com/about',
        telephone: '+1-615-551-2727',
        email: 'joshua@joshuafink.com',
        image: 'https://www.joshuafink.com/headshot.webp',
        address: officePostalAddress,
        hasCredential: [TREC_CREDENTIAL],
        award: ['Compass Diamond Award', 'Compass Titan Award'],
        knowsAbout: [
          'Real Estate',
          'Nashville Real Estate Market',
          'Middle Tennessee Properties',
          'Investment Properties',
          'Fix and Flip',
          'Home Buying',
          'Home Selling',
        ],
        sameAs: [...AGENT_SAME_AS],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.joshuafink.com/#website',
        url: 'https://www.joshuafink.com',
        name: 'Joshua Fink | Compass Real Estate',
        description:
          'Real estate in Middle Tennessee — listings, market insights, cash offers, and neighborhood guides.',
        publisher: { '@id': 'https://www.joshuafink.com/#agent' },
        inLanguage: 'en-US',
      },
    ],
  }
}
