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
