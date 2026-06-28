import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

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

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
