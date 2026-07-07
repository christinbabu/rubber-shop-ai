import { fetchYahooQuote } from './yahoo.js'

export const TYRE_STOCKS = [
  { symbol: 'MRF.NS', name: 'MRF' },
  { symbol: 'CEATLTD.NS', name: 'CEAT' },
  { symbol: 'APOLLOTYRE.NS', name: 'Apollo Tyres' },
  { symbol: 'JKTYRE.NS', name: 'JK Tyre & Industries' },
  { symbol: 'BALKRISIND.NS', name: 'Balkrishna Industries' },
]

const cache = { data: null, at: 0, ttl: 5 * 60 * 1000 }

export async function fetchTyreStocks() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const results = await Promise.allSettled(TYRE_STOCKS.map((t) => fetchYahooQuote(t.symbol)))
  const stocks = TYRE_STOCKS.map((t, i) => {
    const r = results[i]
    const quote = r.status === 'fulfilled' ? r.value : null
    return {
      symbol: t.symbol,
      name: t.name,
      price: quote?.price ?? null,
      changePct: quote?.changePct ?? null,
      currency: quote?.currency ?? 'INR',
    }
  })

  const changes = stocks.map((s) => s.changePct).filter((v) => v != null)
  const avgChangePct = changes.length
    ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 100) / 100
    : 0

  // Heuristic proxy: rising tyre-maker share prices reflect the market pricing
  // in stronger tyre production/demand — the largest real driver of natural
  // rubber offtake. Scale the basket's average daily move onto the 1-10
  // "Tire industry demand" factor around its neutral midpoint (5.5).
  const tireDemandIndex = Math.max(1, Math.min(10, Math.round((5.5 + avgChangePct * 0.5) * 10) / 10))

  const result = {
    stocks,
    avgChangePct,
    tireDemandIndex,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance (NSE)',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
