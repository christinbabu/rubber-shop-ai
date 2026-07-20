import { Router } from 'express'
import { getDb } from '../db.js'
import {
  cache,
  scrapeRubberBoard,
  fetchMacro,
  scrapeKarnatakaPost,
  fetchCommoditiesApi,
  savePriceSnapshot,
} from '../services/priceSources.js'
import { fetchTyreStocks } from '../services/tyreStocks.js'
import { fetchProducerFx } from '../services/producerFx.js'
import { fetchChinaDemand } from '../services/chinaDemand.js'
import { fetchTokyoMarket } from '../services/tokyoMarket.js'
import { fetchAutoStocks } from '../services/autoStocks.js'
import { fetchShippingIndex } from '../services/shipping.js'
import { fetchDomesticSignals } from '../services/domesticSignals.js'
import { getFactorHistory } from '../services/factorHistory.js'

const router = Router()

// ─── RUBBER PRICE LIVE ENDPOINTS ─────────────────────────────────────────────

router.get('/rubber-prices', async (req, res) => {
  try {
    const data = await scrapeRubberBoard()
    // Derive Karnataka prices (8% discount from Kottayam RSS4)
    const k = data.kottayam_rss4
    res.json({
      success: true,
      prices: {
        kottayam: k,
        kochi:    Math.round(k * 1.018),           // Kochi premium ~₹5
        ujire:    Math.round(k * 0.92),            // 8% discount
        mysuru:   Math.round(k * 0.93),            // 7% discount
        hassan:   Math.round(k * 0.915),           // 8.5% discount
        madikeri: Math.round(k * 0.905),
        sagara:   Math.round(k * 0.895),
        bangkok:  data.intl_rss1,                  // international RSS1
        isnr20:   data.isnr20,
        latex60:  data.latex60,
        kottayam_rss5: data.kottayam_rss5,
        intl_rss4:     data.intl_rss4,
      },
      meta: {
        fetchedAt: data.fetchedAt,
        source: data.source,
        cacheAgeMs: Date.now() - cache.rubberPrices.at,
      },
    })
  } catch (err) {
    console.error('rubber-prices fetch error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

router.get('/macro', async (req, res) => {
  try {
    const data = await fetchMacro()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('macro fetch error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// Force-refresh all caches (bypasses TTL) — returns full live-data payload
router.post('/refresh-prices', async (req, res) => {
  try {
    cache.rubberPrices.at = 0
    cache.macro.at        = 0
    cache.karnataka.at    = 0
    cache.commodities.at  = 0
    const [rbResult, macroResult, kaResult, commResult] = await Promise.allSettled([
      scrapeRubberBoard(),
      fetchMacro(),
      scrapeKarnatakaPost(),
      fetchCommoditiesApi(),
    ])
    const rb    = rbResult.value    ?? null
    const macro = macroResult.value ?? null
    const ka    = kaResult.value    ?? null
    const comm  = commResult.value  ?? null
    const k     = rb?.kottayam_rss4 ?? 0
    const prices = {
      kottayam: k,
      kochi:    Math.round(k * 1.018),
      ujire:    ka?.ujire?.rss4    ?? Math.round(k * 0.92),
      mysuru:   ka?.mysuru?.rss4   ?? Math.round(k * 0.93),
      hassan:   ka?.hassan?.rss4   ?? Math.round(k * 0.915),
      madikeri: ka?.madikeri?.rss4 ?? Math.round(k * 0.905),
      sagara:   ka?.sagara?.rss4   ?? Math.round(k * 0.895),
      bangkok:  comm?.bangkokRss3Inr ?? ka?.bangkokRss3 ?? rb?.intl_rss1 ?? 0,
      isnr20:   ka?.isnr20  ?? rb?.isnr20  ?? 0,
      latex60:  ka?.latex60 ?? rb?.latex60 ?? 0,
      kottayam_rss5: rb?.kottayam_rss5 ?? Math.round(k * 0.984),
      intl_rss4:     ka?.bangkokRss4   ?? rb?.intl_rss4 ?? Math.round(k * 1.067),
    }
    if (rb) savePriceSnapshot(rb, macro, ka).catch(() => {})
    res.json({ success: true, prices, karnataka: ka, macro, commodities: comm, fetchedAt: rb?.fetchedAt ?? new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Source 2 endpoint: Karnataka grade prices from Canara Post ───────────────
router.get('/karnataka-prices', async (req, res) => {
  try {
    const data = await scrapeKarnatakaPost()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('karnataka-prices error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Source 8 endpoint: Bangkok RSS3 via Commodities-API ─────────────────────
router.get('/commodity-prices', async (req, res) => {
  try {
    const data = await fetchCommoditiesApi()
    if (!data) return res.json({ success: false, error: 'COMMODITIES_API_KEY not configured' })
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('commodity-prices error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Combined live-data endpoint (all sources in one call) ────────────────────
router.get('/live-data', async (req, res) => {
  try {
    const [rbResult, macroResult, kaResult, commResult] = await Promise.allSettled([
      scrapeRubberBoard(),
      fetchMacro(),
      scrapeKarnatakaPost(),
      fetchCommoditiesApi(),
    ])
    const rb    = rbResult.value    ?? null
    const macro = macroResult.value ?? null
    const ka    = kaResult.value    ?? null
    const comm  = commResult.value  ?? null
    const k     = rb?.kottayam_rss4 ?? 0

    if (rb) savePriceSnapshot(rb, macro, ka).catch(() => {})

    res.json({
      success: true,
      prices: {
        kottayam: k,
        kochi:    Math.round(k * 1.018),
        ujire:    ka?.ujire?.rss4    ?? Math.round(k * 0.92),
        mysuru:   ka?.mysuru?.rss4   ?? Math.round(k * 0.93),
        hassan:   ka?.hassan?.rss4   ?? Math.round(k * 0.915),
        madikeri: ka?.madikeri?.rss4 ?? Math.round(k * 0.905),
        sagara:   ka?.sagara?.rss4   ?? Math.round(k * 0.895),
        // Bangkok: prefer Commodities-API → Canara Post (free) → Rubber Board intl
        bangkok:  comm?.bangkokRss3Inr ?? ka?.bangkokRss3 ?? rb?.intl_rss1 ?? 0,
        // ISNR20 + Latex: prefer Canara Post (more reliable) → Rubber Board
        isnr20:   ka?.isnr20  ?? rb?.isnr20  ?? 0,
        latex60:  ka?.latex60 ?? rb?.latex60 ?? 0,
        kottayam_rss5: rb?.kottayam_rss5 ?? Math.round(k * 0.984),
        intl_rss4:     ka?.bangkokRss4   ?? rb?.intl_rss4 ?? Math.round(k * 1.067),
      },
      karnataka:   ka,
      macro,
      commodities: comm,
      fetchedAt: new Date().toISOString(),
      sources: {
        rubberBoard: rbResult.status === 'fulfilled' ? (rb?.source ?? 'ok') : 'error',
        macro:       macroResult.status === 'fulfilled' ? (macro?.source ?? 'ok') : 'error',
        karnataka:   kaResult.status === 'fulfilled'   ? (ka?.source ?? 'ok') : 'error',
        commodities: commResult.status === 'fulfilled' ? (comm?.source ?? 'no-key') : 'error',
      },
    })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live tyre-maker share prices (proxy for tire industry demand) ───────────
router.get('/tyre-stocks', async (req, res) => {
  try {
    const data = await fetchTyreStocks()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('tyre-stocks error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live producer-country FX basket (THB/IDR/VND vs USD) ───────────────────
router.get('/producer-fx', async (req, res) => {
  try {
    const data = await fetchProducerFx()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('producer-fx error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live China demand proxy (CNY/USD + Shanghai Composite) ──────────────────
router.get('/china-demand', async (req, res) => {
  try {
    const data = await fetchChinaDemand()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('china-demand error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live Tokyo (OSE) rubber market proxy (JPY/USD + Nikkei 225) ────────────
router.get('/tokyo-market', async (req, res) => {
  try {
    const data = await fetchTokyoMarket()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('tokyo-market error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live auto-maker share prices (proxy for auto sales & EV mix) ────────────
router.get('/auto-stocks', async (req, res) => {
  try {
    const data = await fetchAutoStocks()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('auto-stocks error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live shipping/freight proxy (BDRY — Baltic Dry Index futures ETF) ───────
router.get('/shipping-index', async (req, res) => {
  try {
    const data = await fetchShippingIndex()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('shipping-index error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Derived India deficit & SE Asia supply signals (from scraped prices) ────
router.get('/domestic-signals', async (req, res) => {
  try {
    const data = await fetchDomesticSignals()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('domestic-signals error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Price History endpoint ───────────────────────────────────────────────────
router.get('/price-history', async (req, res) => {
  try {
    const days  = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const db = getDb()
    const records = await db.collection('rubber_prices_history')
      .find({ fetchedAt: { $gte: since } })
      .sort({ fetchedAt: 1 })
      .toArray()
    const total = await db.collection('rubber_prices_history').countDocuments()
    res.json({
      success: true,
      count: records.length,
      total,
      days,
      records: records.map(r => ({
        date:     r.fetchedAt,
        kottayam: r.kottayam,
        kochi:    r.kochi,
        rss5:     r.rss5,
        isnr20:   r.isnr20,
        latex60:  r.latex60,
        ujire:    r.ujire,
        mysuru:   r.mysuru,
        hassan:   r.hassan,
        bangkok:  r.bangkok,
        brent:    r.brent,
        inrUsd:   r.inrUsd,
        source:   r.source,
      })),
    })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Live factor history endpoint (one time series per live-derived factor) ──
router.get('/factor-history', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const records = await getFactorHistory(days)
    res.json({
      success: true,
      count: records.length,
      days,
      records: records.map(r => ({
        date:       r.fetchedAt,
        tireDemand: r.tireDemand ?? null,
        china:      r.china ?? null,
        deficit:    r.deficit ?? null,
        seasia:     r.seasia ?? null,
        producerFx: r.producerFx ?? null,
        autoSales:  r.autoSales ?? null,
        shipping:   r.shipping ?? null,
        crude:      r.crude ?? null,
        inr:        r.inr ?? null,
      })),
    })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

export default router
