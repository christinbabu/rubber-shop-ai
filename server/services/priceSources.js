import * as cheerio from 'cheerio'
import { getDb } from '../db.js'

// ─── In-memory price cache (avoids hammering external sites) ─────────────────
export const cache = {
  rubberPrices: { data: null, at: 0, ttl: 10 * 60 * 1000 },  // 10 min
  macro:        { data: null, at: 0, ttl: 55 * 1000 },       // 55 sec — re-fetched on every 1-min React poll
  karnataka:   { data: null, at: 0, ttl: 60 * 60 * 1000 },  // 1 hr — Canara Post
  commodities: { data: null, at: 0, ttl: 60 * 60 * 1000 },  // 1 hr — Commodities-API
}

export async function scrapeRubberBoard() {
  if (cache.rubberPrices.data && Date.now() - cache.rubberPrices.at < cache.rubberPrices.ttl) {
    return cache.rubberPrices.data
  }
  const resp = await fetch('https://rubberboard.gov.in/public', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(12000),
  })
  const html = await resp.text()
  const $ = cheerio.load(html)

  const priceTables = []
  $('table').each((_, el) => {
    const text = $(el).text()
    if (text.includes('RSS')) priceTables.push(el)
  })

  function parseTable(el) {
    const rows = {}
    $(el).find('tr').each((_, row) => {
      const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get()
      if (cells.length >= 2) {
        const val = parseFloat(cells[1])
        if (!isNaN(val) && val > 100) {
          rows[cells[0]] = Math.round(val / 100)  // ₹/100kg → ₹/kg
        }
      }
    })
    return rows
  }

  const indian = priceTables[0] ? parseTable(priceTables[0]) : {}
  const intl   = priceTables[3] ? parseTable(priceTables[3]) : {}
  const other  = priceTables[4] ? parseTable(priceTables[4]) : {}

  const result = {
    kottayam_rss4: indian['RSS4'] || 0,
    kottayam_rss5: indian['RSS5'] || 0,
    intl_rss1:     intl['RSS1']   || 0,
    intl_rss2:     intl['RSS2']   || 0,
    intl_rss3:     intl['RSS3']   || 0,
    intl_rss4:     intl['RSS4']   || 0,
    intl_rss5:     intl['RSS5']   || 0,
    isnr20:        other['SMR20'] || 0,
    latex60:       other['LATEX(60%)'] || 0,
    fetchedAt:     new Date().toISOString(),
    source:        'rubberboard.gov.in',
  }

  cache.rubberPrices = { data: result, at: Date.now(), ttl: 10 * 60 * 1000 }
  return result
}

async function fetchYahooPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  const json = await resp.json()
  const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  const last = [...closes].reverse().find(v => v != null)
  return last ? Math.round(last * 100) / 100 : null
}

// Brent crude spot price, scraped from the TradingEconomics commodity page.
// The page renders a table of futures quotes; the Brent row carries the
// Bloomberg ticker "CO1:COM" (ICE Brent front-month), which we match directly
// in the raw HTML — no JS execution needed since the table is server-rendered.
async function fetchBrentTradingEconomics() {
  const resp = await fetch('https://tradingeconomics.com/commodity/brent-crude-oil', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const html = await resp.text()
  const match = html.match(/data-symbol="CO1:COM"[^>]*>[\s\S]*?id="p">\s*([\d.]+)/)
  const price = match ? parseFloat(match[1]) : null
  if (!price) throw new Error('Brent price not found in TradingEconomics page')
  return price
}

export async function fetchMacro() {
  if (cache.macro.data && Date.now() - cache.macro.at < cache.macro.ttl) {
    return cache.macro.data
  }
  const [brentTE, inrUsd] = await Promise.allSettled([
    fetchBrentTradingEconomics(),
    fetchYahooPrice('INR=X'),
  ])

  let brent = brentTE.status === 'fulfilled' ? brentTE.value : null
  let brentSource = 'TradingEconomics'
  if (!brent) {
    const fallback = await fetchYahooPrice('BZ=F').catch(() => null)
    brent = fallback ?? 0
    brentSource = fallback ? 'Yahoo Finance' : 'unavailable'
  }

  const result = {
    brent,
    inrUsd:    inrUsd.status === 'fulfilled' && inrUsd.value ? inrUsd.value : 0,
    fetchedAt: new Date().toISOString(),
    source:    `${brentSource} (Brent) · Yahoo Finance (INR/USD)`,
  }

  cache.macro = { data: result, at: Date.now(), ttl: 30 * 60 * 1000 }
  return result
}

// ─── Source 2: Canara Post (Karnataka / Ujire prices) ────────────────────────

function buildKarnatakaResult(grades, source) {
  const rss4 = grades.rss4
  return {
    ujire:    grades,
    mysuru:   { rss4: Math.round(rss4 * 1.012), rss1x: Math.round(grades.rss1x * 1.012) },
    hassan:   { rss4: Math.round(rss4 * 0.995), rss1x: Math.round(grades.rss1x * 0.995) },
    madikeri: { rss4: Math.round(rss4 * 0.985), rss1x: Math.round(grades.rss1x * 0.985) },
    sagara:   { rss4: Math.round(rss4 * 0.975), rss1x: Math.round(grades.rss1x * 0.975) },
    fetchedAt: new Date().toISOString(),
    source,
  }
}

export async function scrapeKarnatakaPost() {
  if (cache.karnataka.data && Date.now() - cache.karnataka.at < cache.karnataka.ttl) {
    return cache.karnataka.data
  }

  // The Canara Post page publishes Kerala + Bangkok prices in Rs/100kg as plain text
  // (not Karnataka/Ujire-specific grades). We extract: Bangkok RSS4, ISNR20, Latex.
  // Karnataka Ujire grades are derived from Kottayam at known discount ratios.
  let bangkokRss4 = null, isnr20 = null, latex60 = null, canaraKottayam = null
  try {
    const resp = await fetch(
      'https://thecanarapost.com/todays-rubber-prices-kottayam-and-international-market/',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(12000),
      },
    )
    const html = await resp.text()
    const $ = cheerio.load(html)
    const text = $('body').text()

    // Pattern (prices in Rs/100kg): RSS4<kottayam><optional_change><agartala><bangkok>
    // e.g. "RSS426900 (+100)2600026595 (+292)"
    const rss4m = text.match(/RSS4(\d{5,6})\s*(?:\([^)]*\))?\s*(\d{5,6})\s*(\d{5,6})/)
    const isnrm = text.match(/ISNR20(\d{4,6})/)
    const latxm = text.match(/Latex\(60%\)(\d{4,6})/)

    if (rss4m) {
      canaraKottayam = Math.round(parseInt(rss4m[1]) / 100)  // cross-check value
      bangkokRss4    = Math.round(parseInt(rss4m[3]) / 100)
    }
    if (isnrm) isnr20  = Math.round(parseInt(isnrm[1]) / 100)
    if (latxm) latex60 = Math.round(parseInt(latxm[1]) / 100)
  } catch (err) {
    console.warn('Canara Post fetch failed:', err.message)
  }

  // Build Karnataka derived grades from Rubber Board + combine Bangkok/ISNR20/Latex extras
  const rb   = await scrapeRubberBoard()
  const k    = rb.kottayam_rss4
  const rss4 = Math.round(k * 0.92)   // Ujire RSS4 ≈ 92% of Kottayam (7–9% structural discount)

  const grades = {
    rss1x: Math.round(rss4 * 1.069),
    rss3:  Math.round(rss4 * 1.069),
    rss4,
    rss5:  Math.round(rss4 * 0.972),
    lot:   Math.round(rss4 * 0.859),
    si:    Math.round(rss4 * 0.601),
    sii:   Math.round(rss4 * 0.556),
  }

  const source = bangkokRss4 ? 'thecanarapost.com' : 'derived (Canara Post unavailable)'
  const result = {
    ...buildKarnatakaResult(grades, source),
    bangkokRss4:    bangkokRss4 ?? rb.intl_rss1,
    bangkokRss3:    bangkokRss4 ? Math.round(bangkokRss4 * 1.008) : rb.intl_rss1,
    isnr20:         isnr20      ?? rb.isnr20,
    latex60:        latex60     ?? rb.latex60,
    canaraKottayam,
  }
  cache.karnataka = { data: result, at: Date.now(), ttl: bangkokRss4 ? 60 * 60 * 1000 : 15 * 60 * 1000 }
  return result
}

// ─── Source 8: Commodities-API (Bangkok RSS3 via international NR price) ─────

export async function fetchCommoditiesApi() {
  if (cache.commodities.data && Date.now() - cache.commodities.at < cache.commodities.ttl) {
    return cache.commodities.data
  }
  const key = process.env.COMMODITIES_API_KEY
  if (!key) return null  // skip silently — key is optional

  const url = `https://api.commodities-api.com/api/latest?access_key=${key}&symbols=RUBBER&base=USD`
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const json = await resp.json()

  if (!json.success || !json.data?.rates?.RUBBER) {
    throw new Error(json.error?.info || 'Commodities API returned no RUBBER rate')
  }

  const rate = json.data.rates.RUBBER
  // API returns units-per-USD when base=USD; natural rubber ~$1.5–2/kg → rate ~0.5–0.67
  const rubberUsdKg = rate < 5 ? Math.round((1 / rate) * 100) / 100 : Math.round(rate * 100) / 100
  const macro       = await fetchMacro()
  const rubberInrKg = Math.round(rubberUsdKg * macro.inrUsd)
  const bangkokRss3 = Math.round(rubberInrKg * 1.02)   // RSS3 ~+2% premium over generic NR

  const result = {
    rubberUsdKg,
    rubberInrKg,
    bangkokRss3Inr: bangkokRss3,
    fetchedAt: new Date().toISOString(),
    source: 'commodities-api.com',
  }
  cache.commodities = { data: result, at: Date.now(), ttl: 60 * 60 * 1000 }
  return result
}

// ─── Price History: persist fetched prices to MongoDB ────────────────────────
let lastSnapshotAt = 0
export async function savePriceSnapshot(rb, macro, ka) {
  const db = getDb()
  if (!db) return
  if (Date.now() - lastSnapshotAt < 5 * 60 * 1000) return   // max 1 save per 5 min
  const k = rb?.kottayam_rss4 ?? 0
  try {
    await db.collection('rubber_prices_history').insertOne({
      fetchedAt: new Date(),
      kottayam:  k,
      kochi:     Math.round(k * 1.018),
      rss5:      rb?.kottayam_rss5 ?? Math.round(k * 0.984),
      isnr20:    ka?.isnr20  ?? rb?.isnr20  ?? 0,
      latex60:   ka?.latex60 ?? rb?.latex60 ?? 0,
      ujire:     ka?.ujire?.rss4  ?? Math.round(k * 0.92),
      mysuru:    ka?.mysuru?.rss4 ?? Math.round(k * 0.93),
      hassan:    ka?.hassan?.rss4 ?? Math.round(k * 0.915),
      bangkok:   ka?.bangkokRss3  ?? rb?.intl_rss1 ?? 0,
      brent:     macro?.brent  ?? 0,
      inrUsd:    macro?.inrUsd ?? 0,
      source:    rb?.source ?? 'rubberboard.gov.in',
    })
    lastSnapshotAt = Date.now()
    console.log('[DB] Price snapshot saved — Kottayam RSS4', k, '₹/kg')
  } catch (err) {
    console.warn('[DB] Snapshot save failed:', err.message)
  }
}
