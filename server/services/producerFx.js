import { fetchYahooQuote } from './yahoo.js'

export const PRODUCER_CURRENCIES = [
  { symbol: 'THB=X', name: 'Thai baht' },
  { symbol: 'IDR=X', name: 'Indonesian rupiah' },
  { symbol: 'VND=X', name: 'Vietnamese dong' },
]

const cache = { data: null, at: 0, ttl: 30 * 60 * 1000 }

export async function fetchProducerFx() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const results = await Promise.allSettled(PRODUCER_CURRENCIES.map((c) => fetchYahooQuote(c.symbol)))
  const currencies = PRODUCER_CURRENCIES.map((c, i) => {
    const r = results[i]
    const quote = r.status === 'fulfilled' ? r.value : null
    return {
      symbol: c.symbol,
      name: c.name,
      perUsd: quote?.price ?? null,
      changePct: quote?.changePct ?? null,
    }
  })

  const changes = currencies.map((c) => c.changePct).filter((v) => v != null)
  // Yahoo's XXX=X tickers quote units of the producer currency per USD, so a
  // falling rate means that currency is strengthening (costlier SE Asia
  // exports, bullish for NR) — invert the sign before averaging.
  const avgAppreciationPct = changes.length
    ? Math.round((-(changes.reduce((a, b) => a + b, 0) / changes.length)) * 100) / 100
    : 0

  const strengthIndex = Math.max(1, Math.min(10, Math.round((5.5 + avgAppreciationPct * 0.8) * 10) / 10))

  const result = {
    currencies,
    avgAppreciationPct,
    strengthIndex,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
