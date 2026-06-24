/**
 * Run this script with Node to create the MongoDB database and collections.
 *
 * Install dependencies first:
 *   npm install mongodb
 *
 * Then run:
 *   node mongo/createDatabase.js
 */

import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'rubber_trader_db'

async function createDatabase() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    console.log(`Connected to MongoDB at ${uri}`)

    const db = client.db(dbName)

    const collections = [
      'users',
      'products',
      'orders',
      'rubber_transactions',
      'payments',
      'inventory_events',
      'capital_management',
      'expenses',
      'advances',
      'roles',
    ]

    for (const name of collections) {
      const existing = await db.listCollections({ name }).toArray()
      if (existing.length === 0) {
        await db.createCollection(name)
        console.log(`Created collection: ${name}`)
      } else {
        console.log(`Collection already exists: ${name}`)
      }
    }

    await db.collection('users').createIndex({ role: 1 })
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true })
    await db.collection('users').createIndex({ mobile: 1 })
    await db.collection('products').createIndex({ sku: 1 }, { unique: true })
    await db.collection('orders').createIndex({ customerId: 1 })
    await db.collection('orders').createIndex({ status: 1 })
    await db.collection('rubber_transactions').createIndex({ customerId: 1 })
    await db.collection('payments').createIndex({ customerId: 1 })
    await db.collection('payments').createIndex({ orderId: 1 })
    await db.collection('advances').createIndex({ customerId: 1 })

    console.log('Indexes created successfully.')
  } catch (err) {
    console.error('Error creating database:', err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

createDatabase()
