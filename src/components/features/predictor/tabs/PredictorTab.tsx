import type { Factor, PredictionResult } from '../types'
import { S } from '../styles'

type Props = {
  factors: Factor[]
  setFactors: React.Dispatch<React.SetStateAction<Factor[]>>
  result: PredictionResult
}

export function PredictorTab({ factors, setFactors, result }: Props) {
  const sentimentColor = result.pred > 245 ? '#4ade80' : result.pred < 220 ? '#f87171' : '#38bdf8'
  const sentiment      = result.pred > 245 ? 'BULLISH ↑' : result.pred < 220 ? 'BEARISH ↓' : 'SIDEWAYS →'
  const sentimentBg    = result.pred > 245 ? '#14532d' : result.pred < 220 ? '#7f1d1d' : '#1e3a5f'

  return (
    <div style={S.g2}>
      {/* Sliders */}
      <div style={S.card}>
        <div style={S.ct}>Adjust Market Conditions</div>
        {factors.map((f, i) => (
          <div key={f.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
              <span>{f.icon} {f.label}</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{f.val}{f.unit}</span>
            </div>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step ?? 1}
              value={f.val}
              onChange={e => setFactors(prev => prev.map((p, j) => j === i ? { ...p, val: +e.target.value } : p))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', marginTop: 2 }}>
              <span>{f.min}{f.unit}</span><span>{f.max}{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Prediction card */}
        <div style={{ ...S.card, background: 'linear-gradient(135deg,#0c1d2e,#0a1520)', border: '1px solid #1e4a7f' }}>
          <div style={S.ct}>AI Price Prediction — 3 Month</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: sentimentColor, fontFamily: 'DM Mono' }}>
            ₹{result.pred}<span style={{ fontSize: 16, color: '#475569' }}>/kg</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Range: <span style={{ color: '#60a5fa' }}>₹{result.lo} – ₹{result.hi}</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 5, background: sentimentBg, color: sentimentColor }}>
              {sentiment}
            </span>
          </div>
        </div>

        {/* Factor contributions */}
        <div style={S.card}>
          <div style={S.ct}>Factor Contributions</div>
          {result.contribs.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b', width: 90, flexShrink: 0 }}>{c.name}</span>
              <div style={{ flex: 1, height: 4, background: '#1a2744', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.abs(c.val) * 4)}%`, height: '100%', background: c.val >= 0 ? '#4ade80' : '#f87171', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: c.val >= 0 ? '#4ade80' : '#f87171', minWidth: 52, textAlign: 'right', fontFamily: 'DM Mono' }}>
                {c.val >= 0 ? '+' : ''}₹{c.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
