import { tennesseeClosingsProof } from '@/lib/closings'

type Props = {
  linkClassName?: string
}

/**
 * Short in-body closings line. Counts come from the /sold source
 * (Tennessee closings only). City names link to the same /sold# anchors
 * already used on /buy/[suburb] and /cash-offer/nashville-tn.
 * City names and counts only — no client names.
 */
export default function TennesseeClosingsProof({
  linkClassName = 'font-semibold underline underline-offset-4',
}: Props) {
  const proof = tennesseeClosingsProof()
  const [nashville, brentwood, franklin] = proof.cities
  return (
    <>
      <a href={proof.soldHref} className={linkClassName}>
        {proof.total} Tennessee closings
      </a>
      {', including '}
      <a href={nashville.href} className={linkClassName}>
        {nashville.count} in {nashville.city}
      </a>
      {', '}
      <a href={brentwood.href} className={linkClassName}>
        {brentwood.count} in {brentwood.city}
      </a>
      {' and '}
      <a href={franklin.href} className={linkClassName}>
        {franklin.count} in {franklin.city}
      </a>
    </>
  )
}
