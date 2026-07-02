import {
  Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from 'recharts'
import type { LiveMarket } from '../types'
import { MONTHLY_FORECAST } from '../data'
import { S } from '../styles'
import { ForecastTip } from '../Tooltips'

type Props = {
  activeScenario: string
  setActiveScenario: (s: string) => void
  selectedMonth: number | null
  setSelectedMonth: (m: number | null) => void
  mainMarket: LiveMarket | undefined
}

export function ForecastTab({ activeScenario, setActiveScenario, selectedMonth, setSelectedMonth, mainMarket }: Props) {
  const peakM   = MONTHLY_FORECAST.reduce((a, b) => b.pred > a.pred ? b : a)
  const troughM = MONTHLY_FORECAST.reduce((a, b) => b.pred < a.pred ? b : a)
  const avgPred = Math.round(MONTHLY_FORECAST.reduce((s, m) => s + m.pred, 0) / MONTHLY_FORECAST.length)
  const sel     = selectedMonth !== null ? MONTHLY_FORECAST[selectedMonth] : null

  const scenarios = [['base', 'Base', '#38bdf8'], ['bull', 'Bull', '#4ade80'], ['bear', 'Bear', '#f87171']] as const

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 14 }}>
        {[
          { label: 'Spot',         val: `₹${mainMarket?.price}`, sub: 'Today · Kottayam RSS4', color: '#38bdf8' },
          { label: '12m peak',     val: `₹${peakM.pred}`,        sub: peakM.month,             color: '#4ade80' },
          { label: '12m trough',   val: `₹${troughM.pred}`,      sub: troughM.month,           color: '#f87171' },
          { label: '12m avg base', val: `₹${avgPred}`,           sub: "Jun '26 – May '27",     color: '#c084fc' },
        ].map(k => (
          <div key={k.label} style={S.card}>
            <div style={S.ct}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'DM Mono' }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Scenario switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 11 }}>
        {scenarios.map(([k, l, c]) => (
          <button key={k} onClick={() => setActiveScenario(k)}
            style={{ padding: '6px 14px', fontSize: 11, fontFamily: 'DM Mono', border: `1px solid ${activeScenario === k ? c : '#1a2744'}`, background: activeScenario === k ? c + '22' : 'transparent', color: activeScenario === k ? c : '#64748b', cursor: 'pointer', borderRadius: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6 }} />
            {l} case
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={S.ct}>12-Month RSS4 Forecast — Jun 2026 to May 2027 (₹/kg)</div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={MONTHLY_FORECAST} onClick={d => d && setSelectedMonth(MONTHLY_FORECAST.findIndex(m => m.month === d.activeLabel))}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#1a2744" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis domain={[210, 295]} tick={{ fontSize: 10, fill: '#475569' }} width={44} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<ForecastTip />} />
              <ReferenceLine y={270} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'Spot ₹270', fill: '#38bdf8', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={260} stroke="#4ade80" strokeDasharray="3 3" label={{ value: '₹260', fill: '#4ade80', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="hi" stroke="transparent" fill="url(#fg)" />
              <Area type="monotone" dataKey="lo" stroke="transparent" fill="#080b10" />
              <Line type="monotone" dataKey="bear" stroke="#f87171" strokeWidth={activeScenario === 'bear' ? 2.5 : 1} strokeDasharray="4 3" dot={false} opacity={activeScenario === 'bear' ? 1 : 0.35} />
              <Line type="monotone" dataKey="bull" stroke="#4ade80" strokeWidth={activeScenario === 'bull' ? 2.5 : 1} strokeDasharray="4 3" dot={false} opacity={activeScenario === 'bull' ? 1 : 0.35} />
              <Line type="monotone" dataKey="pred" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected month detail */}
      {sel && (
        <div style={{ ...S.card, border: '1px solid #1e3a5f', marginBottom: 14, background: '#0b1826' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff', marginBottom: 6 }}>{sel.month} — {sel.season}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={S.pill(sel.momentum === 'bullish' ? '#4ade80' : sel.momentum === 'bearish' ? '#f87171' : '#fb923c')}>{sel.momentum.toUpperCase()}</span>
                <span style={S.pill('#94a3b8')}>{sel.supply}</span>
                <span style={S.pill('#c084fc')}>Conf {sel.confidence}%</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#38bdf8', fontFamily: 'DM Mono' }}>₹{sel.pred}<span style={{ fontSize: 13, color: '#475569' }}>/kg</span></div>
              <div style={{ fontSize: 11, color: '#475569' }}>₹{sel.lo} – ₹{sel.hi}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ background: '#14532d22', border: '1px solid #14532d44', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Bull catalyst · ₹{sel.bull}</div>
              <div style={{ fontSize: 11, color: '#4ade80', lineHeight: 1.6 }}>{sel.catalyst}</div>
            </div>
            <div style={{ background: '#7f1d1d22', border: '1px solid #7f1d1d44', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Bear risk · ₹{sel.bear}</div>
              <div style={{ fontSize: 11, color: '#f87171', lineHeight: 1.6 }}>{sel.risk}</div>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <div style={S.card}>
        <div style={S.ct}>Full 12-Month Price Table</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2744' }}>
                {['Month', 'Season', 'Bear', 'Low', 'Base', 'High', 'Bull', 'Conf', 'Momentum', 'Supply'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: ['Month', 'Season', 'Momentum', 'Supply'].includes(h) ? 'left' : 'right', fontSize: 10, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_FORECAST.map((m, i) => {
                const mc = m.momentum === 'bullish' ? '#4ade80' : m.momentum === 'bearish' ? '#f87171' : '#fb923c'
                return (
                  <tr key={i} onClick={() => setSelectedMonth(i === selectedMonth ? null : i)}
                    style={{ borderBottom: '1px solid #1a2744', background: selectedMonth === i ? '#1a2744' : 'transparent', cursor: 'pointer' }}>
                    <td style={{ padding: '8px 10px', color: '#f0f9ff', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.month}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 11 }}>{m.season}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f87171', fontFamily: 'DM Mono' }}>₹{m.bear}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.lo}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#38bdf8', fontWeight: 700, fontFamily: 'DM Mono' }}>₹{m.pred}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.hi}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'DM Mono' }}>₹{m.bull}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#c084fc' }}>{m.confidence}%</td>
                    <td style={{ padding: '8px 10px' }}><span style={S.pill(mc)}>{m.momentum}</span></td>
                    <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{m.supply}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
