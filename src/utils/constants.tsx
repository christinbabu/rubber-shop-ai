import { Home, Users, ClipboardList, Package, Box, CreditCard, ShoppingCart, User, TrendingUp, BarChart3, CalendarClock, Tag } from 'lucide-react'
import type { Role } from '../types'

export const roleOptions: Role[] = ['admin', 'customer', 'finance']

export const categories = ['All', 'Tools', 'Fertilizer', 'Safety', 'Rubber', 'Other']

export const getNavItems = (role: Role | null) => {
  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
      { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
      { id: 'purchases', label: 'Purchases', icon: <ClipboardList size={18} /> },
      { id: 'products', label: 'Products', icon: <Package size={18} /> },
      { id: 'inventory', label: 'Inventory', icon: <Box size={18} /> },
      { id: 'marketforecast', label: 'Market Forecast', icon: <TrendingUp size={18} /> },
      { id: 'marketfactors', label: 'Market Factors', icon: <BarChart3 size={18} /> },
      { id: 'pricepredictor', label: 'Price Predictor', icon: <CalendarClock size={18} /> },
      { id: 'purchaserate', label: 'Purchase Rate', icon: <Tag size={18} /> },
      { id: 'reports', label: 'Reports', icon: <CreditCard size={18} /> },
    ]
  }
  if (role === 'finance') {
    return [
      { id: 'finance', label: 'Finance', icon: <CreditCard size={18} /> },
      { id: 'marketforecast', label: 'Market Forecast', icon: <TrendingUp size={18} /> },
      { id: 'marketfactors', label: 'Market Factors', icon: <BarChart3 size={18} /> },
      { id: 'pricepredictor', label: 'Price Predictor', icon: <CalendarClock size={18} /> },
      { id: 'reports', label: 'Reports', icon: <ClipboardList size={18} /> },
    ]
  }
  if (role === 'customer') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
      { id: 'shop', label: 'Shop', icon: <ShoppingCart size={18} /> },
      { id: 'cart', label: 'Cart', icon: <Box size={18} /> },
      { id: 'orders', label: 'Orders', icon: <ClipboardList size={18} /> },
      { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    ]
  }
  return []
}
