import { formatCurrency } from '../../utils/helpers'

interface AdminDashboardProps {
  todayPurchases: number
  todaySales: number
  totalCustomers: number
  currentStock: number
  totalInventoryValue: number
  lowStockCount: number
  onManageCustomers: () => void
  onNewPurchase: () => void
  onViewPurchases: () => void
  onManageProducts: () => void
}

export function AdminDashboard({
  todayPurchases,
  todaySales,
  totalCustomers,
  currentStock,
  totalInventoryValue,
  lowStockCount,
  onManageCustomers,
  onNewPurchase,
  onViewPurchases,
  onManageProducts,
}: AdminDashboardProps) {
  return (
    <>
      <div className="grid grid--3">
        <div
          className="card"
          role="button"
          tabIndex={0}
          onClick={onViewPurchases}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onViewPurchases()
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <h3>Today's Purchases</h3>
          <p>{todayPurchases}</p>
        </div>
        <div className="card">
          <h3>Today's Sales</h3>
          <p>{todaySales}</p>
        </div>
        <div className="card">
          <h3>Total Customers</h3>
          <p>{totalCustomers}</p>
        </div>
        <div className="card">
          <h3>Current Stock</h3>
          <p>{currentStock}</p>
        </div>
        <div className="card">
          <h3>Inventory Value</h3>
          <p>{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="card">
          <h3>Low Stock Items</h3>
          <p>{lowStockCount}</p>
        </div>
      </div>
      <div className="card">
        <h2>Quick Actions</h2>
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={onManageCustomers}>
            Manage Customers
          </button>
          <button type="button" className="button button-primary" onClick={onNewPurchase}>
            New Purchase Entry
          </button>
          <button type="button" className="button button-primary" onClick={onManageProducts}>
            Manage Products
          </button>
        </div>
      </div>
    </>
  )
}
