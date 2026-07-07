import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import type { Factor, LiveFactorMeta, TyreStock } from '../../utils/marketFactors'
import { computePrediction } from '../../utils/marketFactors'

const API = 'http://localhost:4000'

type HistoryPoint = {
  date: string
  brent: number | null
  inrUsd: number | null
}

const ContribTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div style={{ background: '#0d1520', border: '1px solid #1a2744', padding: 10, borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{point.name}</div>
      <div style={{ color: point.val >= 0 ? '#4ade80' : '#f87171' }}>
        {point.val >= 0 ? '+' : ''}₹{point.val}/kg contribution
      </div>
    </div>
  )
}

const HistoryTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1520', border: '1px solid #1a2744', padding: 10, borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{new Date(label ?? '').toLocaleString()}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value ?? '—'}</div>
      ))}
    </div>
  )
}

type MarketFactorsProps = {
  factors: Factor[]
  liveFactorMeta: LiveFactorMeta
  tyreStocks: TyreStock[]
}

export function MarketFactors({ factors, liveFactorMeta, tyreStocks }: MarketFactorsProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchHistory() {
      try {
        const resp = await fetch(`${API}/api/price-history?days=30`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!json.success || cancelled) return
        setHistory(json.records.map((r: any) => ({ date: r.date, brent: r.brent, inrUsd: r.inrUsd })))
        setHistoryError(null)
      } catch (err) {
        if (!cancelled) setHistoryError(err instanceof Error ? err.message : 'Failed to load history')
      }
    }

    fetchHistory()
    const id = setInterval(fetchHistory, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const result = computePrediction(factors)

  return (
    <div className="card">
      <h2>Market Factors</h2>
      <p>Current value and weighted price contribution of every factor driving the model, plus real historical trends where available.</p>

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: 12 }}>Contribution to predicted price (₹/kg)</h3>
        <div style={{ width: '100%', height: result.contribs.length * 32 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.contribs} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} interval={0} />
              <Tooltip content={<ContribTooltip />} />
              <Bar dataKey="val" radius={[0, 6, 6, 0]}>
                {result.contribs.map((c) => (
                  <Cell key={c.name} fill={c.val >= 0 ? '#4ade80' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {factors.map((factor) => {
          const contrib = result.contribs.find((c) => c.id === factor.id)
          return (
            <div key={factor.id} style={{ background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{factor.icon} {factor.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f9ff' }}>{factor.val}{factor.unit}</div>
              {contrib && (
                <div style={{ fontSize: '0.75rem', marginTop: 4, color: contrib.val >= 0 ? '#4ade80' : '#f87171' }}>
                  {contrib.val >= 0 ? '+' : ''}₹{contrib.val}/kg
                </div>
              )}
              {liveFactorMeta[factor.id] ? (
                <div style={{ fontSize: '0.65rem', marginTop: 6, color: '#4ade80' }}>
                  ● Live · {liveFactorMeta[factor.id]!.updatedAt.toLocaleTimeString()}
                </div>
              ) : (
                <div style={{ fontSize: '0.65rem', marginTop: 6, color: '#64748b' }}>Manual estimate</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Tyre company share prices (live)</h3>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>NSE · drives the Tire industry demand factor</div>
        </div>
        {tyreStocks.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading live quotes…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {tyreStocks.map((stock) => (
              <div key={stock.symbol} style={{ background: '#0b1621', border: '1px solid #1a2744', borderRadius: 10, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{stock.name}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f9ff' }}>
                  {stock.price != null ? `₹${stock.price.toLocaleString('en-IN')}` : '—'}
                </div>
                {stock.changePct != null && (
                  <div style={{ fontSize: '0.75rem', marginTop: 4, color: stock.changePct >= 0 ? '#4ade80' : '#f87171' }}>
                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Brent crude & INR/USD — history</h3>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{history.length} snapshot{history.length === 1 ? '' : 's'} recorded</div>
        </div>
        {historyError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{historyError}</div>}
        {history.length === 0 && !historyError && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>No snapshots recorded yet — history accumulates as live data is fetched.</div>
        )}
        {history.length > 0 && (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                <YAxis yAxisId="brent" tick={{ fill: '#fb923c', fontSize: 10 }} width={40} />
                <YAxis yAxisId="inr" orientation="right" tick={{ fill: '#38bdf8', fontSize: 10 }} width={40} />
                <Tooltip content={<HistoryTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="brent" type="monotone" dataKey="brent" name="Brent ($/bbl)" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="inr" type="monotone" dataKey="inrUsd" name="INR/USD" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
