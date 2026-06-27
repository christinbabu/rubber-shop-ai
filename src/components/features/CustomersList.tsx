import type { Customer } from '../../types'

interface CustomersListProps {
  customers: Customer[]
  onVerifyBank: (customerId: string) => void
  onEditCustomer: (customerId: string) => void
  onCreateCustomer: () => void
}

export function CustomersList({ customers, onVerifyBank, onEditCustomer, onCreateCustomer }: CustomersListProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Customer List</h2>
          <p className="muted">Manage all registered customers and verify bank details.</p>
        </div>
        <button type="button" className="button button-primary" onClick={onCreateCustomer}>
          Create Customer
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Village</th>
            <th>Bank Verified</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td data-label="Name">{customer.fullName}</td>
              <td data-label="Mobile">{customer.mobile}</td>
              <td data-label="Village">{customer.village}</td>
              <td data-label="Bank Verified">{customer.bank.verified ? 'Yes' : 'No'}</td>
              <td data-label="Action">
                <div className="button-row">
                  <button type="button" className="button button-small" onClick={() => onEditCustomer(customer.id)}>
                    Update
                  </button>
                  {!customer.bank.verified && (
                    <button type="button" className="button button-small" onClick={() => onVerifyBank(customer.id)}>
                      Verify Bank
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
