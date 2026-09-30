/** Mon/Wed/Fri 14:00–14:19 UTC. Matches the historical listing cron, with
 * room for a retry inside a 5-minute tick. */
export function inListingWindow(now: Date): boolean {
  const day = now.getUTCDay()
  if (day !== 1 && day !== 3 && day !== 5) return false
  return now.getUTCHours() === 14 && now.getUTCMinutes() < 20
}
