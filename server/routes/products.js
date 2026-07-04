import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const router = Router()

function serializeProduct(product) {
  if (!product) return null
  const { _id, createdAt, updatedAt, ...rest } = product
  return { id: _id.toString(), ...rest }
}

router.get('/products', async (req, res) => {
  const products = await getDb().collection('products').find({}).toArray()
  res.json({ success: true, products: products.map(serializeProduct) })
})

router.post('/products', async (req, res) => {
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

  const db = getDb()
  const result = await db.collection('products').insertOne(doc)
  const saved = await db.collection('products').findOne({ _id: result.insertedId })
  return res.json({ success: true, product: serializeProduct(saved) })
})

router.put('/products/:id', async (req, res) => {
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

  const db = getDb()
  const result = await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $set: update })
  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, message: 'Product not found.' })
  }

  const updated = await db.collection('products').findOne({ _id: new ObjectId(id) })
  return res.json({ success: true, product: serializeProduct(updated) })
})

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product id.' })
  }

  const result = await getDb().collection('products').deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0) {
    return res.status(404).json({ success: false, message: 'Product not found.' })
  }

  return res.json({ success: true })
})

export default router
