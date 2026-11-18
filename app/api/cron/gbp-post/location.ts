/**
 * Parent resource for POST https://mybusiness.googleapis.com/v4/{parent}/localPosts.
 *
 * Business Information v1 names a location `locations/{id}`. The v4 localPosts
 * collection needs `accounts/{account}/locations/{id}`. GBP_LOCATION_ID has
 * been pasted as either shape (and occasionally as a bare numeric id).
 */
export function normalizeGbpLocationId(
  locationId: string,
  accountId?: string | null,
): string {
  const location = locationId.trim()
  if (location.startsWith('accounts/') && location.includes('/locations/')) {
    return location
  }

  const account = accountResource(accountId)

  if (location.startsWith('locations/')) {
    return account ? `${account}/${location}` : location
  }

  if (/^\d+$/.test(location)) {
    return account ? `${account}/locations/${location}` : `locations/${location}`
  }

  return location
}

/** `accounts/{id}` when the value is already that shape or a bare numeric id. */
function accountResource(accountId?: string | null): string | null {
  const account = accountId?.trim() ?? ''
  if (!account) return null
  if (account.startsWith('accounts/')) return account
  if (/^\d+$/.test(account)) return `accounts/${account}`
  return null
}
