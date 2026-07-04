export type FactorId = 'china' | 'deficit' | 'monsoon' | 'crude' | 'seasia' | 'inr' | 'shipping'

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
}

export const FACTORS: Factor[] = [
  { id: 'china', label: 'China demand', min: 1, max: 10, unit: '/10', weight: 0.22, icon: '🇨🇳', val: 7 },
  { id: 'deficit', label: 'India deficit (L MT)', min: 2, max: 9, unit: ' L MT', weight: 0.20, icon: '📦', step: 0.5, val: 5.5 },
  { id: 'monsoon', label: 'Monsoon disruption', min: 1, max: 10, unit: '/10', weight: 0.16, icon: '🌧️', val: 6 },
  { id: 'crude', label: 'Brent crude', min: 55, max: 115, unit: ' $/bbl', weight: 0.14, icon: '🛢️', val: 82 },
  { id: 'seasia', label: 'SE Asia supply', min: 1, max: 10, unit: '/10', weight: 0.12, icon: '🌏', val: 6 },
  { id: 'inr', label: 'INR/USD rate', min: 80, max: 93, unit: ' ₹/$', weight: 0.09, icon: '💱', val: 84.5 },
  { id: 'shipping', label: 'Shipping index', min: 1, max: 10, unit: '/10', weight: 0.07, icon: '🚢', val: 6 },
]

export function computePrediction(factors: Factor[]) {
  const f = factors.reduce((acc, s) => ({ ...acc, [s.id]: s.val }), {} as Record<FactorId, number>)
  const base = 178
  const china = (f.china - 5) * 5.2
  const deficit = (f.deficit - 4.5) * 5.8
  const monsoon = (f.monsoon - 5) * 3.8
  const crude = (f.crude - 75) * 0.38
  const seasia = (f.seasia - 5) * 3.2
  const inr = (f.inr - 84) * 0.9
  const shipping = (f.shipping - 5) * 1.6
  const total = base + china + deficit + monsoon + crude + seasia + inr + shipping
  const pred = Math.round(Math.max(90, Math.min(300, total)))
  const spread = Math.round(pred * 0.065)
  return {
    pred,
    lo: pred - spread,
    hi: pred + spread,
    contribs: [
      { id: 'china' as FactorId,    name: 'China demand',   val: Math.round(china) },
      { id: 'deficit' as FactorId,  name: 'Supply deficit', val: Math.round(deficit) },
      { id: 'monsoon' as FactorId,  name: 'Monsoon',        val: Math.round(monsoon) },
      { id: 'crude' as FactorId,    name: 'Crude oil',      val: Math.round(crude) },
      { id: 'seasia' as FactorId,   name: 'SE Asia supply', val: Math.round(seasia) },
      { id: 'inr' as FactorId,      name: 'INR/USD',        val: Math.round(inr) },
      { id: 'shipping' as FactorId, name: 'Shipping',       val: Math.round(shipping) },
    ],
  }
}
