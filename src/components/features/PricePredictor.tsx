import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
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
} from 'recharts'
import type { Factor } from '../../utils/marketFactors'
import { computePrediction } from '../../utils/marketFactors'
import { buildMonthPredictions } from '../../utils/priceTiming'
import type { DayPrediction } from '../../utils/priceTiming'

const API = 'http://localhost:4000'
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const SIGNAL_COLOR: Record<DayPrediction['signal'], string> = {
  BUY: '#4ade80',
  SELL: '#f87171',
  HOLD: '#fb923c',
}

const SIGNAL_EXPLAIN: Record<DayPrediction['signal'], string> = {
  SELL: 'Model expects price above today’s spot by more than 0.7% — a favourable day to sell to dealers.',
  BUY:  'Model expects price below today’s spot by more than 0.7% — a favourable day to buy from farmers.',
  HOLD: 'Price expected close to today’s spot — no strong signal either way.',
}

const DayTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null
  const d: DayPrediction = payload[0].payload
  return (
    <div style={{ background: '#0d1520', border: '1px solid #1a2744', padding: 10, borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      <div>Predicted: ₹{d.predictedPrice}/kg</div>
      <div style={{ color: '#94a3b8' }}>Range: ₹{d.lo}–₹{d.hi}</div>
      <div style={{ color: SIGNAL_COLOR[d.signal], fontWeight: 600, marginTop: 4 }}>{d.signal}</div>
    </div>
  )
}

type PricePredictorProps = {
  factors: Factor[]
  spotPrice: number | null
  spotUpdatedAt: Date | null
}

export function PricePredictor({ factors, spotPrice, spotUpdatedAt }: PricePredictorProps) {
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [actualsByDate, setActualsByDate] = useState<Record<string, number>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchHistory() {
      try {
        const resp = await fetch(`${API}/api/price-history?days=365`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!json.success || cancelled) return
        const map: Record<string, number> = {}
        for (const r of json.records) {
          if (r.kottayam == null) continue
          const d = new Date(r.date)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          map[key] = r.kottayam
        }
        setActualsByDate(map)
      } catch {
        // no history available — past days will show model estimate only
      }
    }
    fetchHistory()
  }, [])

  const spot = spotPrice ?? 0
  const days = useMemo(
    () => buildMonthPredictions(viewYear, viewMonth, spot, today, factors, actualsByDate),
    [viewYear, viewMonth, spot, today, factors, actualsByDate]
  )

  const selected = days.find((d) => d.dateKey === selectedKey) ?? days.find((d) => d.isToday) ?? days[0]

  const upcoming = days.filter((d) => !d.isPast)
  const bestSellDay = upcoming.length ? upcoming.reduce((a, b) => b.predictedPrice > a.predictedPrice ? b : a) : null
  const bestBuyDay  = upcoming.length ? upcoming.reduce((a, b) => b.predictedPrice < a.predictedPrice ? b : a) : null
  const sellDaysCount = upcoming.filter((d) => d.signal === 'SELL').length
  const buyDaysCount  = upcoming.filter((d) => d.signal === 'BUY').length

  const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay()

  const contribs = computePrediction(factors).contribs
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelectedKey(null)
  }

  return (
    <div className="card">
      <h2>Price Predictor — When to Sell</h2>
      <p>Daily buy/sell timing signals for RSS4 Kottayam, built from today's real spot price, known monsoon seasonality, and the live market factors.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Today's spot (Kottayam)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{spotPrice ? `₹${spotPrice}/kg` : 'Unavailable'}</div>
          {spotUpdatedAt && <div style={{ fontSize: 10, color: '#4ade80', marginTop: 4 }}>● Live · {spotUpdatedAt.toLocaleTimeString()}</div>}
        </div>
        <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Best day to sell {isCurrentMonth ? '(from today)' : 'this month'}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4ade80' }}>{bestSellDay ? `₹${bestSellDay.predictedPrice}/kg` : '—'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{bestSellDay ? bestSellDay.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No upcoming days in view'}</div>
        </div>
        <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Best day to buy {isCurrentMonth ? '(from today)' : 'this month'}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>{bestBuyDay ? `₹${bestBuyDay.predictedPrice}/kg` : '—'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{bestBuyDay ? bestBuyDay.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No upcoming days in view'}</div>
        </div>
        <div style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Signals remaining this view</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <span style={{ color: '#4ade80' }}>{sellDaysCount} SELL</span>{' · '}
            <span style={{ color: '#f87171' }}>{buyDaysCount} BUY</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => goMonth(-1)} style={navBtnStyle}>‹ Prev</button>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f9ff' }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
          <button onClick={() => goMonth(1)} style={navBtnStyle}>Next ›</button>
        </div>
        {!isCurrentMonth && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedKey(null) }} style={{ ...navBtnStyle, fontSize: 11 }}>
              Jump to current month
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DOW.map((d) => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#475569' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
          {days.map((d) => {
            const hasActual = d.actualPrice != null && !d.isToday
            const displayPrice = hasActual ? d.actualPrice! : d.predictedPrice
            return (
              <button
                key={d.dateKey}
                onClick={() => setSelectedKey(d.dateKey)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 2px', minHeight: 56, borderRadius: 8, cursor: 'pointer',
                  background: d.isToday ? '#123049' : selectedKey === d.dateKey ? '#1a2744' : '#0b1621',
                  border: d.isToday ? '1px solid #38bdf8' : '1px solid #1a2744',
                }}
              >
                <span style={{ fontSize: 10, color: '#64748b' }}>{d.date.getDate()}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f9ff' }}>₹{displayPrice}</span>
                {!hasActual && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: SIGNAL_COLOR[d.signal], marginTop: 2 }} />
                )}
                {hasActual && <span style={{ fontSize: 8, color: '#4ade80', marginTop: 2 }}>recorded</span>}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 10, color: '#94a3b8', justifyContent: 'center' }}>
          <span>🟢 SELL day</span><span>🔴 BUY day</span><span>🟠 HOLD</span><span>Grey text = recorded actual price</span>
        </div>
      </div>

      {selected && (
        <div style={{ padding: '1rem', background: '#08111b', border: `1px solid ${SIGNAL_COLOR[selected.signal]}55`, borderRadius: 10, marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{selected.isToday ? ' (today)' : ''}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0f9ff', marginTop: 4 }}>
                ₹{selected.actualPrice != null && !selected.isToday ? selected.actualPrice : selected.predictedPrice}/kg
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}> {selected.actualPrice != null && !selected.isToday ? '(recorded)' : `(range ₹${selected.lo}–₹${selected.hi})`}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#08111b', background: SIGNAL_COLOR[selected.signal] }}>{selected.signal}</span>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Confidence: {selected.confidence}%</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, lineHeight: 1.6 }}>{SIGNAL_EXPLAIN[selected.signal]}</div>
        </div>
      )}

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: 12 }}>{MONTH_NAMES[viewMonth]} price path</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={days}>
              <defs>
                <linearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
              <XAxis dataKey={(d: DayPrediction) => d.date.getDate()} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} width={44} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<DayTooltip />} />
              {spotPrice && <ReferenceLine y={spotPrice} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: `Spot ₹${spotPrice}`, fill: '#38bdf8', fontSize: 9 }} />}
              <Area type="monotone" dataKey="hi" stroke="transparent" fill="url(#ppGrad)" />
              <Area type="monotone" dataKey="lo" stroke="transparent" fill="#080b10" />
              <Line
                type="monotone"
                dataKey="predictedPrice"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={(props: any) => {
                  const d: DayPrediction = props.payload
                  return <circle key={props.cx} cx={props.cx} cy={props.cy} r={d.isToday ? 6 : 3} fill={SIGNAL_COLOR[d.signal]} stroke="#0d1520" strokeWidth={1.5} />
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
        <h3 style={{ marginBottom: 10 }}>How rubber price is determined</h3>
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
          <p style={{ marginBottom: 8 }}>
            The Kottayam RSS4 benchmark — the price Kerala/Karnataka farmers are paid and dealers quote off — moves with 15 real forces:
          </p>
          <ul style={{ paddingLeft: 18, marginBottom: 8, display: 'grid', gap: 6 }}>
            <li><strong style={{ color: '#f0f9ff' }}>Tire industry demand</strong> — tires consume roughly 70% of world natural rubber; manufacturer restocking/destocking cycles are the single biggest demand swing factor.</li>
            <li><strong style={{ color: '#f0f9ff' }}>China demand</strong> — China consumes the largest share of world natural rubber. Stronger Chinese industrial and tyre output pulls more rubber out of the market.</li>
            <li><strong style={{ color: '#f0f9ff' }}>India's supply deficit</strong> — India consumes far more rubber than it produces; the wider that gap, the more the domestic price depends on costlier imports.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Monsoon seasonality</strong> — SW monsoon (Jun–Sep) halts tapping in Kerala/Karnataka; supply tightens and prices historically firm, peaking around August. Tapping resumes and supply recovers Oct–Dec, easing prices into year-end.</li>
            <li><strong style={{ color: '#f0f9ff' }}>SE Asia supply</strong> — Thailand, Indonesia and Malaysia produce most of the world's natural rubber; weather or output disruptions there move the international (Bangkok) benchmark that Kottayam tracks.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Exchange stock scarcity</strong> — SICOM/SHFE warehouse inventory drawdowns signal tightness before it shows up in spot price.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Synthetic rubber (SBR) price</strong> — natural and synthetic rubber are substitutes; expensive SBR (crude-derived) pushes tyre makers toward natural rubber.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Brent crude oil</strong> — a direct input cost for synthetic rubber and shipping fuel.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Export policy tightness</strong> — Thailand/Indonesia/Vietnam's ITRC bloc controls ~65% of world supply; export quotas or tariffs there tighten global availability.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Producer currency strength</strong> — a stronger Thai baht/Indonesian rupiah/Vietnamese dong makes SE Asian exports costlier, supporting the global price.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Labor / tapping disruption</strong> — strikes, leaf disease outbreaks, or tree-replanting cycles beyond the monsoon reduce output.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Global auto sales & EV mix</strong> — overall vehicle production volume drives aggregate tire demand.</li>
            <li><strong style={{ color: '#f0f9ff' }}>INR/USD rate</strong> and <strong style={{ color: '#f0f9ff' }}>shipping cost</strong> — a weaker rupee or costlier freight makes imported rubber pricier in INR terms, supporting the domestic price.</li>
            <li><strong style={{ color: '#f0f9ff' }}>Futures speculative positioning</strong> — net-long positioning on TOCOM/SHFE rubber futures can move spot prices independent of physical fundamentals.</li>
          </ul>
          <p>
            This screen's daily forecast = today's real spot price, adjusted by the seasonal monsoon curve for the selected date and the current weighted pull of the 14 non-seasonal factors below (also shown live on the Market Factors screen).
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 12 }}>
          {contribs.filter((c) => c.id !== 'monsoon').map((c) => (
            <div key={c.id} style={{ background: '#0b1621', border: '1px solid #1a2744', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>{c.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.val >= 0 ? '#4ade80' : '#f87171' }}>{c.val >= 0 ? '+' : ''}₹{c.val}/kg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const navBtnStyle: CSSProperties = {
  background: '#0b1621',
  border: '1px solid #1a2744',
  color: '#e2e8f0',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 13,
  cursor: 'pointer',
}
