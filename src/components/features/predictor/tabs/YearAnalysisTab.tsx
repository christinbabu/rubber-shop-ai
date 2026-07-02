import {
  Line, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from 'recharts'
import { YEAR_DATA, YEAR_ANALYSIS, YEAR_DATA_2026, KARNATAKA_2026, YEAR_ANALYSIS_2026, MONTHLY_FORECAST } from '../data'
import { S } from '../styles'

type Props = {
  selectedYear: number
  setSelectedYear: (y: number) => void
}

export function YearAnalysisTab({ selectedYear, setSelectedYear }: Props) {
  const is2026 = selectedYear === 2026
  const ya     = is2026 ? YEAR_ANALYSIS_2026 : YEAR_ANALYSIS[selectedYear]
  const yd     = is2026 ? YEAR_DATA_2026 : YEAR_DATA[selectedYear]
  const prevYD = selectedYear > 2023 ? (is2026 ? YEAR_DATA[2025] : YEAR_DATA[selectedYear - 1]) : null

  const actual2026 = YEAR_DATA_2026.filter(d => d.type === 'actual')

  const combined = yd.map((d, i) => ({
    m: d.m,
    [selectedYear]: d.price,
    ...(prevYD ? { [selectedYear - 1]: prevYD[i]?.price } : {}),
  }))

  const chart2026 = YEAR_DATA_2026.map((d, i) => ({
    m:         d.m,
    actual:    d.type === 'actual'   ? d.price : null,
    forecast:  d.type === 'forecast' ? d.price : (i === 4 ? d.price : null),
    lo:        d.lo ?? null,
    hi:        d.hi ?? null,
    karnataka: KARNATAKA_2026[i].price,
    type:      d.type,
  }))

  const compare4yr = YEAR_DATA[2023].map((_, i) => ({
    m:      YEAR_DATA[2023][i].m,
    '2023': YEAR_DATA[2023][i].price,
    '2024': YEAR_DATA[2024][i].price,
    '2025': YEAR_DATA[2025][i].price,
    '2026': YEAR_DATA_2026[i].price,
  }))

  const yearButtons = [
    [2023, YEAR_ANALYSIS[2023]],
    [2024, YEAR_ANALYSIS[2024]],
    [2025, YEAR_ANALYSIS[2025]],
    [2026, YEAR_ANALYSIS_2026],
  ] as const

  return (
    <>
      {/* Year selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {yearButtons.map(([y, ya2]) => (
          <button key={y} onClick={() => setSelectedYear(y)}
            style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'DM Mono', border: `1px solid ${selectedYear === y ? ya2.color : '#1a2744'}`, background: selectedYear === y ? ya2.color + '22' : 'transparent', color: selectedYear === y ? ya2.color : '#64748b', cursor: 'pointer', borderRadius: 8, textAlign: 'left', flex: 1, minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {y} {y === 2026 && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#818cf855', color: '#818cf8', marginLeft: 4 }}>LIVE</span>}
            </div>
            <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{ya2.headline}</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>{ya2.change} · Avg ₹{ya2.avg}</div>
          </button>
        ))}
      </div>

      {/* Headline KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11, marginBottom: 14 }}>
        {[
          { label: is2026 ? 'Year-to-date avg' : 'Year avg',       val: `₹${ya.avg}/kg`,                              color: ya.color },
          { label: is2026 ? 'Forecast peak'    : 'Year high',      val: `₹${ya.high}/kg`, sub: ya.highM,              color: '#4ade80' },
          { label: is2026 ? 'Year low (actual)': 'Year low',       val: `₹${ya.low}/kg`,  sub: ya.lowM,               color: '#f87171' },
          { label: 'YoY change',                                    val: ya.change,                                    color: ya.change.startsWith('+') ? '#4ade80' : '#f87171' },
          { label: 'Volatility',                                    val: `±₹${Math.round((ya.high - ya.low) / 2)}`,   color: '#c084fc', sub: 'Half-range' },
        ].map(k => (
          <div key={k.label} style={S.card}>
            <div style={S.ct}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: 'DM Mono' }}>{k.val}</div>
            {'sub' in k && k.sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* 2026 chart */}
      {is2026 && (
        <>
          <div style={{ ...S.card, marginBottom: 14, border: '1px solid #4a3f8044' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={S.ct}>2026 Full Year — Actual (Jan–May) + Forecast (Jun–Dec) · RSS4 Kottayam (₹/kg)</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#475569' }}>
                <span>━ Actual</span>
                <span style={{ borderBottom: '2px dashed #818cf8', paddingBottom: 1 }}>╌ Forecast</span>
                <span style={{ color: '#4ade80' }}>━ Karnataka (Ujire)</span>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart2026}>
                  <defs>
                    <linearGradient id="bg26" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[175, 285]} tick={{ fontSize: 10, fill: '#475569' }} width={44} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }}
                    formatter={(v: number, n: string) => v != null ? [`₹${v}/kg`, n] : ['—', n]}
                    labelFormatter={(l: string) => {
                      const d = chart2026.find(x => x.m === l)
                      return `${l} ${d?.type === 'forecast' ? '(forecast)' : '(actual)'}`
                    }}
                  />
                  <Area dataKey="hi" stroke="transparent" fill="url(#bg26)" connectNulls />
                  <Area dataKey="lo" stroke="transparent" fill="#080b10" connectNulls />
                  <ReferenceLine y={239} stroke="#f87171" strokeDasharray="3 3" label={{ value: 'ATH ₹239', fill: '#f87171', fontSize: 9, position: 'right' }} />
                  <ReferenceLine y={260} stroke="#4ade80" strokeDasharray="3 3" label={{ value: 'Peak fcst ₹260', fill: '#4ade80', fontSize: 9, position: 'right' }} />
                  <ReferenceLine y={270} stroke="#38bdf8" strokeDasharray="2 4" label={{ value: 'Jun spot ₹270', fill: '#38bdf8', fontSize: 9, position: 'right' }} />
                  <ReferenceLine x="Jun" stroke="#475569" strokeDasharray="4 2" label={{ value: 'Forecast →', fill: '#475569', fontSize: 9, position: 'insideTopLeft' }} />
                  <Line type="monotone" dataKey="karnataka" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="Karnataka (Ujire)" connectNulls />
                  <Line type="monotone" dataKey="forecast"  stroke="#818cf8" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#818cf8', r: 4 }} name="Kottayam Forecast" connectNulls />
                  <Line type="monotone" dataKey="actual"    stroke="#f0f9ff" strokeWidth={3}   dot={{ fill: '#f0f9ff', r: 5, strokeWidth: 0 }} name="Kottayam Actual" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 14, padding: 12, background: '#080b10', borderRadius: 8 }}>
              {actual2026.map((d, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 3 }}>{d.m} '26</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f9ff', fontFamily: 'DM Mono' }}>₹{d.price}</div>
                  <div style={{ fontSize: 9, color: '#4ade80', marginTop: 2 }}>● Actual</div>
                </div>
              ))}
            </div>
          </div>

          {/* H2 forecast table */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={S.ct}>H2 2026 Monthly Forecast Detail (Jun–Dec)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a2744' }}>
                    {['Month', 'Season', 'Bear', 'Low', 'Forecast', 'High', 'Bull', 'Confidence', 'Supply', 'Karnataka'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', fontSize: 10, color: '#475569', textTransform: 'uppercase', textAlign: ['Month', 'Season', 'Supply'].includes(h) ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY_FORECAST.slice(0, 7).map((m, i) => {
                    const kprice = KARNATAKA_2026[i + 5]?.price
                    const mc = m.momentum === 'bullish' ? '#4ade80' : m.momentum === 'bearish' ? '#f87171' : '#fb923c'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a2744' }}>
                        <td style={{ padding: '8px 10px', color: '#f0f9ff', fontWeight: 600 }}>{m.month}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{m.season}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f87171', fontFamily: 'DM Mono' }}>₹{m.bear}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.lo}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#818cf8', fontWeight: 700, fontFamily: 'DM Mono' }}>₹{m.pred}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', fontFamily: 'DM Mono' }}>₹{m.hi}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'DM Mono' }}>₹{m.bull}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                            <div style={{ width: 32, height: 3, background: '#1a2744', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${m.confidence}%`, height: '100%', background: mc }} />
                            </div>
                            <span style={{ color: mc }}>{m.confidence}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{m.supply}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'DM Mono' }}>₹{kprice}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Non-2026 chart */}
      {!is2026 && (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={S.ct}>{selectedYear} Monthly Price Chart — RSS4 Kottayam (₹/kg)</div>
            {prevYD && <div style={{ fontSize: 10, color: '#475569' }}>Dashed = {selectedYear - 1}</div>}
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined}>
                <defs>
                  <linearGradient id={`yg${selectedYear}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ya.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ya.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#475569' }} width={42} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number, n: string) => [`₹${v}/kg`, n]} />
                {ya.events.map((ev, i) => {
                  const mIdx = yd.findIndex(d => d.m === ev.m)
                  return mIdx >= 0 ? <ReferenceLine key={i} x={ev.m} stroke={ya.color} strokeDasharray="3 3" opacity={0.5} /> : null
                })}
                {prevYD && <Line type="monotone" dataKey={selectedYear - 1} stroke="#475569" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />}
                <Area type="monotone" dataKey={selectedYear} stroke={ya.color} fill={`url(#yg${selectedYear})`} strokeWidth={2.5} dot={{ fill: ya.color, r: 4, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={S.g2}>
        {/* Key drivers */}
        <div style={S.card}>
          <div style={S.ct}>Key Price Drivers — {selectedYear}</div>
          {ya.drivers.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < ya.drivers.length - 1 ? '1px solid #1a2744' : 'none' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>{d.label}</span>
                  <span style={S.pill(d.dir === 'up' ? '#f87171' : d.dir === 'dn' ? '#4ade80' : '#fb923c')}>
                    {d.dir === 'up' ? '▲ Up' : d.dir === 'dn' ? '▼ Down' : '↔ Mixed'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{d.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Events timeline */}
        <div style={S.card}>
          <div style={S.ct}>Key Events Timeline — {selectedYear}</div>
          {ya.events.map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: ya.color + '22', border: `2px solid ${ya.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ya.color, flexShrink: 0 }}>{ev.m}</div>
                {i < ya.events.length - 1 && <div style={{ width: 1, height: 18, background: '#1a2744', marginTop: 3 }} />}
              </div>
              <div style={{ flex: 1, paddingTop: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: ya.color, fontFamily: 'DM Mono', marginBottom: 2 }}>₹{ev.price}/kg</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{ev.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year summary */}
      <div style={{ ...S.card, background: '#0a1420', border: `1px solid ${ya.color}44`, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 4, height: 18, background: ya.color, borderRadius: 2, marginRight: 8 }} />
          <div style={S.ct}>{selectedYear} Annual Summary — {ya.headline}</div>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.9 }}>{ya.summary}</div>
      </div>

      {/* 4-year comparison */}
      <div style={S.card}>
        <div style={S.ct}>4-Year Price Comparison — Monthly RSS4 Kottayam (₹/kg)</div>
        <div style={{ height: 230 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare4yr} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis domain={[100, 290]} tick={{ fontSize: 10, fill: '#475569' }} width={42} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number, n: string) => [`₹${v}/kg`, n]} />
              <Bar dataKey="2023" fill="#60a5fa" radius={[2, 2, 0, 0]} />
              <Bar dataKey="2024" fill="#fb923c" radius={[2, 2, 0, 0]} />
              <Bar dataKey="2025" fill="#4ade80" radius={[2, 2, 0, 0]} />
              <Bar dataKey="2026" fill="#818cf8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: '#475569', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span>🔵 2023 avg ₹156</span>
          <span>🟠 2024 avg ₹200</span>
          <span>🟢 2025 avg ₹221</span>
          <span style={{ color: '#818cf8' }}>🟣 2026 avg ₹{YEAR_ANALYSIS_2026.avg} (Jan–May actual + H2 forecast)</span>
        </div>
      </div>
    </>
  )
}
