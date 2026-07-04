import {
  Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from 'recharts'
import type { LiveMarket, ForecastPoint } from '../types'
import { S } from '../styles'
import { ForecastTip } from '../Tooltips'

type Props = {
  activeScenario: string
  setActiveScenario: (s: string) => void
  selectedMonth: number | null
  setSelectedMonth: (m: number | null) => void
  mainMarket: LiveMarket | undefined
  monthlyForecast: ForecastPoint[]
  forecastUpdatedAt: Date | null
}

export function ForecastTab({
  activeScenario, setActiveScenario,
  selectedMonth, setSelectedMonth,
  mainMarket, monthlyForecast, forecastUpdatedAt,
}: Props) {
  const MF = monthlyForecast
  if (!MF.length) return <div style={{ color: '#475569', padding: 20 }}>Loading forecast…</div>

  const peakM   = MF.reduce((a, b) => b.pred > a.pred ? b : a)
  const troughM = MF.reduce((a, b) => b.pred < a.pred ? b : a)
  const avgPred = Math.round(MF.reduce((s, m) => s + m.pred, 0) / MF.length)
  const sel     = selectedMonth !== null ? MF[selectedMonth] : null
  const spot    = mainMarket?.price ?? 270

  const scenarios = [['base', 'Base', '#38bdf8'], ['bull', 'Bull', '#4ade80'], ['bear', 'Bear', '#f87171']] as const

  const yMin = Math.max(200, Math.min(...MF.map(m => m.bear)) - 10)
  const yMax = Math.min(350, Math.max(...MF.map(m => m.bull)) + 10)

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .fc-kpi-grid   { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; margin-bottom: 14px; }
        .fc-macro-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
        .fc-scenario-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; flex-wrap: wrap; gap: 8px; }
        .fc-scenario-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .fc-detail-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .fc-chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
        .fc-data-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #475569; font-family: 'DM Mono', monospace; }
        .fc-data-badge .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; animation: pulse 2s infinite; }
        .fc-data-badge .model-dot { width: 6px; height: 6px; border-radius: 50%; background: #60a5fa; display: inline-block; }
        @media (max-width: 640px) {
          .fc-kpi-grid   { grid-template-columns: repeat(2, 1fr); }
          .fc-macro-grid { grid-template-columns: repeat(2, 1fr); }
          .fc-scenario-row { flex-direction: column; align-items: flex-start; }
          .fc-chart-header { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 400px) {
          .fc-kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .fc-scenario-btns { gap: 6px; }
        }
      `}</style>

      {/* KPIs */}
      <div className="fc-kpi-grid">
        {[
          { label: 'Spot',         val: `₹${spot}`,         sub: 'Live · Kottayam RSS4',  color: '#38bdf8', live: true  },
          { label: '12m peak',     val: `₹${peakM.pred}`,   sub: peakM.month,             color: '#4ade80', live: false },
          { label: '12m trough',   val: `₹${troughM.pred}`, sub: troughM.month,           color: '#f87171', live: false },
          { label: '12m avg base', val: `₹${avgPred}`,      sub: "Jul '26 – Jun '27",     color: '#c084fc', live: false },
        ].map(k => (
          <div key={k.label} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={S.ct}>{k.label}</span>
              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3,
                background: k.live ? '#14532d33' : '#1e3a5f33',
                color: k.live ? '#4ade80' : '#60a5fa',
              }}>
                {k.live ? 'LIVE' : 'MODEL'}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'DM Mono' }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Scenario switcher + last computed */}
      <div className="fc-scenario-row">
        <div className="fc-scenario-btns">
          {scenarios.map(([k, l, c]) => (
            <button key={k} onClick={() => setActiveScenario(k)}
              style={{ padding: '6px 14px', fontSize: 11, fontFamily: 'DM Mono',
                border: `1px solid ${activeScenario === k ? c : '#1a2744'}`,
                background: activeScenario === k ? c + '22' : 'transparent',
                color: activeScenario === k ? c : '#64748b',
                cursor: 'pointer', borderRadius: 6,
              }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6 }} />
              {l} case
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          {forecastUpdatedAt && (
            <span style={{ fontSize: 9, color: '#334155', fontFamily: 'DM Mono' }}>
              forecast computed {forecastUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span className="fc-data-badge">
            <span className="live-dot" /> spot live
            <span style={{ margin: '0 4px', color: '#1a2744' }}>·</span>
            <span className="model-dot" /> Jul–Jun model predictions
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div className="fc-chart-header">
          <div>
            <div style={S.ct}>12-Month RSS4 Forecast — Jul 2026 to Jun 2027 (₹/kg)</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
              Model predictions anchored to live Kottayam RSS4 spot · updates every 1 min
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#475569' }}>
              <span style={{ color: '#38bdf8' }}>━ Base</span>
              <span style={{ color: '#4ade80', opacity: 0.6 }}>╌ Bull</span>
              <span style={{ color: '#f87171', opacity: 0.6 }}>╌ Bear</span>
            </div>
            <div style={{ fontSize: 9, color: '#334155' }}>Click a month for details</div>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={MF} onClick={d => d && setSelectedMonth(MF.findIndex(m => m.month === d.activeLabel))}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#1a2744" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 9, fill: '#475569' }} width={42} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<ForecastTip />} />
              <ReferenceLine y={spot} stroke="#38bdf8" strokeDasharray="4 4"
                label={{ value: `Spot ₹${spot}`, fill: '#38bdf8', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={peakM.pred} stroke="#4ade80" strokeDasharray="3 3"
                label={{ value: `Peak ₹${peakM.pred}`, fill: '#4ade80', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="hi" stroke="transparent" fill="url(#fg)" />
              <Area type="monotone" dataKey="lo" stroke="transparent" fill="#080b10" />
              <Line type="monotone" dataKey="bear" stroke="#f87171"
                strokeWidth={activeScenario === 'bear' ? 2.5 : 1}
                strokeDasharray="4 3" dot={false}
                opacity={activeScenario === 'bear' ? 1 : 0.35} />
              <Line type="monotone" dataKey="bull" stroke="#4ade80"
                strokeWidth={activeScenario === 'bull' ? 2.5 : 1}
                strokeDasharray="4 3" dot={false}
                opacity={activeScenario === 'bull' ? 1 : 0.35} />
              <Line type="monotone" dataKey="pred" stroke="#38bdf8" strokeWidth={2.5}
                dot={{ fill: '#38bdf8', r: 4, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected month detail */}
      {sel && (
        <div style={{ ...S.card, border: '1px solid #1e3a5f', marginBottom: 14, background: '#0b1826' }}>
          <div className="fc-detail-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>{sel.month}</span>
                <span style={{ fontSize: 10, color: '#475569' }}>— {sel.season}</span>
                <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 3, background: '#1e3a5f33', color: '#60a5fa' }}>MODEL</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={S.pill(sel.momentum === 'bullish' ? '#4ade80' : sel.momentum === 'bearish' ? '#f87171' : '#fb923c')}>{sel.momentum.toUpperCase()}</span>
                <span style={S.pill('#94a3b8')}>{sel.supply}</span>
                <span style={S.pill('#c084fc')}>Conf {sel.confidence}%</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#38bdf8', fontFamily: 'DM Mono' }}>
                ₹{sel.pred}<span style={{ fontSize: 12, color: '#475569' }}>/kg</span>
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                ₹{sel.lo} – ₹{sel.hi}
                <span style={{ marginLeft: 8, color: sel.pred >= spot ? '#4ade80' : '#f87171' }}>
                  vs spot {sel.pred >= spot ? '+' : ''}{sel.pred - spot}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ background: '#14532d22', border: '1px solid #14532d44', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Bull catalyst · ₹{sel.bull}
              </div>
              <div style={{ fontSize: 11, color: '#4ade80', lineHeight: 1.6 }}>{sel.catalyst}</div>
            </div>
            <div style={{ background: '#7f1d1d22', border: '1px solid #7f1d1d44', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Bear risk · ₹{sel.bear}
              </div>
              <div style={{ fontSize: 11, color: '#f87171', lineHeight: 1.6 }}>{sel.risk}</div>
            </div>
          </div>

          <div className="fc-macro-grid">
            {[
              { label: 'Brent crude', val: `$${sel.crude}/bbl`, color: '#fb923c', note: 'model est.' },
              { label: 'INR/USD',     val: `₹${sel.inr}/$`,    color: '#38bdf8', note: 'model est.' },
              { label: 'China index', val: `${sel.chinaIdx}/10`,color: '#c084fc', note: 'model est.' },
              { label: 'Confidence',  val: `${sel.confidence}%`,color: sel.confidence >= 70 ? '#4ade80' : sel.confidence >= 60 ? '#fb923c' : '#f87171', note: 'model' },
            ].map(k => (
              <div key={k.label} style={{ textAlign: 'center', padding: '8px', background: '#080b10', borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: k.color, fontFamily: 'DM Mono' }}>{k.val}</div>
                <div style={{ fontSize: 8, color: '#334155', marginTop: 1 }}>{k.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full table */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <div style={S.ct}>Full 12-Month Price Table</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#475569' }}>
            <span className="fc-data-badge">
              <span className="live-dot" /> Spot price is live
            </span>
            <span className="fc-data-badge">
              <span className="model-dot" /> All forecast values are model predictions
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2744' }}>
                {['Month', 'Bear', 'Low', 'Base', 'High', 'Bull', 'vs Spot', 'Conf%', 'Momentum'].map(h => (
                  <th key={h} style={{
                    padding: '7px 9px',
                    textAlign: ['Month', 'Momentum'].includes(h) ? 'left' : 'right',
                    fontSize: 10, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MF.map((m, i) => {
                const mc   = m.momentum === 'bullish' ? '#4ade80' : m.momentum === 'bearish' ? '#f87171' : '#fb923c'
                const diff = m.pred - spot
                return (
                  <tr key={i}
                    onClick={() => setSelectedMonth(i === selectedMonth ? null : i)}
                    style={{
                      borderBottom: '1px solid #1a2744',
                      background: selectedMonth === i ? '#1a2744' : 'transparent',
                      cursor: 'pointer',
                    }}>
                    <td style={{ padding: '7px 9px', color: '#f0f9ff', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.month}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#f87171', fontFamily: 'DM Mono' }}>₹{m.bear}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.lo}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#38bdf8', fontWeight: 700, fontFamily: 'DM Mono' }}>₹{m.pred}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.hi}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#4ade80', fontFamily: 'DM Mono' }}>₹{m.bull}</td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600, color: diff >= 0 ? '#4ade80' : '#f87171' }}>
                      {diff >= 0 ? '+' : ''}{diff}
                    </td>
                    <td style={{ padding: '7px 9px', textAlign: 'right', color: '#c084fc' }}>{m.confidence}%</td>
                    <td style={{ padding: '7px 9px' }}>
                      <span style={S.pill(mc)}>{m.momentum}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#080b10', borderRadius: 6, fontSize: 10, color: '#334155', lineHeight: 1.6 }}>
          ℹ️ All prices shown for Jul 2026–Jun 2027 are <strong style={{ color: '#60a5fa' }}>model-based predictions</strong>, not actual traded prices.
          The Base price updates every minute as the live Kottayam RSS4 spot changes.
          Confidence declines with forecast horizon — near-term months carry higher accuracy.
        </div>
      </div>
    </>
  )
}
