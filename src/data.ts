import type { Customer, Product, Transaction, Order, IFSCDetails } from './types'

export const ifscDirectory: Record<string, IFSCDetails> = {
  HDFC0001234: { bankName: 'HDFC Bank', branch: 'MG Road', city: 'Bengaluru', state: 'Karnataka' },
  SBIN0005678: { bankName: 'State Bank of India', branch: 'Market Road', city: 'Kochi', state: 'Kerala' },
  ICIC0004321: { bankName: 'ICICI Bank', branch: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu' },
}

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    fullName: 'Arun Kumar',
    mobile: '9876543210',
    email: 'arun.kumar@example.com',
    address: 'House 12, Main Road',
    village: 'Kottayam',
    district: 'Kottayam',
    state: 'Kerala',
    pinCode: '686001',
    bank: {
      holder: 'Arun Kumar',
      accountNumber: '123456789012',
      ifsc: 'SBIN0005678',
      bankName: 'State Bank of India',
      branch: 'Market Road',
      city: 'Kochi',
      state: 'Kerala',
      verified: true,
    },
  },
]

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Rubber Tapping Knife',
    category: 'Tools',
    description: 'Durable stainless steel rubber tapping knife with ergonomic handle.',
    images: [],
    price: 450,
    discountPrice: 400,
    stock: 45,
    sku: 'RTK-001',
    status: 'active',
  },
  {
    id: 'prod-2',
    name: 'Rain Guard Sheet',
    category: 'Safety',
    description: 'Waterproof sheet to protect tapping areas during rain.',
    images: [],
    price: 320,
    stock: 120,
    sku: 'RGS-012',
    status: 'active',
  },
  {
    id: 'prod-3',
    name: 'Fertilizer Pack',
    category: 'Fertilizer',
    description: 'Balanced fertilizer blend optimized for rubber plantations.',
    images: [],
    price: 980,
    stock: 29,
    sku: 'FERT-09',
    status: 'active',
  },
  {
    id: 'prod-4',
    name: 'Protective Gloves',
    category: 'Safety',
    description: 'Comfortable gloves for safe tapping and handling.',
    images: [],
    price: 150,
    stock: 210,
    sku: 'GLV-03',
    status: 'active',
  },
]

export const initialTransactions: Transaction[] = [
  {
    id: 'txn-1',
    customerId: 'cust-1',
    date: '2026-06-18',
    rubberType: 'RSS',
    quantity: 100,
    rate: 200,
    deduction: 500,
    status: 'Paid',
  },
  {
    id: 'txn-2',
    customerId: 'cust-1',
    date: '2026-06-19',
    rubberType: 'Latex',
    quantity: 70,
    rate: 210,
    deduction: 0,
    status: 'Pending',
  },
]

export const initialOrders: Order[] = [
  {
    id: 'order-1',
    customerId: 'cust-1',
    createdAt: '2026-06-19',
    items: [
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-4', quantity: 2 },
    ],
    deliveryAddress: 'House 12, Main Road, Kottayam, Kerala - 686001',
    mobile: '9876543210',
    paymentMethod: 'Cash on Delivery',
    status: 'Delivered',
  },
]
