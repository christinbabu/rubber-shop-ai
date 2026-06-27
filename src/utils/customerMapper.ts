import { createId } from './helpers'
import type { Customer } from '../types'

export const mapCustomer = (value: any): Customer => ({
  id: value.id ?? value._id?.toString() ?? createId('cust'),
  fullName: value.fullName ?? '',
  mobile: value.mobile ?? '',
  email: value.email ?? '',
  address: value.address ?? '',
  village: value.village ?? '',
  district: value.district ?? '',
  state: value.state ?? '',
  pinCode: value.pinCode ?? '',
  bank: {
    holder: value.bank?.holder ?? '',
    accountNumber: value.bank?.accountNumber ?? '',
    ifsc: value.bank?.ifsc ?? '',
    bankName: value.bank?.bankName ?? '',
    branch: value.bank?.branch ?? '',
    city: value.bank?.city ?? '',
    state: value.bank?.state ?? '',
    verified: Boolean(value.bank?.verified),
  },
})
