import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { PriceRecord } from '../types'
import { S } from '../styles'

const API = 'http://localhost:4000'

type Range = '1D' | '7D' | '30D' | '90D' | 'ALL'

const RANGE_DAYS: Record<Range, number> = { '1D': 1, '7D': 7, '30D': 30, '90D': 90, 'ALL': 365 }

const SERIES = [
  { key: 'kottayam', label: 'Kottayam RSS4', color: '#38bdf8' },
  { key: 'ujire',    label: 'Ujire RSS4',     color: '#a78bfa' },
  { key: 'bangkok',  label: 'Bangkok RSS3',   color: '#34d399' },
  { key: 'isnr20',   label: 'ISNR 20',        color: '#fb923c' },
  { key: 'latex60',  label: 'Latex 60%',      color: '#f472b6' },
] as const

type SeriesKey = typeof SERIES[number]['key']

function fmt(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtShort(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function stat(vals: number[]) {
  if (!vals.length) return { min: 0, max: 0, avg: 0, last: 0, change: 0, pct: 0 }
  const min  = Math.min(...vals)
  const max  = Math.max(...vals)
  const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const last = vals[vals.length - 1]
  const first = vals[0]
  const change = last - first
  const pct    = first ? +((change / first) * 100).toFixed(2) : 0
  return { min, max, avg, last, change, pct }
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0b1826', border: '1px solid #1a2744', borderRadius: 8, padding: '10px 14px', minWidth: 160 }}>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, color: '#f0f9ff', fontFamily: 'DM Mono' }}>₹{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PriceHistoryTab() {
  const [records,  setRecords]  = useState<PriceRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [range,    setRange]    = useState<Range>('30D')
  const [total,    setTotal]    = useState(0)
  const [active,   setActive]   = useState<Set<SeriesKey>>(new Set(['kottayam', 'ujire', 'bangkok']))
  const [lastSave, setLastSave] = useState<string | null>(null)

  async function load(r: Range) {
    try {
      setLoading(true)
      setError(null)
      const resp = await fetch(`${API}/api/price-history?days=${RANGE_DAYS[r]}`)
      const json = await resp.json()
      if (!json.success) throw new Error(json.error || 'fetch failed')
      setRecords(json.records ?? [])
      setTotal(json.total ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveNow() {
    try {
      setLastSave('saving…')
      const resp = await fetch(`${API}/api/refresh-prices`, { method: 'POST' })
      const json = await resp.json()
      if (json.success) {
        setLastSave('saved ✓')
        load(range)
        setTimeout(() => setLastSave(null), 3000)
      }
    } catch {
      setLastSave('error')
    }
  }

  useEffect(() => { load(range) }, [range])

  // Chart data — downsample to 200 points max for performance
  const chartData = useMemo(() => {
    if (records.length <= 200) return records.map(r => ({ ...r, _label: fmtShort(r.date) }))
    const step = Math.ceil(records.length / 200)
    return records.filter((_, i) => i % step === 0 || i === records.length - 1)
      .map(r => ({ ...r, _label: fmtShort(r.date) }))
  }, [records])

  const kottayamVals = records.map(r => r.kottayam).filter(Boolean)
  const stats        = stat(kottayamVals)

  const toggleSeries = (k: SeriesKey) => {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(k)) { if (next.size > 1) next.delete(k) }
      else next.add(k)
      return next
    })
  }

  const yMin = useMemo(() => {
    if (!records.length) return 150
    const all = records.flatMap(r => SERIES.filter(s => active.has(s.key)).map(s => r[s.key] ?? 999))
    return Math.max(100, Math.min(...all) - 15)
  }, [records, active])

  const yMax = useMemo(() => {
    if (!records.length) return 350
    const all = records.flatMap(r => SERIES.filter(s => active.has(s.key)).map(s => r[s.key] ?? 0))
    return Math.min(500, Math.max(...all) + 15)
  }, [records, active])

  const latest = records[records.length - 1]

  return (
    <>
      <style>{`
        .ph-grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 14px; }
        .ph-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 14px; }
        @media (max-width: 640px) {
          .ph-grid4 { grid-template-columns: repeat(2,1fr); }
          .ph-grid3 { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f9ff' }}>Price History</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
            {total} snapshots stored in MongoDB · prices saved every 5 min when server is running
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={saveNow} style={{ fontSize: 10, padding: '5px 12px', borderRadius: 6,
            border: '1px solid #1e3a5f', background: '#0d1520', color: '#60a5fa',
            cursor: 'pointer', fontFamily: 'DM Mono' }}>
            {lastSave ?? '⟳ Save Now'}
          </button>
          {['1D', '7D', '30D', '90D', 'ALL'].map(r => (
            <button key={r} onClick={() => setRange(r as Range)}
              style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5,
                border: `1px solid ${range === r ? '#38bdf8' : '#1a2744'}`,
                background: range === r ? '#38bdf822' : 'transparent',
                color: range === r ? '#38bdf8' : '#475569',
                cursor: 'pointer', fontFamily: 'DM Mono' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stats for Kottayam RSS4 */}
      <div className="ph-grid4">
        {[
          { label: 'Latest',      val: `₹${stats.last}`,   color: '#38bdf8' },
          { label: 'Period High', val: `₹${stats.max}`,    color: '#4ade80' },
          { label: 'Period Low',  val: `₹${stats.min}`,    color: '#f87171' },
          { label: 'Period Avg',  val: `₹${stats.avg}`,    color: '#c084fc' },
        ].map(k => (
          <div key={k.label} style={S.card}>
            <div style={S.ct}>{k.label} · Kottayam RSS4</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'DM Mono', marginTop: 6 }}>{k.val}</div>
            {k.label === 'Latest' && stats.change !== 0 && (
              <div style={{ fontSize: 11, marginTop: 3, color: stats.change >= 0 ? '#4ade80' : '#f87171' }}>
                {stats.change >= 0 ? '+' : ''}{stats.change} ({stats.pct >= 0 ? '+' : ''}{stats.pct}%) vs period open
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No data state */}
      {!loading && records.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, color: '#f0f9ff', marginBottom: 8 }}>No price history yet</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
            Price snapshots are saved every 5 minutes while the server is running.<br />
            Click "Save Now" to capture the current prices immediately.
          </div>
          <button onClick={saveNow} style={{ fontSize: 12, padding: '8px 20px', borderRadius: 7,
            border: '1px solid #38bdf8', background: '#38bdf811', color: '#38bdf8',
            cursor: 'pointer', fontFamily: 'DM Mono' }}>
            Capture Current Prices
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#f87171' }}>
          Server error: {error} — make sure the Node server is running (node server.js)
        </div>
      )}

      {loading && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>
          Loading price history…
        </div>
      )}

      {/* Main chart */}
      {!loading && records.length > 0 && (
        <>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={S.ct}>RSS4 Price History — ₹/kg</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                  {records.length} data points · source: rubberboard.gov.in + thecanarapost.com
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SERIES.map(s => (
                  <button key={s.key} onClick={() => toggleSeries(s.key)}
                    style={{ fontSize: 10, padding: '4px 10px', borderRadius: 5,
                      border: `1px solid ${active.has(s.key) ? s.color : '#1a2744'}`,
                      background: active.has(s.key) ? s.color + '22' : 'transparent',
                      color: active.has(s.key) ? s.color : '#475569',
                      cursor: 'pointer', fontFamily: 'DM Mono', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 6" stroke="#1a2744" />
                  <XAxis dataKey="_label" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                  <YAxis domain={[yMin, yMax]} tick={{ fontSize: 9, fill: '#475569' }} width={45} tickFormatter={v => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  {SERIES.filter(s => active.has(s.key)).map(s => (
                    <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                      stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Macro overlay chart */}
          {records.some(r => r.brent !== null) && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={S.ct}>Macro Inputs — Brent Crude ($/bbl) · INR/USD</div>
              <div style={{ height: 160, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 6" stroke="#1a2744" />
                    <XAxis dataKey="_label" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                    <YAxis yAxisId="brent" tick={{ fontSize: 9, fill: '#fb923c' }} width={38} />
                    <YAxis yAxisId="inr" orientation="right" tick={{ fontSize: 9, fill: '#38bdf8' }} width={40} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div style={{ background: '#0b1826', border: '1px solid #1a2744', borderRadius: 8, padding: '8px 12px' }}>
                          <div style={{ fontSize: 9, color: '#475569', marginBottom: 4 }}>{label}</div>
                          {payload.map((p: any) => (
                            <div key={p.dataKey} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
                              {p.name}: {p.dataKey === 'brent' ? `$${p.value}` : `₹${p.value}`}
                            </div>
                          ))}
                        </div>
                      )
                    }} />
                    <Line yAxisId="brent" type="monotone" dataKey="brent" name="Brent ($/bbl)"
                      stroke="#fb923c" strokeWidth={1.5} dot={false} />
                    <Line yAxisId="inr" type="monotone" dataKey="inrUsd" name="INR/USD"
                      stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Latest snapshot detail */}
          {latest && (
            <div style={{ ...S.card, marginBottom: 14, border: '1px solid #1e3a5f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <div style={S.ct}>Latest Snapshot — {fmt(latest.date)}</div>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: '#14532d33', color: '#4ade80' }}>
                  LIVE · {latest.source}
                </span>
              </div>
              <div className="ph-grid3">
                {[
                  { label: 'Kottayam RSS4', val: latest.kottayam, color: '#38bdf8' },
                  { label: 'Kochi',         val: latest.kochi,    color: '#60a5fa' },
                  { label: 'Ujire RSS4',    val: latest.ujire,    color: '#a78bfa' },
                  { label: 'Mysuru RSS4',   val: latest.mysuru,   color: '#818cf8' },
                  { label: 'Hassan RSS4',   val: latest.hassan,   color: '#6ee7b7' },
                  { label: 'Bangkok RSS3',  val: latest.bangkok,  color: '#34d399' },
                  { label: 'ISNR 20',       val: latest.isnr20,   color: '#fb923c' },
                  { label: 'Latex 60%',     val: latest.latex60,  color: '#f472b6' },
                  { label: 'RSS 5',         val: latest.rss5,     color: '#94a3b8' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#080b10', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#475569', marginBottom: 3 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: k.color, fontFamily: 'DM Mono' }}>₹{k.val ?? '—'}</div>
                    <div style={{ fontSize: 9, color: '#334155' }}>per kg</div>
                  </div>
                ))}
              </div>
              {(latest.brent || latest.inrUsd) && (
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  {latest.brent && (
                    <div style={{ background: '#080b10', borderRadius: 6, padding: '8px 12px', flex: 1 }}>
                      <div style={{ fontSize: 9, color: '#475569' }}>Brent Crude</div>
                      <div style={{ fontSize: 15, color: '#fb923c', fontFamily: 'DM Mono', fontWeight: 600 }}>${latest.brent}/bbl</div>
                    </div>
                  )}
                  {latest.inrUsd && (
                    <div style={{ background: '#080b10', borderRadius: 6, padding: '8px 12px', flex: 1 }}>
                      <div style={{ fontSize: 9, color: '#475569' }}>INR/USD</div>
                      <div style={{ fontSize: 15, color: '#38bdf8', fontFamily: 'DM Mono', fontWeight: 600 }}>₹{latest.inrUsd}/$</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent records table */}
          <div style={S.card}>
            <div style={{ ...S.ct, marginBottom: 10 }}>Recent Records (last 20)</div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a2744' }}>
                    {['Timestamp', 'Kottayam', 'Ujire', 'Bangkok', 'ISNR20', 'Latex', 'Brent', 'INR/$'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Timestamp' ? 'left' : 'right',
                        fontSize: 10, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...records].reverse().slice(0, 20).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a2744' }}>
                      <td style={{ padding: '6px 10px', color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(r.date)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#38bdf8', fontFamily: 'DM Mono' }}>₹{r.kottayam}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#a78bfa', fontFamily: 'DM Mono' }}>₹{r.ujire}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#34d399', fontFamily: 'DM Mono' }}>₹{r.bangkok ?? '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#fb923c', fontFamily: 'DM Mono' }}>₹{r.isnr20 ?? '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#f472b6', fontFamily: 'DM Mono' }}>₹{r.latex60 ?? '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#fb923c', fontFamily: 'DM Mono' }}>{r.brent ? `$${r.brent}` : '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#60a5fa', fontFamily: 'DM Mono' }}>{r.inrUsd ? `₹${r.inrUsd}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
