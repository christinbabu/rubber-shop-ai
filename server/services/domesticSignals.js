import { getDb } from '../db.js'
import { scrapeRubberBoard, scrapeKarnatakaPost, fetchCommoditiesApi } from './priceSources.js'
import { fmtPct, direction } from './factorReason.js'

const cache = { data: null, at: 0, ttl: 15 * 60 * 1000 }

// India's supply deficit and SE Asia's supply tightness don't have their own
// live numeric feeds, but both leave a fingerprint on prices we already
// scrape: the Kottayam-over-Bangkok premium (deficit) and the Bangkok
// benchmark's own day-over-day move (SE Asia tightness).
export async function fetchDomesticSignals() {
  if (cache.data && Date.now() - cache.at < cache.ttl) {
    return cache.data
  }

  const [rb, ka, comm] = await Promise.all([
    scrapeRubberBoard(),
    scrapeKarnatakaPost().catch(() => null),
    fetchCommoditiesApi().catch(() => null),
  ])

  const kottayam = rb?.kottayam_rss4 ?? 0
  const bangkok  = comm?.bangkokRss3Inr ?? ka?.bangkokRss3 ?? rb?.intl_rss1 ?? 0

  const premiumPct = bangkok > 0 ? Math.round(((kottayam - bangkok) / bangkok) * 1000) / 10 : 0
  // Baseline ~8% is the structural premium reflecting India's normal import
  // dependence; each point above/below that nudges the deficit estimate
  // around its 5.5 L MT midpoint, clamped to the factor's 2-9 L MT range.
  const deficitIndex = Math.max(2, Math.min(9, Math.round((5.5 + (premiumPct - 8) * 0.12) * 10) / 10))
  const deficitReason = `Kottayam-Bangkok premium ${premiumPct}% vs. ~8% structural baseline → India deficit ${direction(premiumPct - 8, { up: 'wider than usual', down: 'narrower than usual', flat: 'in line with baseline' })}`

  let bangkokChangePct = 0
  try {
    const db = getDb()
    if (db && bangkok > 0) {
      const recent = await db.collection('rubber_prices_history')
        .find({ bangkok: { $gt: 0 } })
        .sort({ fetchedAt: -1 })
        .limit(2)
        .toArray()
      const prev = recent[1]?.bangkok
      if (prev) bangkokChangePct = Math.round(((bangkok - prev) / prev) * 1000) / 10
    }
  } catch {
    // history unavailable — treat as flat
  }
  const seasiaIndex = Math.max(1, Math.min(10, Math.round((5.5 + bangkokChangePct * 0.8) * 10) / 10))
  const seasiaReason = `Bangkok RSS3 benchmark ${fmtPct(bangkokChangePct)} day-over-day → SE Asia supply ${direction(bangkokChangePct, { up: 'tightening', down: 'easing', flat: 'flat' })}`

  const result = {
    kottayam,
    bangkok,
    premiumPct,
    deficitIndex,
    deficitReason,
    bangkokChangePct,
    seasiaIndex,
    seasiaReason,
    fetchedAt: new Date().toISOString(),
    source: 'Derived from Rubber Board + Canara Post scrapes',
  }
  cache.data = result
  cache.at = Date.now()
  return result
}
