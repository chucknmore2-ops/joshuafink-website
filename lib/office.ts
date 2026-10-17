/**
 * Canonical Compass office address for Joshua Fink Group.
 * One spelling everywhere the site shows or encodes it:
 * 8119 Isabella Lane Suite 105, Brentwood, TN 37027
 */

export const OFFICE_STREET = '8119 Isabella Lane Suite 105'
export const OFFICE_LOCALITY = 'Brentwood'
export const OFFICE_REGION = 'TN'
export const OFFICE_POSTAL_CODE = '37027'
export const OFFICE_ADDRESS = `${OFFICE_STREET}, ${OFFICE_LOCALITY}, ${OFFICE_REGION} ${OFFICE_POSTAL_CODE}`

export const officePostalAddress = {
  '@type': 'PostalAddress' as const,
  streetAddress: OFFICE_STREET,
  addressLocality: OFFICE_LOCALITY,
  addressRegion: OFFICE_REGION,
  postalCode: OFFICE_POSTAL_CODE,
  addressCountry: 'US',
}
