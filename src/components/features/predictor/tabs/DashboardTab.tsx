import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { LiveMarket } from '../types'
import { NEWS_FEED, TAG_COLORS } from '../data'
import { S } from '../styles'

type Props = {
  liveMarkets: LiveMarket[]
  mainMarket: LiveMarket | undefined
}

function MarketCard({ m }: { m: LiveMarket }) {
  return (
    <div style={{ ...S.card, borderColor: m.change >= 0 ? '#14532d' : '#7f1d1d' }}>
      <div style={S.ct}>{m.label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: '#f0f9ff', fontFamily: 'DM Mono' }}>₹{m.price}</div>
      <div style={{ fontSize: 10, color: m.change >= 0 ? '#4ade80' : '#f87171', marginTop: 3 }}>
        {m.change >= 0 ? '▲' : '▼'} {Math.abs(m.change)} ({Math.abs(m.pct)}%)
      </div>
      <div style={{ marginTop: 7, height: 28 }}>
        <ResponsiveContainer width="100%" height={28}>
          <LineChart data={m.spark}>
            <Line type="monotone" dataKey="v" stroke={m.change >= 0 ? '#4ade80' : '#f87171'} dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>{m.grade}</div>
    </div>
  )
}

export function DashboardTab({ liveMarkets, mainMarket }: Props) {
  const keralaMarkets    = liveMarkets.filter(m => ['kottayam', 'kochi', 'isnr20', 'latex'].includes(m.id))
  const karnatakaMarkets = liveMarkets.filter(m => ['ujire', 'mysuru', 'hassan'].includes(m.id))
  const globalMarkets    = liveMarkets.filter(m => m.id === 'bangkok')

  return (
    <>
      <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Kerala Markets</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 14 }}>
        {keralaMarkets.map(m => <MarketCard key={m.id} m={m} />)}
      </div>

      <div style={{ fontSize: 10, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Karnataka Markets</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 14 }}>
        {[...karnatakaMarkets, ...globalMarkets].map(m => <MarketCard key={m.id} m={m} />)}
      </div>

      <div style={S.g2}>
        <div style={S.card}>
          <div style={S.ct}>Kottayam RSS4 — Intraday</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mainMarket?.spark.map((d, i) => ({ ...d, t: i }))}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a2744" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#475569' }} width={40} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2744', fontSize: 11 }} formatter={(v: number) => [`₹${v}/kg`, 'Price']} />
                <ReferenceLine y={250} stroke="#f87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="v" stroke="#38bdf8" fill="url(#pg)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...S.card, overflowY: 'auto', maxHeight: 255 }}>
          <div style={S.ct}>Live Signal Feed</div>
          {NEWS_FEED.map((n, i) => {
            const tc = TAG_COLORS[n.tag] ?? TAG_COLORS['GLOBAL']
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{n.tag}</span>
                    <span style={{ fontSize: 9, color: '#475569' }}>{n.time} ago</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{n.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
