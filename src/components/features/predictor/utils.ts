import type { Factor, DailyPoint, ForecastPoint, PredictionResult } from './types'
import { MONTHLY_FORECAST } from './data'

export function jitter(base: number): number {
  return +(base + (Math.random() - 0.5) * 2.5).toFixed(1)
}

export function generateSpark(base: number): { v: number }[] {
  let v = base - 8
  const d: { v: number }[] = []
  for (let i = 0; i < 20; i++) {
    v = Math.max(base * 0.9, Math.min(base * 1.1, v + (Math.random() - 0.48) * 3))
    d.push({ v: +v.toFixed(1) })
  }
  d.push({ v: base })
  return d
}

export function computePrediction(factors: Factor[]): PredictionResult {
  const f = factors.reduce((acc, s) => ({ ...acc, [s.id]: s.val }), {} as Record<string, number>)
  const base     = 178
  const china    = (f.china    - 5)   * 5.2
  const deficit  = (f.deficit  - 4.5) * 5.8
  const monsoon  = (f.monsoon  - 5)   * 3.8
  const crude    = (f.crude    - 75)  * 0.38
  const seasia   = (f.seasia   - 5)   * 3.2
  const inr      = (f.inr      - 84)  * 0.9
  const shipping = (f.shipping - 5)   * 1.6
  const total    = base + china + deficit + monsoon + crude + seasia + inr + shipping
  const pred     = Math.round(Math.max(90, Math.min(300, total)))
  const spread   = Math.round(pred * 0.065)
  return {
    pred,
    lo: pred - spread,
    hi: pred + spread,
    base,
    contribs: [
      { name: 'China demand',   val: Math.round(china) },
      { name: 'Supply deficit', val: Math.round(deficit) },
      { name: 'Monsoon',        val: Math.round(monsoon) },
      { name: 'Crude oil',      val: Math.round(crude) },
      { name: 'SE Asia supply', val: Math.round(seasia) },
      { name: 'INR/USD',        val: Math.round(inr) },
      { name: 'Shipping',       val: Math.round(shipping) },
    ],
  }
}

export function buildDailyForecast(basePrice: number): DailyPoint[] {
  const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const TREND      = 0.22   // slight upward bias (monsoon season)
  const VOLATILITY = 2.2    // ₹/tick

  // Dynamic BUY/SELL thresholds relative to current spot
  const BUY_THRESHOLD  = Math.round(basePrice * 1.007)   // +0.7% above spot → premium
  const SELL_THRESHOLD = Math.round(basePrice * 0.993)   // -0.7% below spot → weakness
  const FLOOR = Math.round(basePrice * 0.94)
  const CEIL  = Math.round(basePrice * 1.06)

  const days: DailyPoint[] = []
  const start = new Date()    // always today
  let price = basePrice

  for (let i = 0; i < 35; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue  // closed weekends

    const noise      = (Math.random() - 0.5 + TREND * 0.4) * VOLATILITY
    const weekEffect = dow === 1 ? 0.6 : dow === 5 ? -0.4 : 0
    price = Math.round((price + noise + weekEffect) * 10) / 10
    price = Math.max(FLOOR, Math.min(CEIL, price))

    days.push({
      date:    `${DAYS[dow]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
      price:   Math.round(price),
      lo:      Math.round(price * 0.963),
      hi:      Math.round(price * 1.037),
      conf:    Math.round(Math.max(42, 87 - i * 1.5)),
      vol:     Math.round(38 + Math.random() * 50),
      signal:  price > BUY_THRESHOLD ? 'BUY' : price < SELL_THRESHOLD ? 'SELL' : 'HOLD',
      isToday: i === 0,
      dow:     DAYS[dow],
      day:     i,
    })

    if (days.length >= 30) break
  }
  return days
}

// Builds a live-adjusted 12-month forward forecast by scaling MONTHLY_FORECAST
// from its anchor price to the current real spot price.
export function buildMonthlyForecast(spotPrice: number): ForecastPoint[] {
  const ANCHOR = 270  // the spot price when MONTHLY_FORECAST was last calibrated
  const delta  = spotPrice - ANCHOR   // how much the spot has moved

  // Seasonal weight: full delta impact in first 3 months, fading out over 12 months
  return MONTHLY_FORECAST.map((m, i) => {
    const weight = Math.max(0, 1 - i * 0.07)   // 100% → 30% fade over 12 months
    const adj    = Math.round(delta * weight)
    return {
      ...m,
      pred: Math.max(200, m.pred + adj),
      lo:   Math.max(185, m.lo   + adj),
      hi:   Math.max(215, m.hi   + adj),
      bull: Math.max(210, m.bull + adj),
      bear: Math.max(190, m.bear + adj),
    }
  })
}
