import type { Customer } from '../../types'

interface ProfileProps {
  customer?: Customer
}

export function Profile({ customer }: ProfileProps) {
  return (
    <div className="card grid grid--2">
      <div>
        <h2>Profile</h2>
        {customer ? (
          <div className="profile-block">
            <p>
              <strong>Name:</strong> {customer.fullName}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Mobile:</strong> {customer.mobile}
            </p>
            <p>
              <strong>Address:</strong> {customer.address}, {customer.village}, {customer.district}, {customer.state} - {customer.pinCode}
            </p>
          </div>
        ) : (
          <p>No customer selected.</p>
        )}
      </div>
      <div>
        <h2>Bank Details</h2>
        {customer ? (
          <div className="profile-block">
            <p>
              <strong>Holder:</strong> {customer.bank.holder}
            </p>
            <p>
              <strong>Account:</strong> {customer.bank.accountNumber}
            </p>
            <p>
              <strong>IFSC:</strong> {customer.bank.ifsc}
            </p>
            <p>
              <strong>Bank:</strong> {customer.bank.bankName}
            </p>
            <p>
              <strong>Branch:</strong> {customer.bank.branch}
            </p>
            <p>
              <strong>City:</strong> {customer.bank.city}
            </p>
            <p>
              <strong>State:</strong> {customer.bank.state}
            </p>
          </div>
        ) : (
          <p>No bank details available.</p>
        )}
      </div>
    </div>
  )
}
