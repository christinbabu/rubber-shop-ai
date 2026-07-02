import {
  Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from 'recharts'
import type { DailyPoint, LiveMarket } from '../types'
import { S } from '../styles'
import { DailyTip } from '../Tooltips'

type Props = {
  dailyData: DailyPoint[]
  selectedDay: number | null
  setSelectedDay: (i: number) => void
  mainMarket: LiveMarket | undefined
}

export function DailyTab({ dailyData, selectedDay, setSelectedDay, mainMarket }: Props) {
  const selD      = selectedDay !== null ? dailyData[selectedDay] : dailyData[0]
  const buyDays   = dailyData.filter(d => d.signal === 'BUY').length
  const sellDays  = dailyData.filter(d => d.signal === 'SELL').length
  const holdDays  = dailyData.filter(d => d.signal === 'HOLD').length
  const peakDay   = dailyData.reduce((a, b) => b.price > a.price ? b : a)
  const troughDay = dailyData.reduce((a, b) => b.price < a.price ? b : a)

  const kpis = [
    { label: 'Today spot',   val: `₹${mainMarket?.price}`, sub: 'Kottayam RSS4', color: '#38bdf8' },
    { label: '30-day peak',  val: `₹${peakDay.price}`,     sub: peakDay.date,    color: '#4ade80' },
    { label: '30-day low',   val: `₹${troughDay.price}`,   sub: troughDay.date,  color: '#f87171' },
    { label: 'Buy signals',  val: buyDays,                  sub: 'of 25 days',    color: '#4ade80' },
    { label: 'Sell signals', val: sellDays,                 sub: 'of 25 days',    color: '#f87171' },
  ]

  const vsSpot = (selD?.price ?? 245) - 245
  const confBand = Math.round((selD?.hi ?? 0) - (selD?.price ?? 0))

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11, marginBottom: 14 }}>
        {kpis.map(k => (
          <div key={k.label} style={S.card}>
            <div style={S.ct}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'DM Mono' }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={S.ct}>30-Day Daily Price Forecast — RSS4 Kottayam (₹/kg)</div>
          <div style={{ fontSize: 10, color: '#475569' }}>Click bar for details · Shaded band = confidence range</div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} onClick={d => d && setSelectedDay(dailyData.findIndex(x => x.date === d.activeLabel))}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#1a2744" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} interval={3} angle={-25} textAnchor="end" height={38} />
              <YAxis domain={[233, 270]} tick={{ fontSize: 10, fill: '#475569' }} width={44} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<DailyTip />} />
              <ReferenceLine y={270} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'Spot ₹270', fill: '#38bdf8', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={260} stroke="#4ade80" strokeDasharray="3 3" label={{ value: '₹260 target', fill: '#4ade80', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="hi" stroke="transparent" fill="url(#dg)" />
              <Area type="monotone" dataKey="lo" stroke="transparent" fill="#080b10" />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const c = payload.signal === 'BUY' ? '#4ade80' : payload.signal === 'SELL' ? '#f87171' : '#fb923c'
                  return <circle key={cx} cx={cx} cy={cy} r={payload.isToday ? 6 : 3} fill={c} stroke="#0d1520" strokeWidth={1.5} />
                }}
                activeDot={{ r: 8 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10, color: '#475569', justifyContent: 'center' }}>
          <span>🟢 BUY signal</span><span>🟠 HOLD signal</span><span>🔴 SELL signal</span>
        </div>
      </div>

      <div style={S.g2}>
        {/* Selected day detail */}
        <div style={{ ...S.card, background: '#0a1622', border: `1px solid ${selD?.signal === 'BUY' ? '#14532d' : selD?.signal === 'SELL' ? '#7f1d1d' : '#2b2110'}` }}>
          <div style={S.ct}>Selected Day — {selD?.date || 'Today'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 700, color: '#38bdf8', fontFamily: 'DM Mono' }}>
                ₹{selD?.price}<span style={{ fontSize: 14, color: '#475569' }}>/kg</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Range ₹{selD?.lo} – ₹{selD?.hi}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={S.sig(selD?.signal ?? 'HOLD')}>{selD?.signal}</span>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>Confidence: {selD?.conf}%</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([
              ['Day type',  selD?.dow,                        '#94a3b8'],
              ['Vs. spot',  `${vsSpot >= 0 ? '+' : ''}${vsSpot}/kg`, vsSpot >= 0 ? '#4ade80' : '#f87171'],
              ['Conf band', `±₹${confBand}`,                 '#c084fc'],
            ] as [string, string | undefined, string][]).map(([k, v, c]) => (
              <div key={k} style={{ background: '#080b10', borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c, fontFamily: 'DM Mono' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#080b10', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
            {selD?.signal === 'BUY'
              ? '⬆️ Price forecasted above ₹252 threshold. Tight supply conditions + demand pressure. Consider delaying sale.'
              : selD?.signal === 'SELL'
              ? '⬇️ Price below ₹242. Seasonal supply pressure. Optimal window to execute sale at premium vs. bear case.'
              : '↔️ Price in neutral zone ₹242–252. Monitor Thailand weather and China demand signals before acting.'}
          </div>
        </div>

        {/* Signal breakdown */}
        <div style={S.card}>
          <div style={S.ct}>Signal Distribution & Confidence Trend</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {([['BUY', buyDays, '#4ade80'], ['HOLD', holdDays, '#fb923c'], ['SELL', sellDays, '#f87171']] as [string, number, string][]).map(([sig, n, c]) => (
              <div key={sig} style={{ flex: 1, background: c + '15', border: `1px solid ${c}33`, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: 'DM Mono' }}>{n}</div>
                <div style={{ fontSize: 10, color: c, marginTop: 2 }}>days</div>
                <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{sig}</div>
              </div>
            ))}
          </div>
          <div style={S.ct}>Confidence over 30 days</div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c084fc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={false} />
                <YAxis domain={[40, 90]} tick={{ fontSize: 9, fill: '#475569' }} width={26} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Confidence']} />
                <Area type="monotone" dataKey="conf" stroke="#c084fc" fill="url(#cg)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
            Confidence declines from ~85% near-term to ~50% at 30 days. Short-term (1–5 day) signals are most actionable.
          </div>
        </div>
      </div>

      {/* Full table */}
      <div style={S.card}>
        <div style={S.ct}>Full 30-Day Daily Forecast Table — RSS4 Kottayam</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2744' }}>
                {['#', 'Date', 'Forecast (₹/kg)', 'Low', 'High', 'Confidence', 'Signal', 'Vs. Spot'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Date' ? 'left' : 'right', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyData.map((d, i) => {
                const diff = d.price - 245
                return (
                  <tr key={i} onClick={() => setSelectedDay(i)}
                    style={{ borderBottom: '1px solid #1a2744', background: selectedDay === i ? '#1a2744' : d.isToday ? '#0d2035' : 'transparent', cursor: 'pointer' }}>
                    <td style={{ padding: '8px 10px', color: '#334155', textAlign: 'right' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', color: d.isToday ? '#38bdf8' : '#94a3b8', fontWeight: d.isToday ? 700 : 400 }}>{d.date}{d.isToday ? ' ← today' : ''}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f0f9ff', fontWeight: 700, fontFamily: 'DM Mono' }}>₹{d.price}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f87171', fontFamily: 'DM Mono' }}>₹{d.lo}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'DM Mono' }}>₹{d.hi}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                        <div style={{ width: 32, height: 3, background: '#1a2744', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${d.conf}%`, height: '100%', background: '#c084fc' }} />
                        </div>
                        <span style={{ color: '#c084fc', minWidth: 28 }}>{d.conf}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}><span style={S.sig(d.signal)}>{d.signal}</span></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: diff >= 0 ? '#4ade80' : '#f87171', fontFamily: 'DM Mono' }}>
                      {diff >= 0 ? '+' : ''}{diff}
                    </td>
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
