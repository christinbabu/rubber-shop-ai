import { useState } from 'react'
import { formatCurrency } from '../../utils/helpers'
import { categories } from '../../utils/constants'
import type { Product } from '../../types'

interface ShopProps {
  products: Product[]
  onAddToCart: (productId: string) => void
}

export function Shop({ products, onAddToCart }: ShopProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase())
    return product.status === 'active' && product.stock > 0 && matchesCategory && matchesSearch
  })

  return (
    <>
      <div className="card card-inline">
        <div>
          <label>
            Search products
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description"
            />
          </label>
        </div>
        <div>
          <label>
            Category filter
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="grid grid--3">
        {filteredProducts.map((product) => (
          <article className="card product-card" key={product.id}>
            <h3>{product.name}</h3>
            <p className="muted">{product.category}</p>
            <p>{product.description}</p>
            <div className="product-meta">
              <span>{formatCurrency(product.price)}</span>
              <span>{product.stock} in stock</span>
            </div>
            <button type="button" className="button button-primary" onClick={() => onAddToCart(product.id)}>
              Add to Cart
            </button>
          </article>
        ))}
      </div>
      {filteredProducts.length === 0 && <p className="empty-state">No products match your search.</p>}
    </>
  )
}
