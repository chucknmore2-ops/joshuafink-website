/**
 * Exit 0 when production HTML is serving the snapshot about to be posted.
 * The page body is stdin. Used by .github/workflows/monthly-market-update.yml
 * so that check does not live as a column-0 script inside the workflow YAML.
 *
 *   MEDIAN=515,725 SUPPLY=5.8 YOY='+2.1%' node scripts/snapshot-page-ready.mjs < page.html
 *
 * SUPPLY or YOY of "none" means that figure is not required.
 */

import { readFileSync } from 'node:fs'

const html = readFileSync(0, 'utf8')
const median = process.env.MEDIAN ?? ''
const supply = process.env.SUPPLY ?? 'none'
const yoy = process.env.YOY ?? 'none'

let ok = median !== '' && html.includes(`$${median}`)
if (supply !== 'none') {
  const i = html.indexOf('Months of supply')
  ok = ok && i >= 0 && html.slice(i, i + 80).includes(supply)
}
if (yoy !== 'none') {
  ok = ok && html.includes(yoy)
}
process.exit(ok ? 0 : 1)
