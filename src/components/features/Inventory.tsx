import type { Product } from '../../types'

interface InventoryProps {
  products: Product[]
  purchasedQuantity: number
  currentStock: number
  soldStock: number
}

export function Inventory({ products, purchasedQuantity, currentStock, soldStock }: InventoryProps) {
  const lowStockProducts = products.filter((p) => p.stock < 30)

  return (
    <>
      <div className="grid grid--2">
        <div className="card">
          <h2>Rubber Inventory</h2>
          <ul className="summary-list">
            <li>Purchased Rubber: {purchasedQuantity} KG</li>
            <li>Available Stock: {currentStock} items</li>
            <li>Sold Stock: {soldStock} items</li>
          </ul>
        </div>
        <div className="card">
          <h2>Product Inventory</h2>
          <ul className="summary-list">
            <li>Total Products: {products.length}</li>
            <li>Low Stock Alerts: {lowStockProducts.length}</li>
          </ul>
        </div>
      </div>
      {lowStockProducts.length > 0 && (
        <div className="card">
          <h2>Low Stock Products</h2>
          <ul>
            {lowStockProducts.map((product) => (
              <li key={product.id}>
                {product.name} — {product.stock} left
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
