interface ReportsProps {
  customersCount: number
  transactionsCount: number
  ordersCount: number
  cartItemsCount: number
}

export function Reports({
  customersCount,
  transactionsCount,
  ordersCount,
  cartItemsCount,
}: ReportsProps) {
  return (
    <div className="grid grid--2">
      <div className="card">
        <h2>Customer Report</h2>
        <p>{customersCount} customers registered on platform.</p>
      </div>
      <div className="card">
        <h2>Purchase Report</h2>
        <p>{transactionsCount} rubber purchase entries recorded.</p>
      </div>
      <div className="card">
        <h2>Sales Report</h2>
        <p>{ordersCount} orders created in the platform.</p>
      </div>
      <div className="card">
        <h2>Shop Sales Report</h2>
        <p>{cartItemsCount} active cart items before the current checkout.</p>
      </div>
    </div>
  )
}
