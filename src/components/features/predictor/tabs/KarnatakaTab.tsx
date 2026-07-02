import { useState } from 'react'
import {
  Line, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { KARNATAKA_MARKETS, KARNATAKA_HISTORY, KARNATAKA_2026 } from '../data'
import { S } from '../styles'

const GRADES = [
  { grade: 'RSS 1X (Premium)', price: 265, color: '#4ade80', pct: 100 },
  { grade: 'RSS 3',            price: 265, color: '#38bdf8', pct: 100 },
  { grade: 'RSS 4',            price: 248, color: '#60a5fa', pct: 94  },
  { grade: 'RSS 5',            price: 241, color: '#c084fc', pct: 91  },
  { grade: 'Lot / Mixed',      price: 213, color: '#fb923c', pct: 80  },
  { grade: 'Sheet I (SI)',     price: 149, color: '#f87171', pct: 56  },
  { grade: 'Sheet II (SII)',   price: 138, color: '#ef4444', pct: 52  },
]

const DISTRICTS = [
  { name: 'Hassan',           share: 28, area: '28,000 ha', color: '#38bdf8' },
  { name: 'Dakshina Kannada', share: 22, area: '22,000 ha', color: '#4ade80' },
  { name: 'Kodagu (Coorg)',   share: 18, area: '18,000 ha', color: '#c084fc' },
  { name: 'Shivamogga',       share: 14, area: '14,000 ha', color: '#fb923c' },
  { name: 'Uttara Kannada',   share: 10, area: '10,000 ha', color: '#f87171' },
  { name: 'Others',           share: 8,  area: '8,000 ha',  color: '#64748b' },
]

const INTEL_SECTIONS = [
  { title: 'Why Karnataka trades lower', icon: '📉', color: '#f87171', items: ['Higher transport cost to major tyre plants in Chennai/Pune', 'Quality perception: less established than Kottayam-certified RSS', 'Smaller auction volumes reduce price discovery efficiency', "Some growers sell ungraded 'Lot' rubber, pulling avg down"] },
  { title: 'When the spread narrows',    icon: '🔄', color: '#fb923c', items: ['During peak monsoon — both states disrupted equally', 'When Kottayam supply is tightest — buyers source from Karnataka', 'Post-2022: quality improvement narrowed spread from 12% to 7%', 'Hassan district premium grades now match Kottayam RSS4'] },
  { title: 'Karnataka 2026 outlook',     icon: '📈', color: '#4ade80', items: ["Ujire live at ₹248/kg (Jun 28); forecast ₹256–262 peak in Aug '26", 'Hassan new plantation areas add 3-4% more supply by 2027', 'EUDR compliance investment improving grade quality & traceability', 'Spread to Kottayam expected to stay 7-9% through 2026-27'] },
]

export function KarnatakaTab() {
  const [selKmkt, setSelKmkt] = useState('ujire')
  const km = KARNATAKA_MARKETS.find(m => m.id === selKmkt)

  const spreadData = KARNATAKA_HISTORY[2025].map(d => ({
    m:        d.m,
    ujire:    d.ujire,
    kottayam: d.kottayam,
    spread:   d.kottayam - d.ujire,
  }))

  const multiYear = KARNATAKA_HISTORY[2023].map((_, i) => ({
    m:      KARNATAKA_HISTORY[2023][i].m,
    '2023': KARNATAKA_HISTORY[2023][i].ujire,
    '2024': KARNATAKA_HISTORY[2024][i].ujire,
    '2025': KARNATAKA_HISTORY[2025][i].ujire,
  }))

  return (
    <>
      {/* Header banner */}
      <div style={{ background: 'linear-gradient(135deg,#0d1f10,#0a1c1a)', border: '1px solid #1a4020', borderRadius: 10, padding: '16px 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>🌿 Karnataka Rubber Market</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
            India's 2nd largest rubber producing state · ~1.05 lakh MT/year · Key markets: Ujire, Hassan, Mysuru, Madikeri, Sagara<br />
            Karnataka trades at <span style={{ color: '#4ade80' }}>6–10% discount</span> to Kottayam due to grading and transport differentials
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {([['Ujire RSS4', '₹248/kg', '#4ade80'], ['Ujire RSS1X', '₹265/kg', '#38bdf8'], ['Mysuru RSS4', '₹251/kg', '#c084fc'], ['Hassan RSS4', '₹247/kg', '#fb923c']] as const).map(([l, v, c]) => (
            <div key={l} style={{ background: '#080b10', border: `1px solid ${c}33`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: 'DM Mono' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Market selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {KARNATAKA_MARKETS.map(m => (
          <button key={m.id} onClick={() => setSelKmkt(m.id)}
            style={{ padding: '8px 14px', fontSize: 11, fontFamily: 'DM Mono', border: `1px solid ${selKmkt === m.id ? '#4ade80' : '#1a2744'}`, background: selKmkt === m.id ? '#4ade8022' : 'transparent', color: selKmkt === m.id ? '#4ade80' : '#64748b', cursor: 'pointer', borderRadius: 7 }}>
            {m.name.split(' ')[0]}
            <span style={{ fontSize: 9, display: 'block', color: '#475569', marginTop: 1 }}>{m.role}</span>
          </button>
        ))}
      </div>

      {/* Selected market detail */}
      <div style={{ ...S.card, background: '#0a1a0e', border: '1px solid #1a4020', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f9ff', marginBottom: 4 }}>{km?.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, maxWidth: 480 }}>{km?.desc}</div>
            <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 4, background: '#1a4020', color: '#4ade80', marginTop: 8, display: 'inline-block' }}>{km?.role}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              ['RSS4 Rate',  `₹${km?.rss4}/kg`,             '#38bdf8'],
              ['RSS3 Rate',  `₹${km?.rss3}/kg`,             '#4ade80'],
              ['RSS5 Rate',  `₹${km?.rss5}/kg`,             '#c084fc'],
              ['vs Kottayam',`-₹${270 - (km?.rss4 ?? 248)}/kg`, '#fb923c'],
            ] as const).map(([l, v, c]) => (
              <div key={l} style={{ background: '#080b10', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: 'DM Mono' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.g2}>
        {/* Grade prices */}
        <div style={S.card}>
          <div style={S.ct}>Ujire Rubber Society — Grade Prices (₹/kg)</div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Live auction prices · 28 Jun 2026</div>
          {GRADES.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 130, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{g.grade}</div>
              <div style={{ flex: 1, height: 6, background: '#1a2744', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${g.pct}%`, height: '100%', background: g.color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: g.color, minWidth: 60, textAlign: 'right', fontFamily: 'DM Mono' }}>₹{g.price}</div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#080b10', borderRadius: 8, fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            RSS 1X (premium grade) commands ₹22/kg premium over RSS4 at Ujire. The quality spread widens during supply-tight periods.
          </div>
        </div>

        {/* District share */}
        <div style={S.card}>
          <div style={S.ct}>Karnataka Rubber Districts — Production Share</div>
          {DISTRICTS.map((d, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 600 }}>{d.share}% · {d.area}</span>
              </div>
              <div style={{ height: 5, background: '#1a2744', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${d.share * 3}%`, height: '100%', background: d.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#080b10', borderRadius: 8, fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            Hassan district is Karnataka's largest rubber belt. Coorg (Kodagu) produces premium quality rubber on mixed coffee-rubber estates.
          </div>
        </div>
      </div>

      {/* Spread chart */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={S.ct}>Karnataka (Ujire) vs Kerala (Kottayam) — Price Spread 2025</div>
          <div style={{ fontSize: 10, color: '#475569' }}>Spread = Kottayam − Ujire RSS4</div>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spreadData}>
              <defs>
                <linearGradient id="kg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="kg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis yAxisId="price"  domain={[160, 260]} tick={{ fontSize: 10, fill: '#475569' }} width={44} tickFormatter={v => `₹${v}`} />
              <YAxis yAxisId="spread" orientation="right" domain={[0, 20]} tick={{ fontSize: 10, fill: '#475569' }} width={36} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number, n: string) => [`₹${v}/kg`, n]} />
              <Area yAxisId="price" type="monotone" dataKey="kottayam" stroke="#38bdf8" fill="url(#kg2)" strokeWidth={2} dot={false} name="Kottayam" />
              <Area yAxisId="price" type="monotone" dataKey="ujire"    stroke="#4ade80" fill="url(#kg1)" strokeWidth={2} dot={false} name="Ujire" />
              <Bar  yAxisId="spread" dataKey="spread" fill="#fb923c55" name="Spread" radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10, color: '#475569', justifyContent: 'center' }}>
          <span style={{ color: '#38bdf8' }}>━ Kottayam RSS4</span>
          <span style={{ color: '#4ade80' }}>━ Ujire RSS4</span>
          <span style={{ color: '#fb923c' }}>▮ Spread (right axis)</span>
        </div>
      </div>

      {/* Multi-year history */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={S.ct}>Ujire RSS4 — 3-Year Price History (₹/kg)</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={multiYear}>
              <CartesianGrid strokeDasharray="2 5" stroke="#1a2744" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis domain={[100, 260]} tick={{ fontSize: 10, fill: '#475569' }} width={44} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number, n: string) => [`₹${v}/kg`, n]} />
              <Line type="monotone" dataKey="2023" stroke="#60a5fa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="2024" stroke="#fb923c" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="2025" stroke="#4ade80" strokeWidth={2.5} dot={{ fill: '#4ade80', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: '#475569', justifyContent: 'center' }}>
          <span style={{ color: '#60a5fa' }}>-- 2023 avg ₹159</span>
          <span style={{ color: '#fb923c' }}>━ 2024 avg ₹197</span>
          <span style={{ color: '#4ade80' }}>━ 2025 avg ₹208</span>
        </div>
      </div>

      {/* Market intelligence */}
      <div style={S.card}>
        <div style={S.ct}>Karnataka Market Intelligence</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {INTEL_SECTIONS.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 12, fontWeight: 600, color: sec.color, marginBottom: 10 }}>{sec.icon} {sec.title}</div>
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ color: sec.color, flexShrink: 0, marginTop: 1, fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
