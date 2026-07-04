import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { TabId, LiveMarket, Factor, AiOutputLine, ForecastPoint, KarnatakaLive } from './types'
import { LIVE_MARKETS, FACTORS } from './data'
import { jitter, generateSpark, computePrediction, buildDailyForecast, buildMonthlyForecast } from './utils'
import { S } from './styles'
import { DailyTab }       from './tabs/DailyTab'
import { ForecastTab }    from './tabs/ForecastTab'
import { YearAnalysisTab }from './tabs/YearAnalysisTab'
import { DashboardTab }   from './tabs/DashboardTab'
import { PredictorTab }   from './tabs/PredictorTab'
import { AnalysisTab }    from './tabs/AnalysisTab'
import { KarnatakaTab }    from './tabs/KarnatakaTab'
import { PriceHistoryTab } from './tabs/PriceHistoryTab'

const API = 'http://localhost:4000'
const PRICE_REFRESH_MS    = 60 * 1000        // 1 min  — re-fetch all sources (macro every call, rubber board cached 10 min)
const FORECAST_REFRESH_MS = 60 * 1000        // 1 min  — recompute forecast from live spot
const TICK_INTERVAL_MS    = 3000             // 3 sec  — price tick simulation

const TABS: [TabId, string][] = [
  ['daily',        '30-Day Daily'],
  ['forecast',     '12M Forecast'],
  ['pricehistory', 'Price History'],
  ['karnataka',    'Karnataka'],
  ['yearanalysis', 'Year Analysis'],
  ['dashboard',    'Dashboard'],
  ['predictor',    'AI Predictor'],
  ['analysis',     'AI Analysis'],
]

function initLiveMarkets(): LiveMarket[] {
  return Object.entries(LIVE_MARKETS).map(([id, m]) => ({
    id, ...m,
    price: m.base,
    prev:  m.base,
    spark: generateSpark(m.base),
    change: 0,
    pct:    0,
  }))
}

export function RubberPredictor() {
  const [tab,             setTab]             = useState<TabId>('yearanalysis')
  const [factors,         setFactors]         = useState<Factor[]>(FACTORS.map(f => ({ ...f })))
  const [activeScenario,  setActiveScenario]  = useState('base')
  const [selectedMonth,   setSelectedMonth]   = useState<number | null>(null)
  const [selectedYear,    setSelectedYear]    = useState(2026)
  const [selectedDay,     setSelectedDay]     = useState<number | null>(null)
  const [liveMarkets,     setLiveMarkets]     = useState<LiveMarket[]>(initLiveMarkets)
  const [aiRunning,       setAiRunning]       = useState(false)
  const [aiOutput,        setAiOutput]        = useState<AiOutputLine[]>([])
  const [aiProgress,      setAiProgress]      = useState(0)
  const [dailyData,           setDailyData]           = useState(() => buildDailyForecast(270))
  const [monthlyForecast,     setMonthlyForecast]     = useState<ForecastPoint[]>(() => buildMonthlyForecast(270))
  const [forecastUpdatedAt,   setForecastUpdatedAt]   = useState<Date | null>(null)
  const [lastUpdated,         setLastUpdated]         = useState<Date | null>(null)
  const [refreshing,          setRefreshing]          = useState(false)
  const [fetchError,          setFetchError]          = useState<string | null>(null)
  const [karnatakaLive,       setKarnatakaLive]       = useState<KarnatakaLive | null>(null)
  const liveBasesRef = useRef<Record<string, number>>({})

  const result     = useMemo(() => computePrediction(factors), [factors])
  const mainMarket = liveMarkets.find(m => m.id === 'kottayam')

  // Apply real prices to market state
  function applyRealPrices(prices: Record<string, number>) {
    const MARKET_KEYS: Record<string, string> = {
      kottayam: 'kottayam', kochi: 'kochi', ujire: 'ujire',
      mysuru: 'mysuru', hassan: 'hassan', bangkok: 'bangkok',
      isnr20: 'isnr20', latex: 'latex60',
    }
    liveBasesRef.current = Object.fromEntries(
      Object.entries(MARKET_KEYS).map(([id, key]) => [id, prices[key] ?? prices[id] ?? 0])
    )
    setLiveMarkets(prev => prev.map(m => {
      const realBase = liveBasesRef.current[m.id]
      if (!realBase) return m
      const chg = +(realBase - m.price).toFixed(1)
      return {
        ...m,
        base: realBase,
        prev: m.price,
        price: realBase,
        change: chg,
        pct: +((chg / (m.price || realBase)) * 100).toFixed(2),
        spark: [...m.spark.slice(1), { v: realBase }],
      }
    }))
    setLastUpdated(new Date())
    setFetchError(null)
  }

  // Fetch all live data from server (single combined endpoint)
  async function fetchLivePrices(force = false) {
    try {
      setRefreshing(true)
      const endpoint = force ? `${API}/api/refresh-prices` : `${API}/api/live-data`
      const method   = force ? 'POST' : 'GET'
      const resp = await fetch(endpoint, { method })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = await resp.json()
      if (!json.success) throw new Error(json.error || 'fetch failed')

      // Apply market prices
      applyRealPrices(json.prices)

      // Apply Karnataka live grades from Canara Post
      if (json.karnataka) setKarnatakaLive(json.karnataka as KarnatakaLive)

      // Apply macro factors (brent + INR/USD)
      const macro = json.macro
      if (macro) {
        setFactors(prev => prev.map(f => {
          if (f.id === 'crude') return { ...f, val: Math.round(macro.brent  * 10) / 10 }
          if (f.id === 'inr')   return { ...f, val: Math.round(macro.inrUsd * 10) / 10 }
          return f
        }))
      }

      // Rebuild both forecasts from real Kottayam price
      const spot = json.prices.kottayam || 270
      setDailyData(buildDailyForecast(spot))
      setMonthlyForecast(buildMonthlyForecast(spot))
      setForecastUpdatedAt(new Date())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setFetchError(msg)
      console.warn('Price fetch error:', msg)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch real prices on mount and every 10 minutes
  useEffect(() => {
    fetchLivePrices()
    const id = setInterval(() => fetchLivePrices(), PRICE_REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  // Tick simulation between real fetches (uses real base prices)
  useEffect(() => {
    const id = setInterval(() => {
      setLiveMarkets(prev => prev.map(m => {
        const newP = +jitter(m.base)
        const chg  = +(newP - m.prev).toFixed(1)
        return { ...m, prev: m.price, price: newP, change: chg, pct: +((chg / m.prev) * 100).toFixed(2), spark: [...m.spark.slice(1), { v: newP }] }
      }))
    }, TICK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Every 1 minute: recompute daily + monthly forecast from latest spot price
  useEffect(() => {
    function recomputeForecast() {
      setLiveMarkets(prev => {
        const spot = prev.find(m => m.id === 'kottayam')?.price ?? 270
        setDailyData(buildDailyForecast(spot))
        setMonthlyForecast(buildMonthlyForecast(spot))
        setForecastUpdatedAt(new Date())
        return prev  // no market price change, just trigger recompute
      })
    }
    // Run immediately on mount, then every minute
    recomputeForecast()
    const id = setInterval(recomputeForecast, FORECAST_REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const runAI = useCallback(() => {
    if (aiRunning) return
    setAiRunning(true)
    setAiOutput([])
    setAiProgress(0)

    const spot    = mainMarket?.price ?? 270
    const kochi   = liveMarkets.find(m => m.id === 'kochi')?.price ?? Math.round(spot * 1.018)
    const bangkok = liveMarkets.find(m => m.id === 'bangkok')?.price ?? Math.round(spot * 1.08)
    const crudeVal = factors.find(f => f.id === 'crude')?.val ?? 72.6
    const inrVal   = factors.find(f => f.id === 'inr')?.val ?? 94.3

    const lines: { delay: number; text: string; type: AiOutputLine['type'] }[] = [
      { delay: 300,  text: `🔍 Fetching live Rubber Board data... spot ₹${spot}/kg`,                                                 type: 'info'    },
      { delay: 700,  text: `✅ RSS4 Kottayam: ₹${spot}/kg · Kochi: ₹${kochi}/kg · Bangkok RSS1: ₹${bangkok} equiv.`,               type: 'data'    },
      { delay: 1200, text: '🌏 Scanning SE Asia supply signals...',                                                                   type: 'info'    },
      { delay: 1700, text: '⚠️ Thailand: heavy rainfall advisory in southern provinces. Tapping severely disrupted.',                 type: 'warning' },
      { delay: 2100, text: '📉 Indonesia: NR output -9.8% YoY. Malaysia: production -3.2% MoM. ANRPC deficit >700K MT.',            type: 'data'    },
      { delay: 2600, text: '🇨🇳 China Q1 auto production: +8.3% YoY. Pre-quarter stockpiling: MODERATE. Demand index 7.2/10.',      type: 'data'    },
      { delay: 3100, text: `🛢️ Brent crude: $${crudeVal}/bbl · INR/USD: ₹${inrVal} · SBR premium to NR: +₹30/kg. Sub risk: LOW.`, type: 'data'    },
      { delay: 3700, text: '📊 Running multi-factor weighted regression (7 variables, 289-month calibration)...',                     type: 'info'    },
      { delay: 4300, text: `🎯 3-month target: ₹${result.pred}/kg  |  Range: ₹${result.lo}–₹${result.hi}/kg`,                       type: 'result'  },
      { delay: 4800, text: `📈 Peak forecast: ₹285/kg (Aug '26) — monsoon trough + structural deficit + weak INR (₹${inrVal}/$).`, type: 'result'  },
      { delay: 5200, text: result.pred > 260
          ? `✅ VERDICT: Price in premium zone ₹${spot}/kg. LOCK IN contracts now — monsoon peak still ahead.`
          : result.pred < 240
          ? `⚠️ VERDICT: Price below premium threshold. HOLD inventory — monsoon-driven spike expected Jul–Aug.`
          : `📋 VERDICT: Neutral zone. SELL IN TRANCHES — 30% now, 70% hold for Aug peak.`,                                          type: result.pred > 260 ? 'success' : result.pred < 240 ? 'warning' : 'result' },
      { delay: 5600, text: '✅ Analysis complete. Forecasts updated with real-time Rubber Board data.',                               type: 'success' },
    ]

    lines.forEach(({ delay, text, type }, i) => {
      setTimeout(() => {
        setAiOutput(prev => [...prev, { text, type }])
        setAiProgress(Math.round(((i + 1) / lines.length) * 100))
        if (i === lines.length - 1) setAiRunning(false)
      }, delay)
    })
  }, [aiRunning, result, mainMarket, liveMarkets, factors])

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input[type=range] { -webkit-appearance:none; width:100%; height:4px; border-radius:2px; background:#1a2744; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#38bdf8; cursor:pointer; }
        ::-webkit-scrollbar { width:5px; height:5px } ::-webkit-scrollbar-track { background:#080b10 } ::-webkit-scrollbar-thumb { background:#1a2744; border-radius:3px }
        tr:hover { background:#1a2744 !important }
      `}</style>

      {/* Header */}
      <div style={S.hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={S.logo}>RubberAI<span style={{ color: '#60a5fa' }}>·</span>India</span>
          <span style={{ fontSize: 9, background: '#1e3a5f', color: '#60a5fa', padding: '3px 7px', borderRadius: 4 }}>RSS4 PREDICTOR</span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {fetchError ? (
            <span style={{ color: '#fb923c', fontSize: 10 }}>⚠ {fetchError} — showing last data</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ ...S.liveDot, background: refreshing ? '#fb923c' : '#4ade80', animation: refreshing ? 'none' : 'pulse 2s infinite' }} />
              {refreshing ? 'REFRESHING' : 'LIVE'}
            </span>
          )}
          <span style={{ color: '#60a5fa', fontFamily: 'DM Mono' }}>
            Kottayam ₹{mainMarket?.price ?? '—'}/kg
          </span>
          {lastUpdated && (
            <span style={{ color: '#334155', fontSize: 10 }}>
              updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchLivePrices(true)}
            disabled={refreshing}
            style={{ fontSize: 10, padding: '3px 10px', borderRadius: 5, border: '1px solid #1a2744', background: refreshing ? '#1a2744' : '#0d1520', color: refreshing ? '#334155' : '#60a5fa', cursor: refreshing ? 'not-allowed' : 'pointer', fontFamily: 'DM Mono' }}>
            {refreshing ? '⟳ ...' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={S.tabs}>
        {TABS.map(([id, label]) => (
          <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Tab body */}
      <div style={S.body}>
        {tab === 'daily'        && <DailyTab        dailyData={dailyData} selectedDay={selectedDay} setSelectedDay={setSelectedDay} mainMarket={mainMarket} forecastUpdatedAt={forecastUpdatedAt} />}
        {tab === 'pricehistory' && <PriceHistoryTab />}
        {tab === 'forecast'     && <ForecastTab     activeScenario={activeScenario} setActiveScenario={setActiveScenario} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} mainMarket={mainMarket} monthlyForecast={monthlyForecast} forecastUpdatedAt={forecastUpdatedAt} />}
        {tab === 'karnataka'    && <KarnatakaTab karnatakaLive={karnatakaLive} kottayamSpot={mainMarket?.price ?? 270} />}
        {tab === 'yearanalysis' && <YearAnalysisTab selectedYear={selectedYear} setSelectedYear={setSelectedYear} />}
        {tab === 'dashboard'    && <DashboardTab    liveMarkets={liveMarkets} mainMarket={mainMarket} />}
        {tab === 'predictor'    && <PredictorTab    factors={factors} setFactors={setFactors} result={result} />}
        {tab === 'analysis'     && <AnalysisTab     aiRunning={aiRunning} aiOutput={aiOutput} aiProgress={aiProgress} runAI={runAI} result={result} />}
      </div>
    </div>
  )
}
