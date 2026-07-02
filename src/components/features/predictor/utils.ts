import type { Factor, DailyPoint, PredictionResult } from './types'

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
  const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const TREND    = 0.18
  const VOLATILITY = 1.8

  const days: DailyPoint[] = []
  const start = new Date(2026, 4, 30)
  let price = basePrice

  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()
    if (dow === 0) continue // closed Sundays

    const noise      = (Math.random() - 0.5 + TREND * 0.5) * VOLATILITY
    const weekEffect = dow === 1 ? 0.5 : dow === 5 ? -0.3 : 0
    price = Math.round((price + noise + weekEffect) * 10) / 10
    price = Math.max(238, Math.min(265, price))

    days.push({
      date:    `${DAYS[dow]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
      price:   Math.round(price),
      lo:      Math.round(price * 0.964),
      hi:      Math.round(price * 1.036),
      conf:    Math.round(Math.max(45, 85 - i * 1.3)),
      vol:     Math.round(40 + Math.random() * 45),
      signal:  price > 252 ? 'BUY' : price < 242 ? 'SELL' : 'HOLD',
      isToday: i === 0,
      dow:     DAYS[dow],
      day:     i,
    })
  }
  return days
}
