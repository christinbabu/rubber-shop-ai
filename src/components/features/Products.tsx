import { useState } from 'react'
import { createId, formatCurrency } from '../../utils/helpers'
import { categories } from '../../utils/constants'
import type { Product } from '../../types'

interface ProductsProps {
  products: Product[]
  onAddProduct: (product: Product) => void
  onRemoveProduct: (productId: string) => void
}

const emptyForm = {
  name: '',
  category: 'Tools' as const,
  description: '',
  price: '0',
  discountPrice: '',
  stock: '0',
  sku: '',
  status: 'active' as const,
}

export function Products({ products, onAddProduct, onRemoveProduct }: ProductsProps) {
  const [form, setForm] = useState(emptyForm)

  const handleAddProduct = () => {
    if (!form.name || !form.sku || !form.price || !form.stock) {
      window.alert('Please fill product name, SKU, price, and stock.')
      return
    }

    const newProduct: Product = {
      id: createId('prod'),
      name: form.name,
      category: form.category,
      description: form.description,
      images: [],
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock),
      sku: form.sku,
      status: form.status,
    }
    onAddProduct(newProduct)
    setForm(emptyForm)
  }

  return (
    <>
      <div className="card">
        <h2>Product Management</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>SKU</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td data-label="Name">{product.name}</td>
                <td data-label="Category">{product.category}</td>
                <td data-label="Price">{formatCurrency(product.price)}</td>
                <td data-label="Stock">{product.stock}</td>
                <td data-label="Status">{product.status}</td>
                <td data-label="SKU">{product.sku}</td>
                <td data-label="Action">
                  <button type="button" className="button button-small" onClick={() => onRemoveProduct(product.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Add New Product</h2>
        <div className="form-grid">
          <label>
            Product Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            SKU Code
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </label>
          <label>
            Price
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <label>
            Discount Price
            <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
          </label>
          <label>
            Stock Quantity
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </label>
          <label className="full-width">
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <button type="button" className="button button-primary" onClick={handleAddProduct}>
          Add Product
        </button>
      </div>
    </>
  )
}
