import { formatCurrency } from '../../utils/helpers'
import type { Product, CartItem } from '../../types'

interface CartWithProduct extends CartItem {
  product: Product
  total: number
}

interface CartProps {
  cartItems: CartWithProduct[]
  cartTotal: number
  checkoutMethod: 'Cash on Delivery' | 'Bank Transfer' | 'UPI' | 'Credit/Debit Card'
  onUpdateQuantity: (productId: string, quantity: number) => void
  onCheckout: () => void
  onCheckoutMethodChange: (method: 'Cash on Delivery' | 'Bank Transfer' | 'UPI' | 'Credit/Debit Card') => void
}

export function Cart({
  cartItems,
  cartTotal,
  checkoutMethod,
  onUpdateQuantity,
  onCheckout,
  onCheckoutMethodChange,
}: CartProps) {
  return (
    <div className="card">
      <h2>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.productId}>
                  <td data-label="Product">{item.product.name}</td>
                  <td data-label="Qty">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.productId, Number(e.target.value))}
                    />
                  </td>
                  <td data-label="Unit">{formatCurrency(item.product.price)}</td>
                  <td data-label="Total">{formatCurrency(item.total)}</td>
                  <td data-label="Action">
                    <button type="button" className="button button-small" onClick={() => onUpdateQuantity(item.productId, 0)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card card-inline">
            <div>
              <strong>Order total:</strong>
              <p>{formatCurrency(cartTotal)}</p>
            </div>
            <div>
              <label>
                Payment method
                <select value={checkoutMethod} onChange={(e) => onCheckoutMethodChange(e.target.value as any)}>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                </select>
              </label>
            </div>
            <button type="button" className="button button-primary" onClick={onCheckout}>
              Checkout Now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
