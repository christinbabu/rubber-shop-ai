import { fetchYahooQuote } from './yahoo.js'
import { fmtPct, direction } from './factorReason.js'

const cache = { data: null, at: 0, ttl: 30 * 60 * 1000 }

// BDRY (Breakwave Dry Bulk Shipping ETF) holds Baltic Dry Index futures —
// the closest freely-quotable proxy for global dry-bulk freight costs, since
// the Baltic Dry Index itself has no free public feed.
export async function fetchShippingIndex() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const quote = await fetchYahooQuote('BDRY')
  const changePct = quote?.changePct ?? 0
  const shippingIndex = Math.max(1, Math.min(10, Math.round((5.5 + changePct * 0.6) * 10) / 10))

  const reason = `Baltic Dry proxy (BDRY) ${fmtPct(changePct)} → shipping conditions ${direction(changePct, { up: 'tightening (costlier freight)', down: 'easing (cheaper freight)', flat: 'flat' })}`

  const result = {
    price: quote?.price ?? null,
    changePct,
    shippingIndex,
    reason,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance (BDRY — Baltic Dry Index proxy)',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
