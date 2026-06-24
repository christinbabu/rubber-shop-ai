import type { Order } from '../../types'

interface OrdersProps {
  orders: Order[]
}

export function Orders({ orders }: OrdersProps) {
  return (
    <div className="card">
      <h2>Order History</h2>
      {orders.length === 0 ? (
        <p>No orders have been placed yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Delivery</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order ID">{order.id}</td>
                <td data-label="Date">{order.createdAt}</td>
                <td data-label="Items">{order.items.length}</td>
                <td data-label="Delivery">{order.deliveryAddress}</td>
                <td data-label="Payment">{order.paymentMethod}</td>
                <td data-label="Status">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
