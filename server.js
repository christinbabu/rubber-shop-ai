import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import * as cheerio from 'cheerio'

dotenv.config()

// ─── In-memory price cache (avoids hammering external sites) ─────────────────
const cache = {
  rubberPrices: { data: null, at: 0, ttl: 10 * 60 * 1000 },  // 10 min
  macro:        { data: null, at: 0, ttl: 55 * 1000 },       // 55 sec — re-fetched on every 1-min React poll
  karnataka:   { data: null, at: 0, ttl: 60 * 60 * 1000 },  // 1 hr — Canara Post
  commodities: { data: null, at: 0, ttl: 60 * 60 * 1000 },  // 1 hr — Commodities-API
}

async function scrapeRubberBoard() {
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
    kottayam_rss4: indian['RSS4'] || 270,
    kottayam_rss5: indian['RSS5'] || 266,
    intl_rss1:     intl['RSS1']   || 292,
    intl_rss2:     intl['RSS2']   || 290,
    intl_rss3:     intl['RSS3']   || 289,
    intl_rss4:     intl['RSS4']   || 288,
    intl_rss5:     intl['RSS5']   || 287,
    isnr20:        other['SMR20'] || 213,
    latex60:       other['LATEX(60%)'] || 183,
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

async function fetchMacro() {
  if (cache.macro.data && Date.now() - cache.macro.at < cache.macro.ttl) {
    return cache.macro.data
  }
  const [brent, inrUsd] = await Promise.allSettled([
    fetchYahooPrice('BZ=F'),
    fetchYahooPrice('INR=X'),
  ])

  const result = {
    brent:     brent.status === 'fulfilled'  && brent.value  ? brent.value  : 72.6,
    inrUsd:    inrUsd.status === 'fulfilled' && inrUsd.value ? inrUsd.value : 94.3,
    fetchedAt: new Date().toISOString(),
    source:    'Yahoo Finance',
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

async function scrapeKarnatakaPost() {
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

async function fetchCommoditiesApi() {
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
async function savePriceSnapshot(rb, macro, ka) {
  if (!db) return
  if (Date.now() - lastSnapshotAt < 5 * 60 * 1000) return   // max 1 save per 5 min
  const k = rb?.kottayam_rss4 ?? 270
  try {
    await db.collection('rubber_prices_history').insertOne({
      fetchedAt: new Date(),
      kottayam:  k,
      kochi:     Math.round(k * 1.018),
      rss5:      rb?.kottayam_rss5 ?? Math.round(k * 0.984),
      isnr20:    ka?.isnr20  ?? rb?.isnr20  ?? 213,
      latex60:   ka?.latex60 ?? rb?.latex60 ?? 183,
      ujire:     ka?.ujire?.rss4  ?? Math.round(k * 0.92),
      mysuru:    ka?.mysuru?.rss4 ?? Math.round(k * 0.93),
      hassan:    ka?.hassan?.rss4 ?? Math.round(k * 0.915),
      bangkok:   ka?.bangkokRss3  ?? rb?.intl_rss1 ?? 292,
      brent:     macro?.brent  ?? null,
      inrUsd:    macro?.inrUsd ?? null,
      source:    rb?.source ?? 'rubberboard.gov.in',
    })
    lastSnapshotAt = Date.now()
    console.log('[DB] Price snapshot saved — Kottayam RSS4', k, '₹/kg')
  } catch (err) {
    console.warn('[DB] Snapshot save failed:', err.message)
  }
}

const app = express()
const port = process.env.PORT || 4000
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'rubber_trader_db'

app.use(cors())
app.use(express.json())

let db

async function connectDb() {
  const client = new MongoClient(uri)
  await client.connect()
  console.log(`Connected to MongoDB at ${uri}`)
  db = client.db(dbName)
  await ensureSampleUsers()
}

async function ensureSampleUsers() {
  const users = db.collection('users')
  const count = await users.countDocuments()
  if (count === 0) {
    console.log('No users found, inserting sample admin/customer/finance users...')
    await users.insertMany([
      {
        role: 'admin',
        fullName: 'Admin User',
        email: 'johnchristinchriz@gmail.com',
        mobile: '9000000001',
        password: 'JohnChriz@4144',
        address: 'Head Office',
        village: 'Adminville',
        district: 'Admin District',
        state: 'Admin State',
        pinCode: '000000',
        bank: {
          holder: 'Admin User',
          accountNumber: '111111111111',
          ifsc: 'ADMIN0000000',
          bankName: 'Admin Bank',
          branch: 'Central',
          city: 'Admin City',
          state: 'Admin State',
          verified: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: 'customer',
        fullName: 'Customer User',
        email: 'customer@example.com',
        mobile: '9000000002',
        password: 'customer123',
        address: 'House 12, Main Road',
        village: 'Kottayam',
        district: 'Kottayam',
        state: 'Kerala',
        pinCode: '686001',
        bank: {
          holder: 'Customer User',
          accountNumber: '123456789012',
          ifsc: 'SBIN0005678',
          bankName: 'State Bank of India',
          branch: 'Market Road',
          city: 'Kochi',
          state: 'Kerala',
          verified: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: 'finance',
        fullName: 'Finance Manager',
        email: 'finance@example.com',
        mobile: '9000000003',
        password: 'finance123',
        address: 'Finance Office',
        village: 'Financeville',
        district: 'Finance District',
        state: 'Finance State',
        pinCode: '111111',
        bank: {
          holder: 'Finance Manager',
          accountNumber: '222222222222',
          ifsc: 'FINA0000000',
          bankName: 'Finance Bank',
          branch: 'Finance Branch',
          city: 'Finance City',
          state: 'Finance State',
          verified: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  }
}

app.post('/api/login', async (req, res) => {
  const { role, email, password } = req.body
  if (!role || !email || !password) {
    return res.status(400).json({ success: false, message: 'Role, email, and password are required.' })
  }

  const user = await db
    .collection('users')
    .findOne({ role, email: email.toLowerCase(), password })

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' })
  }

  const safeUser = {
    id: user._id.toString(),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    village: user.village,
    district: user.district,
    state: user.state,
    pinCode: user.pinCode,
    bank: user.bank,
  }

  return res.json({ success: true, user: safeUser })
})

app.post('/api/register', async (req, res) => {
  const { fullName, email, password, mobile, address, village, district, state, pinCode, bank } = req.body
  if (!fullName || !email || !password || !mobile || !address || !village || !district || !state || !pinCode || !bank) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' })
  }

  const users = db.collection('users')
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
    })
  }

  const existing = await users.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' })
  }

  const newUser = {
    role: 'customer',
    fullName,
    email: email.toLowerCase(),
    password,
    mobile,
    address,
    village,
    district,
    state,
    pinCode,
    bank: {
      holder: bank.holder,
      accountNumber: bank.accountNumber,
      ifsc: bank.ifsc.toUpperCase(),
      bankName: bank.bankName,
      branch: bank.branch,
      city: bank.city,
      state: bank.state,
      verified: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await users.insertOne(newUser)
  const user = await users.findOne({ _id: result.insertedId })

  if (!user) {
    return res.status(500).json({ success: false, message: 'Failed to create user.' })
  }

  const safeUser = {
    id: user._id.toString(),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    village: user.village,
    district: user.district,
    state: user.state,
    pinCode: user.pinCode,
    bank: user.bank,
  }

  return res.json({ success: true, user: safeUser })
})

app.get('/api/users/:id', async (req, res) => {
  const id = req.params.id
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) }).catch(() => null)
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
  delete user.password
  return res.json({ success: true, user })
})

app.get('/api/users', async (req, res) => {
  const role = req.query.role
  const query = role ? { role } : {}
  const users = await db.collection('users').find(query).toArray()
  users.forEach((user) => delete user.password)
  res.json({ success: true, users })
})

function serializeCustomer(customer) {
  if (!customer) return null
  const { _id, createdAt, updatedAt, ...rest } = customer
  return { id: _id.toString(), ...rest }
}

function normalizeCustomer(customer) {
  return {
    fullName: customer.fullName ?? '',
    mobile: customer.mobile ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    village: customer.village ?? '',
    district: customer.district ?? '',
    state: customer.state ?? '',
    pinCode: customer.pinCode ?? '',
    bank: {
      holder: customer.bank?.holder ?? '',
      accountNumber: customer.bank?.accountNumber ?? '',
      ifsc: customer.bank?.ifsc?.toUpperCase() ?? '',
      bankName: customer.bank?.bankName ?? '',
      branch: customer.bank?.branch ?? '',
      city: customer.bank?.city ?? '',
      state: customer.bank?.state ?? '',
      verified: Boolean(customer.bank?.verified),
    },
  }
}

app.get('/api/customers', async (req, res) => {
  const customers = await db.collection('customers').find({}).toArray()
  res.json({ success: true, customers: customers.map(serializeCustomer) })
})

app.post('/api/customers', async (req, res) => {
  const customer = req.body
  if (!customer?.fullName || !customer?.mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile are required.' })
  }

  const doc = {
    ...normalizeCustomer(customer),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('customers').insertOne(doc)
  const saved = await db.collection('customers').findOne({ _id: result.insertedId })

  return res.json({ success: true, customer: serializeCustomer(saved) })
})

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid customer id.' })
  }

  const customer = req.body
  if (!customer?.fullName || !customer?.mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile are required.' })
  }

  const update = {
    ...normalizeCustomer(customer),
    updatedAt: new Date(),
  }

  const result = await db.collection('customers').updateOne({ _id: new ObjectId(id) }, { $set: update })
  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, message: 'Customer not found.' })
  }

  const updated = await db.collection('customers').findOne({ _id: new ObjectId(id) })
  return res.json({ success: true, customer: serializeCustomer(updated) })
})

function serializeProduct(product) {
  if (!product) return null
  const { _id, createdAt, updatedAt, ...rest } = product
  return { id: _id.toString(), ...rest }
}

function serializeTransaction(transaction) {
  if (!transaction) return null
  const { _id, ...rest } = transaction
  return { id: _id.toString(), ...rest }
}

function serializeOrder(order) {
  if (!order) return null
  const { _id, ...rest } = order
  return { id: _id.toString(), ...rest }
}

app.get('/api/products', async (req, res) => {
  const products = await db.collection('products').find({}).toArray()
  res.json({ success: true, products: products.map(serializeProduct) })
})

app.post('/api/products', async (req, res) => {
  const product = req.body
  if (!product?.name || product?.price == null || product?.stock == null) {
    return res.status(400).json({ success: false, message: 'Name, price, and stock are required.' })
  }

  const doc = {
    name: product.name,
    category: product.category || 'Other',
    description: product.description || '',
    images: product.images || [],
    price: Number(product.price),
    discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
    stock: Number(product.stock),
    sku: product.sku || '',
    status: product.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('products').insertOne(doc)
  const saved = await db.collection('products').findOne({ _id: result.insertedId })
  return res.json({ success: true, product: serializeProduct(saved) })
})

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product id.' })
  }

  const product = req.body
  if (!product?.name || product?.price == null || product?.stock == null) {
    return res.status(400).json({ success: false, message: 'Name, price, and stock are required.' })
  }

  const update = {
    name: product.name,
    category: product.category || 'Other',
    description: product.description || '',
    images: product.images || [],
    price: Number(product.price),
    discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
    stock: Number(product.stock),
    sku: product.sku || '',
    status: product.status || 'active',
    updatedAt: new Date(),
  }

  const result = await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $set: update })
  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, message: 'Product not found.' })
  }

  const updated = await db.collection('products').findOne({ _id: new ObjectId(id) })
  return res.json({ success: true, product: serializeProduct(updated) })
})

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product id.' })
  }

  const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0) {
    return res.status(404).json({ success: false, message: 'Product not found.' })
  }

  return res.json({ success: true })
})

app.get('/api/transactions', async (req, res) => {
  const transactions = await db.collection('transactions').find({}).toArray()
  res.json({ success: true, transactions: transactions.map(serializeTransaction) })
})

app.post('/api/transactions', async (req, res) => {
  const transaction = req.body
  if (!transaction?.customerId || transaction?.quantity == null || transaction?.rate == null || !transaction?.date) {
    return res.status(400).json({ success: false, message: 'Customer, date, quantity, and rate are required.' })
  }

  const doc = {
    customerId: transaction.customerId,
    date: transaction.date,
    rubberType: transaction.rubberType || '',
    quantity: Number(transaction.quantity),
    rate: Number(transaction.rate),
    deduction: Number(transaction.deduction || 0),
    status: transaction.status || 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('transactions').insertOne(doc)
  const saved = await db.collection('transactions').findOne({ _id: result.insertedId })
  return res.json({ success: true, transaction: serializeTransaction(saved) })
})

app.get('/api/orders', async (req, res) => {
  const orders = await db.collection('orders').find({}).toArray()
  res.json({ success: true, orders: orders.map(serializeOrder) })
})

app.post('/api/orders', async (req, res) => {
  const order = req.body
  if (!order?.customerId || !Array.isArray(order.items) || !order?.createdAt) {
    return res.status(400).json({ success: false, message: 'Customer, items, and createdAt are required.' })
  }

  const doc = {
    customerId: order.customerId,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
    deliveryAddress: order.deliveryAddress || '',
    mobile: order.mobile || '',
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    status: order.status || 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('orders').insertOne(doc)
  const saved = await db.collection('orders').findOne({ _id: result.insertedId })

  if (saved) {
    for (const item of doc.items) {
      await db.collection('products').updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
      )
    }
  }

  return res.json({ success: true, order: serializeOrder(saved) })
})

// ─── RUBBER PRICE LIVE ENDPOINTS ─────────────────────────────────────────────

app.get('/api/rubber-prices', async (req, res) => {
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

app.get('/api/macro', async (req, res) => {
  try {
    const data = await fetchMacro()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('macro fetch error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// Force-refresh all caches (bypasses TTL) — returns full live-data payload
app.post('/api/refresh-prices', async (req, res) => {
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
    const k     = rb?.kottayam_rss4 ?? 270
    const prices = {
      kottayam: k,
      kochi:    Math.round(k * 1.018),
      ujire:    ka?.ujire?.rss4    ?? Math.round(k * 0.92),
      mysuru:   ka?.mysuru?.rss4   ?? Math.round(k * 0.93),
      hassan:   ka?.hassan?.rss4   ?? Math.round(k * 0.915),
      madikeri: ka?.madikeri?.rss4 ?? Math.round(k * 0.905),
      sagara:   ka?.sagara?.rss4   ?? Math.round(k * 0.895),
      bangkok:  comm?.bangkokRss3Inr ?? ka?.bangkokRss3 ?? rb?.intl_rss1 ?? 292,
      isnr20:   ka?.isnr20  ?? rb?.isnr20  ?? 213,
      latex60:  ka?.latex60 ?? rb?.latex60 ?? 183,
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
app.get('/api/karnataka-prices', async (req, res) => {
  try {
    const data = await scrapeKarnatakaPost()
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('karnataka-prices error:', err.message)
    res.status(503).json({ success: false, error: err.message })
  }
})

// ─── Source 8 endpoint: Bangkok RSS3 via Commodities-API ─────────────────────
app.get('/api/commodity-prices', async (req, res) => {
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
app.get('/api/live-data', async (req, res) => {
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
    const k     = rb?.kottayam_rss4 ?? 270

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
        bangkok:  comm?.bangkokRss3Inr ?? ka?.bangkokRss3 ?? rb?.intl_rss1 ?? 292,
        // ISNR20 + Latex: prefer Canara Post (more reliable) → Rubber Board
        isnr20:   ka?.isnr20  ?? rb?.isnr20  ?? 213,
        latex60:  ka?.latex60 ?? rb?.latex60 ?? 183,
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

// ─── Price History endpoint ───────────────────────────────────────────────────
app.get('/api/price-history', async (req, res) => {
  try {
    const days  = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
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

connectDb()
  .then(() => {
    // Pre-warm all caches on startup
    scrapeRubberBoard().catch(e => console.warn('Rubber Board pre-warm failed:', e.message))
    fetchMacro().catch(e => console.warn('Macro pre-warm failed:', e.message))
    scrapeKarnatakaPost().catch(e => console.warn('Karnataka pre-warm failed:', e.message))
    fetchCommoditiesApi().catch(e => console.warn('Commodities pre-warm failed:', e.message))
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
