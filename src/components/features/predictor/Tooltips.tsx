import { MONTHLY_FORECAST } from './data'
import type { DailyPoint } from './types'

export function ForecastTip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = MONTHLY_FORECAST.find(m => m.month === label)
  if (!d) return null
  const mc = d.momentum === 'bullish' ? '#4ade80' : d.momentum === 'bearish' ? '#f87171' : '#fb923c'
  return (
    <div style={{ background: '#0f1923', border: '1px solid #1a2744', borderRadius: 10, padding: '14px 16px', fontSize: 12, maxWidth: 260 }}>
      <div style={{ fontWeight: 700, color: '#f0f9ff', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 14px', marginBottom: 8 }}>
        <span style={{ color: '#64748b' }}>Base</span><span style={{ color: '#38bdf8', fontWeight: 700 }}>₹{d.pred}/kg</span>
        <span style={{ color: '#64748b' }}>Bull</span><span style={{ color: '#4ade80' }}>₹{d.bull}/kg</span>
        <span style={{ color: '#64748b' }}>Bear</span><span style={{ color: '#f87171' }}>₹{d.bear}/kg</span>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>{d.catalyst}</div>
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: mc + '22', color: mc, border: `1px solid ${mc}44` }}>
        {d.momentum.toUpperCase()}
      </span>
    </div>
  )
}

export function DailyTip({ active, payload }: { active?: boolean; payload?: { payload: DailyPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const sc = d.signal === 'BUY' ? '#4ade80' : d.signal === 'SELL' ? '#f87171' : '#fb923c'
  return (
    <div style={{ background: '#0f1923', border: '1px solid #1a2744', borderRadius: 10, padding: '12px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#f0f9ff', marginBottom: 6 }}>{d.date}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
        <span style={{ color: '#64748b' }}>Forecast</span>   <span style={{ color: '#38bdf8', fontWeight: 700 }}>₹{d.price}/kg</span>
        <span style={{ color: '#64748b' }}>Range</span>      <span style={{ color: '#94a3b8' }}>₹{d.lo}–{d.hi}</span>
        <span style={{ color: '#64748b' }}>Confidence</span> <span style={{ color: '#c084fc' }}>{d.conf}%</span>
        <span style={{ color: '#64748b' }}>Signal</span>     <span style={{ color: sc, fontWeight: 700 }}>{d.signal}</span>
      </div>
    </div>
  )
}
