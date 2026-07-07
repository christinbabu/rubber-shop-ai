export type FactorId =
  | 'tireDemand'
  | 'china'
  | 'deficit'
  | 'monsoon'
  | 'seasia'
  | 'exchangeStock'
  | 'syntheticRubber'
  | 'crude'
  | 'govPolicy'
  | 'producerFx'
  | 'laborDisruption'
  | 'autoSales'
  | 'inr'
  | 'shipping'
  | 'speculation'

// Per-factor metadata for factors currently synced from a live feed, keyed by
// FactorId — lets any screen render a generic "● Live — source · time" badge.
export type LiveFactorMeta = Partial<Record<FactorId, { source: string; updatedAt: Date }>>

export type TyreStock = {
  symbol: string
  name: string
  price: number | null
  changePct: number | null
  currency: string
}

export type Factor = {
  id: FactorId
  label: string
  min: number
  max: number
  unit: string
  weight: number
  icon: string
  step?: number
  val: number
  /** True when `val` is kept in sync from a real external feed (see App.tsx's
   *  live-data effect); otherwise it's an operator-adjustable manual estimate. */
  live?: boolean
}

// All 15 factors' weights sum to 1.00. Convention throughout: a higher `val`
// (relative to its own midpoint) always means more bullish / price-supportive,
// so `fundamentalDriftPct` (priceTiming.ts) can combine any subset generically.
export const FACTORS: Factor[] = [
  { id: 'tireDemand',      label: 'Tire industry demand',        min: 1,   max: 10,  unit: '/10',    weight: 0.16,  icon: '🚗', val: 7,    live: true },
  { id: 'china',           label: 'China demand',                min: 1,   max: 10,  unit: '/10',    weight: 0.13,  icon: '🇨🇳', val: 7 },
  { id: 'deficit',         label: 'India deficit (L MT)',        min: 2,   max: 9,   unit: ' L MT',  weight: 0.12,  icon: '📦', step: 0.5, val: 5.5 },
  { id: 'monsoon',         label: 'Monsoon disruption',           min: 1,   max: 10,  unit: '/10',    weight: 0.10,  icon: '🌧️', val: 6 },
  { id: 'seasia',          label: 'SE Asia supply',               min: 1,   max: 10,  unit: '/10',    weight: 0.08,  icon: '🌏', val: 6 },
  { id: 'exchangeStock',   label: 'Exchange stock scarcity',      min: 1,   max: 10,  unit: '/10',    weight: 0.08,  icon: '🏬', val: 6 },
  { id: 'syntheticRubber', label: 'Synthetic rubber (SBR) price', min: 1.2, max: 2.2, unit: ' $/kg',  weight: 0.07,  icon: '🧪', step: 0.05, val: 1.75 },
  { id: 'crude',           label: 'Brent crude',                  min: 55,  max: 115, unit: ' $/bbl', weight: 0.06,  icon: '🛢️', val: 82,   live: true },
  { id: 'govPolicy',       label: 'Export policy tightness',      min: 1,   max: 10,  unit: '/10',    weight: 0.05,  icon: '📜', val: 6 },
  { id: 'producerFx',      label: 'Producer currency strength',   min: 1,   max: 10,  unit: '/10',    weight: 0.04,  icon: '💴', val: 5,    live: true },
  { id: 'laborDisruption', label: 'Labor / tapping disruption',   min: 1,   max: 10,  unit: '/10',    weight: 0.04,  icon: '⛏️', val: 5 },
  { id: 'autoSales',       label: 'Global auto sales & EV mix',   min: 1,   max: 10,  unit: '/10',    weight: 0.03,  icon: '🚙', val: 6 },
  { id: 'inr',             label: 'INR/USD rate',                 min: 80,  max: 93,  unit: ' ₹/$',   weight: 0.02,  icon: '💱', val: 84.5, live: true },
  { id: 'shipping',        label: 'Shipping index',                min: 1,   max: 10,  unit: '/10',    weight: 0.015, icon: '🚢', val: 6 },
  { id: 'speculation',     label: 'Futures speculative positioning', min: 1, max: 10,  unit: '/10',    weight: 0.005, icon: '📈', val: 5 },
]

export function computePrediction(factors: Factor[]) {
  const f = factors.reduce((acc, s) => ({ ...acc, [s.id]: s.val }), {} as Record<FactorId, number>)
  const base = 178

  const tireDemand      = (f.tireDemand - 5)       * 3.7
  const china           = (f.china - 5)            * 3.0
  const deficit         = (f.deficit - 4.5)        * 3.6
  const monsoon         = (f.monsoon - 5)          * 2.3
  const seasia          = (f.seasia - 5)           * 1.85
  const exchangeStock   = (f.exchangeStock - 5)    * 1.85
  const syntheticRubber = (f.syntheticRubber - 1.7) * 14.5
  const crude           = (f.crude - 75)           * 0.21
  const govPolicy       = (f.govPolicy - 5)        * 1.15
  const producerFx      = (f.producerFx - 5)       * 0.92
  const laborDisruption = (f.laborDisruption - 5)  * 0.92
  const autoSales       = (f.autoSales - 5)        * 0.69
  const inr             = (f.inr - 84)              * 0.32
  const shipping        = (f.shipping - 5)         * 0.35
  const speculation     = (f.speculation - 5)      * 0.12

  const total = base + tireDemand + china + deficit + monsoon + seasia + exchangeStock +
    syntheticRubber + crude + govPolicy + producerFx + laborDisruption + autoSales + inr +
    shipping + speculation
  const pred = Math.round(Math.max(90, Math.min(300, total)))
  const spread = Math.round(pred * 0.065)

  return {
    pred,
    lo: pred - spread,
    hi: pred + spread,
    contribs: [
      { id: 'tireDemand' as FactorId,      name: 'Tire demand',       val: Math.round(tireDemand) },
      { id: 'china' as FactorId,           name: 'China demand',      val: Math.round(china) },
      { id: 'deficit' as FactorId,         name: 'Supply deficit',    val: Math.round(deficit) },
      { id: 'monsoon' as FactorId,         name: 'Monsoon',           val: Math.round(monsoon) },
      { id: 'seasia' as FactorId,          name: 'SE Asia supply',    val: Math.round(seasia) },
      { id: 'exchangeStock' as FactorId,   name: 'Exchange stocks',   val: Math.round(exchangeStock) },
      { id: 'syntheticRubber' as FactorId, name: 'Synthetic rubber',  val: Math.round(syntheticRubber) },
      { id: 'crude' as FactorId,           name: 'Crude oil',         val: Math.round(crude) },
      { id: 'govPolicy' as FactorId,       name: 'Export policy',     val: Math.round(govPolicy) },
      { id: 'producerFx' as FactorId,      name: 'Producer FX',       val: Math.round(producerFx) },
      { id: 'laborDisruption' as FactorId, name: 'Labor disruption',  val: Math.round(laborDisruption) },
      { id: 'autoSales' as FactorId,       name: 'Auto/EV sales',     val: Math.round(autoSales) },
      { id: 'inr' as FactorId,             name: 'INR/USD',           val: Math.round(inr) },
      { id: 'shipping' as FactorId,        name: 'Shipping',          val: Math.round(shipping) },
      { id: 'speculation' as FactorId,     name: 'Speculation',       val: Math.round(speculation) },
    ],
  }
}
