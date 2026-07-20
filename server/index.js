import express from 'express'
import cors from 'cors'
import { connectDb } from './db.js'
import { scrapeRubberBoard, fetchMacro, scrapeKarnatakaPost, fetchCommoditiesApi } from './services/priceSources.js'
import { fetchTyreStocks } from './services/tyreStocks.js'
import { fetchProducerFx } from './services/producerFx.js'
import { fetchChinaDemand } from './services/chinaDemand.js'
import { fetchAutoStocks } from './services/autoStocks.js'
import { fetchShippingIndex } from './services/shipping.js'
import { fetchDomesticSignals } from './services/domesticSignals.js'
import { saveFactorSnapshot } from './services/factorHistory.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import customerRoutes from './routes/customers.js'
import productRoutes from './routes/products.js'
import transactionRoutes from './routes/transactions.js'
import orderRoutes from './routes/orders.js'
import priceRoutes from './routes/prices.js'
import purchaseRateRoutes from './routes/purchaseRates.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', customerRoutes)
app.use('/api', productRoutes)
app.use('/api', transactionRoutes)
app.use('/api', orderRoutes)
app.use('/api', priceRoutes)
app.use('/api', purchaseRateRoutes)

// Snapshots every live-derived factor value so each can be charted over time
// (see /api/factor-history). Each underlying fetch is cheap — they're all
// backed by their own 5-30 min caches — so sampling once a minute just
// records whatever the current cached value is (repeating it until the
// source refreshes), giving the trend charts points quickly without adding
// real request load.
async function snapshotFactors() {
  try {
    const [macro, tyre, fx, china, auto, ship, domestic] = await Promise.all([
      fetchMacro(),
      fetchTyreStocks(),
      fetchProducerFx(),
      fetchChinaDemand(),
      fetchAutoStocks(),
      fetchShippingIndex(),
      fetchDomesticSignals(),
    ])
    await saveFactorSnapshot({
      crude:      macro?.brent ?? null,
      inr:        macro?.inrUsd ?? null,
      tireDemand: tyre?.tireDemandIndex ?? null,
      producerFx: fx?.strengthIndex ?? null,
      china:      china?.demandIndex ?? null,
      autoSales:  auto?.autoSalesIndex ?? null,
      shipping:   ship?.shippingIndex ?? null,
      deficit:    domestic?.deficitIndex ?? null,
      seasia:     domestic?.seasiaIndex ?? null,
    })
  } catch (err) {
    console.warn('Factor snapshot failed:', err.message)
  }
}

connectDb()
  .then(() => {
    // Pre-warm all caches on startup
    scrapeRubberBoard().catch(e => console.warn('Rubber Board pre-warm failed:', e.message))
    fetchMacro().catch(e => console.warn('Macro pre-warm failed:', e.message))
    scrapeKarnatakaPost().catch(e => console.warn('Karnataka pre-warm failed:', e.message))
    fetchCommoditiesApi().catch(e => console.warn('Commodities pre-warm failed:', e.message))
    fetchTyreStocks().catch(e => console.warn('Tyre stocks pre-warm failed:', e.message))
    fetchProducerFx().catch(e => console.warn('Producer FX pre-warm failed:', e.message))
    fetchChinaDemand().catch(e => console.warn('China demand pre-warm failed:', e.message))
    fetchAutoStocks().catch(e => console.warn('Auto stocks pre-warm failed:', e.message))
    fetchShippingIndex().catch(e => console.warn('Shipping index pre-warm failed:', e.message))
    fetchDomesticSignals().catch(e => console.warn('Domestic signals pre-warm failed:', e.message))
    setTimeout(snapshotFactors, 5000)
    setInterval(snapshotFactors, 60 * 1000)
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
