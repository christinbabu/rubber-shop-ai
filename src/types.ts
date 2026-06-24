export type Role = 'admin' | 'customer' | 'finance'

export type IFSCDetails = {
  bankName: string
  branch: string
  city: string
  state: string
}

export type BankInfo = {
  holder: string
  accountNumber: string
  ifsc: string
  bankName: string
  branch: string
  city: string
  state: string
  verified: boolean
}

export type Customer = {
  id: string
  fullName: string
  mobile: string
  email: string
  address: string
  village: string
  district: string
  state: string
  pinCode: string
  bank: BankInfo
}

export type ProductCategory = 'Tools' | 'Fertilizer' | 'Safety' | 'Rubber' | 'Other'

export type Product = {
  id: string
  name: string
  category: ProductCategory
  description: string
  images: string[]
  price: number
  discountPrice?: number
  stock: number
  sku: string
  status: 'active' | 'inactive'
}

export type Transaction = {
  id: string
  customerId: string
  date: string
  rubberType: string
  quantity: number
  rate: number
  deduction: number
  status: 'Paid' | 'Pending'
}

export type Order = {
  id: string
  customerId: string
  createdAt: string
  items: {
    productId: string
    quantity: number
  }[]
  deliveryAddress: string
  mobile: string
  paymentMethod: 'Cash on Delivery' | 'Bank Transfer' | 'UPI' | 'Credit/Debit Card'
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered'
}

export type CartItem = {
  productId: string
  quantity: number
}
