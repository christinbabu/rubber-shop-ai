import { formatCurrency } from '../../utils/helpers'

interface Ledger {
  totalQuantity: number
  totalEarnings: number
  pendingPayments: number
  lastTransaction: string
}

interface CustomerDashboardProps {
  ledger: Ledger
  onBrowseShop: () => void
  onOrderHistory: () => void
}

export function CustomerDashboard({
  ledger,
  onBrowseShop,
  onOrderHistory,
}: CustomerDashboardProps) {
  return (
    <div className="grid grid--2">
      <div className="card">
        <h2>Account Summary</h2>
        <ul className="summary-list">
          <li>Total Quantity Sold: {ledger.totalQuantity} KG</li>
          <li>Total Earnings: {formatCurrency(ledger.totalEarnings)}</li>
          <li>Pending Payments: {formatCurrency(ledger.pendingPayments)}</li>
          <li>Last Transaction: {ledger.lastTransaction}</li>
        </ul>
      </div>
      <div className="card">
        <h2>Quick Links</h2>
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={onBrowseShop}>
            Browse Shop
          </button>
          <button type="button" className="button button-secondary" onClick={onOrderHistory}>
            Order History
          </button>
        </div>
      </div>
    </div>
  )
}
