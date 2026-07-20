import { fetchYahooQuote } from './yahoo.js'
import { fmtPct, direction } from './factorReason.js'

const cache = { data: null, at: 0, ttl: 30 * 60 * 1000 }

export async function fetchChinaDemand() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const [cnyResult, ssecResult] = await Promise.allSettled([
    fetchYahooQuote('CNY=X'),
    fetchYahooQuote('000001.SS'),
  ])
  const cny  = cnyResult.status === 'fulfilled' ? cnyResult.value : null
  const ssec = ssecResult.status === 'fulfilled' ? ssecResult.value : null

  // CNY=X quotes yuan-per-USD, so a falling rate means the yuan is
  // strengthening (healthier demand outlook) — invert the sign, same
  // convention as producerFx.js. Blend with Shanghai Composite momentum as a
  // second independent read on Chinese economic activity.
  const cnyStrengthPct = cny?.changePct != null ? -cny.changePct : 0
  const ssecPct = ssec?.changePct ?? 0
  const avgPct = (cnyStrengthPct + ssecPct) / 2
  const demandIndex = Math.max(1, Math.min(10, Math.round((5.5 + avgPct * 0.8) * 10) / 10))

  const reason = `CNY ${fmtPct(cnyStrengthPct)}, Shanghai Composite ${fmtPct(ssecPct)} → China demand outlook ${direction(avgPct, { up: 'improving', down: 'cooling', flat: 'flat' })}`

  const result = {
    cny: cny ? { perUsd: cny.price, changePct: cny.changePct } : null,
    shanghaiComposite: ssec ? { price: ssec.price, changePct: ssec.changePct } : null,
    demandIndex,
    reason,
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance (CNY/USD + Shanghai Composite)',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
