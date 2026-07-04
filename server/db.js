import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'rubber_trader_db'

let db = null

export function getDb() {
  return db
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

export async function connectDb() {
  const client = new MongoClient(uri)
  await client.connect()
  console.log(`Connected to MongoDB at ${uri}`)
  db = client.db(dbName)
  await ensureSampleUsers()
  await db.collection('purchase_rates').createIndex({ date: 1 }, { unique: true })
}
