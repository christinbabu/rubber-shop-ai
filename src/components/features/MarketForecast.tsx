import { useState, useMemo, useEffect } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart,
  Line as SparkLine,
} from 'recharts'

type FactorId = 'china' | 'deficit' | 'monsoon' | 'crude' | 'seasia' | 'inr' | 'shipping'

type Factor = {
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

type ForecastPoint = {
  month: string
  pred: number
  lo: number
  hi: number
  bull: number
  bear: number
  season: string
  momentum: string
  confidence: number
  catalyst: string
  risk: string
  supply: string
}

const MONTHLY_FORECAST: ForecastPoint[] = [
  { month: "Jun '26", pred: 248, lo: 232, hi: 264, bull: 268, bear: 228, season: 'Pre-monsoon', momentum: 'bullish', confidence: 72, catalyst: 'Tapping constraints pre-monsoon. China pre-quarter stockpiling.', risk: 'Ivory Coast peak harvest adds supply.', supply: 'Tight' },
  { month: "Jul '26", pred: 255, lo: 237, hi: 273, bull: 278, bear: 232, season: 'SW Monsoon Peak', momentum: 'bullish', confidence: 78, catalyst: 'Southwest monsoon disrupts Kerala tapping. Production falls 25-30%.', risk: 'SE Asia normal season. China slowdown risk.', supply: 'Very Tight' },
  { month: "Aug '26", pred: 260, lo: 241, hi: 279, bull: 285, bear: 235, season: 'Monsoon / ATH', momentum: 'bullish', confidence: 74, catalyst: 'Peak disruption month. Historical seasonal high. Deficit 6L MT annualized.', risk: 'Normal monsoon would ease faster.', supply: 'Very Tight' },
  { month: "Sep '26", pred: 257, lo: 238, hi: 276, bull: 280, bear: 232, season: 'Late Monsoon', momentum: 'neutral', confidence: 70, catalyst: 'Tapping resumes mid-Sep. Auto sector strong.', risk: 'Early resumption of tapping. BDI softening.', supply: 'Tight' },
  { month: "Oct '26", pred: 250, lo: 233, hi: 267, bull: 272, bear: 228, season: 'Post-Monsoon', momentum: 'neutral', confidence: 68, catalyst: 'Supply recovery begins. Tyre OEM season. Diwali demand boost.', risk: 'SE Asia harvest recovery adds global supply.', supply: 'Balanced' },
  { month: "Nov '26", pred: 244, lo: 227, hi: 261, bull: 265, bear: 222, season: 'Post-Harvest Dip', momentum: 'bearish', confidence: 65, catalyst: 'Full harvest in progress. Seasonal supply peak.', risk: 'Demand slowdown in Chinese construction.', supply: 'Ample' },
  { month: "Dec '26", pred: 240, lo: 223, hi: 257, bull: 262, bear: 218, season: 'Year-End', momentum: 'bearish', confidence: 63, catalyst: 'Pre-wintering inventory build begins. Q4 tyre demand stable.', risk: 'Inventory overhang from bumper harvest.', supply: 'Ample' },
]

const FACTORS: Factor[] = [
  { id: 'china', label: 'China demand', min: 1, max: 10, unit: '/10', weight: 0.22, icon: '🇨🇳', val: 7 },
  { id: 'deficit', label: 'India deficit (L MT)', min: 2, max: 9, unit: ' L MT', weight: 0.20, icon: '📦', step: 0.5, val: 5.5 },
  { id: 'monsoon', label: 'Monsoon disruption', min: 1, max: 10, unit: '/10', weight: 0.16, icon: '🌧️', val: 6 },
  { id: 'crude', label: 'Brent crude', min: 55, max: 115, unit: ' $/bbl', weight: 0.14, icon: '🛢️', val: 82 },
  { id: 'seasia', label: 'SE Asia supply', min: 1, max: 10, unit: '/10', weight: 0.12, icon: '🌏', val: 6 },
  { id: 'inr', label: 'INR/USD rate', min: 80, max: 93, unit: ' ₹/$', weight: 0.09, icon: '💱', val: 84.5 },
  { id: 'shipping', label: 'Shipping index', min: 1, max: 10, unit: '/10', weight: 0.07, icon: '🚢', val: 6 },
]

function computePrediction(factors: Factor[]) {
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
      { name: 'China demand', val: Math.round(china) },
      { name: 'Supply deficit', val: Math.round(deficit) },
      { name: 'Monsoon', val: Math.round(monsoon) },
      { name: 'Crude oil', val: Math.round(crude) },
      { name: 'SE Asia supply', val: Math.round(seasia) },
      { name: 'INR/USD', val: Math.round(inr) },
      { name: 'Shipping', val: Math.round(shipping) },
    ],
  }
}

const ForecastTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div style={{ background: '#0d1520', border: '1px solid #1a2744', padding: 10, borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <div style={{ color: '#94a3b8' }}>Base</div><div style={{ color: '#38bdf8' }}>₹{point.pred}/kg</div>
        <div style={{ color: '#94a3b8' }}>Low</div><div style={{ color: '#f87171' }}>₹{point.lo}/kg</div>
        <div style={{ color: '#94a3b8' }}>High</div><div style={{ color: '#4ade80' }}>₹{point.hi}/kg</div>
        <div style={{ color: '#94a3b8' }}>Confidence</div><div style={{ color: '#c084fc' }}>{point.confidence}%</div>
      </div>
    </div>
  )
}

export function MarketForecast() {
  const [factors, setFactors] = useState<Factor[]>(FACTORS)
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHLY_FORECAST[0].month)
  const result = useMemo(() => computePrediction(factors), [factors])
  const selected = MONTHLY_FORECAST.find((item) => item.month === selectedMonth) ?? MONTHLY_FORECAST[0]

  return (
    <div className="card">
      <h2>Market Forecast & Prediction</h2>
      <p>Use the factor sliders to adjust the model and see the projected RSS4 price range for the next 12 months.</p>

      <div className="grid grid--2" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Model forecast</h3>
          <div className="grid grid--2" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
            {[
              { label: 'Predicted', value: `₹${result.pred}/kg`, color: '#38bdf8' },
              { label: 'Range', value: `₹${result.lo} — ₹${result.hi}`, color: '#60a5fa' },
              { label: 'Confidence', value: `${selected.confidence}%`, color: '#c084fc' },
              { label: 'Momentum', value: selected.momentum, color: selected.momentum === 'bullish' ? '#4ade80' : selected.momentum === 'bearish' ? '#f87171' : '#fb923c' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3>Monthly highlight</h3>
          <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
            <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Selected month</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f9ff', marginTop: 4 }}>{selected.month}</div>
            </div>
            <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Season</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>{selected.season}</div>
            </div>
            <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Trend</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selected.momentum === 'bullish' ? '#4ade80' : selected.momentum === 'bearish' ? '#f87171' : '#fb923c', marginTop: 4 }}>{selected.momentum}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Forecast chart</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f9ff' }}>Jun ’26 – Dec ’26</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Range band shown</div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MONTHLY_FORECAST}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `₹${value}`} width={52} />
                <Tooltip content={<ForecastTooltip />} />
                <ReferenceLine y={245} stroke="#38bdf8" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="hi" stroke="transparent" fill="url(#forecastGrad)" />
                <Area type="monotone" dataKey="lo" stroke="transparent" fill="#080b10" />
                <Line type="monotone" dataKey="pred" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }} />
                <Line type="monotone" dataKey="bull" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="bear" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
            <h3 style={{ marginBottom: 12 }}>Scenario drivers</h3>
            {FACTORS.map((factor) => (
              <div key={factor.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  <span>{factor.icon} {factor.label}</span>
                  <span>{factor.val}{factor.unit}</span>
                </div>
                <input
                  type="range"
                  min={factor.min}
                  max={factor.max}
                  step={factor.step ?? 1}
                  value={factor.val}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setFactors((current) => current.map((item) => item.id === factor.id ? { ...item, val: value } : item))
                  }}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 3 }}>
                  <span>{factor.min}{factor.unit}</span>
                  <span>{factor.max}{factor.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
            <h3 style={{ marginBottom: 12 }}>Selected month details</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Choose month</label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #1a2744', background: '#0b1621', color: '#e2e8f0' }}
              >
                {MONTHLY_FORECAST.map((item) => (
                  <option key={item.month} value={item.month}>{item.month}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: 'Forecast', value: `₹${selected.pred}/kg`, color: '#38bdf8' },
                { label: 'Low', value: `₹${selected.lo}/kg`, color: '#f87171' },
                { label: 'High', value: `₹${selected.hi}/kg`, color: '#4ade80' },
                { label: 'Supply', value: selected.supply, color: '#c084fc' },
                { label: 'Catalyst', value: selected.catalyst, color: '#94a3b8' },
                { label: 'Risk', value: selected.risk, color: '#94a3b8' },
              ].map((block) => (
                <div key={block.label} style={{ background: '#0b1621', border: '1px solid #1a2744', borderRadius: 10, padding: '0.9rem' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{block.label}</div>
                  <div style={{ fontSize: 13, color: block.color, fontWeight: 700, lineHeight: 1.5 }}>{block.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
