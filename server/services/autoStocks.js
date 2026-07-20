import { fetchYahooQuote } from './yahoo.js'
import { fmtPct, direction } from './factorReason.js'

// Tata Motors is intentionally excluded — its 2025 CV/PV demerger left no
// single Yahoo-resolvable ticker for the combined business at time of writing.
export const AUTO_STOCKS = [
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra' },
]

const cache = { data: null, at: 0, ttl: 5 * 60 * 1000 }

export async function fetchAutoStocks() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const results = await Promise.allSettled(AUTO_STOCKS.map((s) => fetchYahooQuote(s.symbol)))
  const stocks = AUTO_STOCKS.map((s, i) => {
    const r = results[i]
    const quote = r.status === 'fulfilled' ? r.value : null
    return {
      symbol: s.symbol,
      name: s.name,
      price: quote?.price ?? null,
      changePct: quote?.changePct ?? null,
      currency: quote?.currency ?? 'INR',
    }
  })

  const changes = stocks.map((s) => s.changePct).filter((v) => v != null)
  const avgChangePct = changes.length
    ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 100) / 100
    : 0

  // Heuristic proxy, same style as tyreStocks.js: rising auto-OEM share
  // prices reflect the market pricing in stronger vehicle production, which
  // drives aggregate tyre (and therefore rubber) offtake.
  const autoSalesIndex = Math.max(1, Math.min(10, Math.round((5.5 + avgChangePct * 0.5) * 10) / 10))

  const reason = `${stocks.map((s) => `${s.name} ${s.changePct != null ? fmtPct(s.changePct) : 'n/a'}`).join(', ')} → auto/EV demand outlook ${direction(avgChangePct, { up: 'improving', down: 'cooling', flat: 'flat' })}`

  const result = {
    stocks,
    avgChangePct,
    autoSalesIndex,
    reason,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance (NSE)',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
