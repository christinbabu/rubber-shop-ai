import { fetchYahooQuote } from './yahoo.js'
import { fmtPct, direction } from './factorReason.js'

const cache = { data: null, at: 0, ttl: 30 * 60 * 1000 }

export async function fetchTokyoMarket() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const [jpyResult, nikkeiResult] = await Promise.allSettled([
    fetchYahooQuote('JPY=X'),
    fetchYahooQuote('^N225'),
  ])
  const jpy     = jpyResult.status === 'fulfilled'    ? jpyResult.value    : null
  const nikkei  = nikkeiResult.status === 'fulfilled' ? nikkeiResult.value : null

  // JPY=X quotes yen-per-USD, so a falling rate means the yen is strengthening
  // (costlier OSE/Tokyo rubber futures for USD buyers, bullish read) — invert
  // the sign, same convention as producerFx.js/chinaDemand.js. Blend with
  // Nikkei 225 momentum as a second independent read on Japanese industrial/
  // auto demand (Japan is a top-5 global NR consumer via its tyre makers).
  const jpyStrengthPct = jpy?.changePct != null ? -jpy.changePct : 0
  const nikkeiPct = nikkei?.changePct ?? 0
  const avgPct = (jpyStrengthPct + nikkeiPct) / 2
  const tokyoIndex = Math.max(1, Math.min(10, Math.round((5.5 + avgPct * 0.8) * 10) / 10))

  const reason = `JPY ${fmtPct(jpyStrengthPct)}, Nikkei 225 ${fmtPct(nikkeiPct)} → Japan demand outlook ${direction(avgPct, { up: 'improving', down: 'cooling', flat: 'flat' })}`

  const result = {
    jpy: jpy ? { perUsd: jpy.price, changePct: jpy.changePct } : null,
    nikkei225: nikkei ? { price: nikkei.price, changePct: nikkei.changePct } : null,
    tokyoIndex,
    reason,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance (JPY/USD + Nikkei 225)',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
