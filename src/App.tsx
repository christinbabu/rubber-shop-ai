import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { initialCustomers, initialOrders, initialProducts, initialTransactions } from './data'
import type { CartItem, Customer, Product, Role, Transaction } from './types'
import { createId, todayString } from './utils/helpers'
import { clearAuthSession, readAuthSession, saveAuthSession, AUTH_SESSION_TTL_MS } from './utils/authSession'
import { mapCustomer } from './utils/customerMapper'
import type { Factor } from './utils/marketFactors'
import { FACTORS } from './utils/marketFactors'

// Layout Components
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'

// Auth Components
import { Login } from './components/auth/Login'
import { Register } from './components/auth/Register'

// Dashboard Components
import { AdminDashboard } from './components/dashboard/AdminDashboard'
import { FinanceDashboard } from './components/dashboard/FinanceDashboard'
import { CustomerDashboard } from './components/dashboard/CustomerDashboard'

// Feature Components
import { CustomersList } from './components/features/CustomersList'
import { AddCustomerForm } from './components/features/AddCustomerForm'
import { Purchases } from './components/features/Purchases'
import { Products } from './components/features/Products'
import { Inventory } from './components/features/Inventory'
import { Reports } from './components/features/Reports'
import { MarketForecast } from './components/features/MarketForecast'
import { MarketFactors } from './components/features/MarketFactors'
import { PricePredictor } from './components/features/PricePredictor'
import { PurchaseRateSetter } from './components/features/PurchaseRateSetter'
import { Shop } from './components/features/Shop'
import { Cart } from './components/features/Cart'
import { Orders } from './components/features/Orders'
import { Profile } from './components/features/Payments'

function App() {
  // Auth State
  const [stage, setStage] = useState<'login' | 'register' | 'app'>('login')
  const [role, setRole] = useState<Role | null>(null)
  const [user, setUser] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [navPinned, setNavPinned] = useState(false)

  // Data State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomers[0]?.id ?? '')
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [orders, setOrders] = useState(initialOrders)
  const [cart, setCart] = useState<CartItem[]>([])

  // Market factor model state (shared by Market Forecast + Market Factors screens)
  const [factors, setFactors] = useState<Factor[]>(FACTORS)
  const [crudeSource, setCrudeSource] = useState<string | null>(null)
  const [crudeUpdatedAt, setCrudeUpdatedAt] = useState<Date | null>(null)
  const [spotPrice, setSpotPrice] = useState<number | null>(null)
  const [spotUpdatedAt, setSpotUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchLiveMacro() {
      try {
        const resp = await fetch('/api/live-data')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!json.success || cancelled) return
        if (json.macro) {
          setFactors((current) => current.map((item) => {
            if (item.id === 'crude')  return { ...item, val: Math.round(json.macro.brent  * 100) / 100 }
            if (item.id === 'inr')    return { ...item, val: Math.round(json.macro.inrUsd * 100) / 100 }
            return item
          }))
          setCrudeSource(json.macro.source ?? 'live')
          setCrudeUpdatedAt(new Date())
        }
        if (json.prices?.kottayam) {
          setSpotPrice(json.prices.kottayam)
          setSpotUpdatedAt(new Date())
        }
      } catch {
        // keep last known factor values on fetch failure
      }
    }

    fetchLiveMacro()
    const id = setInterval(fetchLiveMacro, 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [customersRes, productsRes, transactionsRes, ordersRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/transactions'),
          fetch('/api/orders'),
        ])

        const [customersData, productsData, transactionsData, ordersData] = await Promise.all([
          customersRes.json(),
          productsRes.json(),
          transactionsRes.json(),
          ordersRes.json(),
        ])

        if (customersData.success) {
          setCustomers(customersData.customers.map(mapCustomer))
        }

        if (productsData.success) {
          setProducts(productsData.products)
        }

        if (transactionsData.success) {
          setTransactions(transactionsData.transactions)
        }

        if (ordersData.success) {
          setOrders(ordersData.orders)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    const restoredSession = readAuthSession()
    if (restoredSession) {
      setRole(restoredSession.role)
      setUser(restoredSession.user)
      setSelectedCustomerId(restoredSession.selectedCustomerId || initialCustomers[0]?.id || '')
      setActiveTab(restoredSession.activeTab || 'dashboard')
      setTheme(restoredSession.theme || 'light')
      setStage('app')
    }

    loadInitialData()
  }, [])

  // Keep the persisted session's activeTab (and related fields) in sync so a
  // page refresh restores whichever screen the user was last on, instead of
  // always falling back to the tab stored at login time.
  useEffect(() => {
    if (stage !== 'app' || !role) return
    saveAuthSession({
      role,
      user,
      selectedCustomerId,
      activeTab,
      theme,
      expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
    })
  }, [stage, role, user, selectedCustomerId, activeTab, theme])

  // Shop State
  const [checkoutMethod, setCheckoutMethod] = useState<'Cash on Delivery' | 'Bank Transfer' | 'UPI' | 'Credit/Debit Card'>('Cash on Delivery')

  // Computed Values
  const activeCustomer = role === 'customer' ? customers.find((customer) => customer.id === selectedCustomerId) : undefined
  const editingCustomer = customers.find((customer) => customer.id === editingCustomerId) ?? null

  const customerTransactions = useMemo(
    () => transactions.filter((txn) => txn.customerId === selectedCustomerId),
    [selectedCustomerId, transactions],
  )

  const customerOrders = useMemo(
    () => orders.filter((order) => order.customerId === selectedCustomerId),
    [selectedCustomerId, orders],
  )

  const ledger = useMemo(() => {
    const totalQuantity = customerTransactions.reduce((sum, item) => sum + item.quantity, 0)
    const totalEarnings = customerTransactions.reduce((sum, item) => sum + item.quantity * item.rate - item.deduction, 0)
    const pendingPayments = customerTransactions.reduce((sum, item) => sum + (item.status === 'Pending' ? item.quantity * item.rate - item.deduction : 0), 0)
    const lastTransaction = customerTransactions.slice(-1)[0]?.date ?? 'None'
    return { totalQuantity, totalEarnings, pendingPayments, lastTransaction }
  }, [customerTransactions])

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((productItem) => productItem.id === item.productId)
          if (!product) return null
          return {
            ...item,
            product,
            total: item.quantity * product.price,
          }
        })
        .filter(Boolean) as Array<CartItem & { product: Product; total: number }>,
    [cart, products],
  )

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0)

  const today = todayString()
  const todayPurchases = transactions.filter((txn) => txn.date === today).length
  const todaySales = orders.filter((order) => order.createdAt === today).length
  const totalCustomers = customers.length
  const currentStock = products.reduce((sum, product) => sum + product.stock, 0)
  const totalInventoryValue = products.reduce((sum, product) => sum + product.stock * product.price, 0)
  const lowStockProducts = products.filter((product) => product.stock < 30)
  const purchasedQuantity = transactions.reduce((sum, item) => sum + item.quantity, 0)
  const soldStock = cartItems.reduce((sum, item) => sum + item.quantity, 0)


  // Auth Handlers
  const handleRoleLogin = async (role: Role, email: string, password: string) => {
    if (!role || !email || !password) {
      setErrorMessage('Please enter role, email, and password.')
      return
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          email: email.toLowerCase(),
          password,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        setErrorMessage(result.message || 'Login failed.')
        return
      }

      const nextRole = result.user.role
      const nextUser = result.user
      let nextSelectedCustomerId = selectedCustomerId

      setRole(nextRole)
      setUser(nextUser)
      setActiveTab('dashboard')
      setStage('app')
      setErrorMessage('')

      if (nextRole === 'customer') {
        const foundCustomer = customers.find((customer) => customer.email.toLowerCase() === nextUser.email.toLowerCase())
        if (foundCustomer) {
          nextSelectedCustomerId = foundCustomer.id
          setSelectedCustomerId(foundCustomer.id)
        } else {
          const mappedCustomer: Customer = {
            id: nextUser.id || createId('cust'),
            fullName: nextUser.fullName,
            mobile: nextUser.mobile,
            email: nextUser.email,
            address: nextUser.address,
            village: nextUser.village,
            district: nextUser.district,
            state: nextUser.state,
            pinCode: nextUser.pinCode,
            bank: {
              holder: nextUser.bank.holder,
              accountNumber: nextUser.bank.accountNumber,
              ifsc: nextUser.bank.ifsc,
              bankName: nextUser.bank.bankName,
              branch: nextUser.bank.branch,
              city: nextUser.bank.city,
              state: nextUser.bank.state,
              verified: nextUser.bank.verified,
            },
          }
          setCustomers((current) => [...current, mappedCustomer])
          nextSelectedCustomerId = mappedCustomer.id
          setSelectedCustomerId(mappedCustomer.id)
        }
      }

      saveAuthSession({
        role: nextRole,
        user: nextUser,
        selectedCustomerId: nextSelectedCustomerId,
        activeTab: 'dashboard',
        theme,
        expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
      })
    } catch (error) {
      setErrorMessage('Unable to connect to the server.')
      console.error(error)
    }
  }

  const handleRegister = async (customer: Customer) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: customer.fullName,
          mobile: customer.mobile,
          email: customer.email.toLowerCase(),
          password: customer.email,
          address: customer.address,
          village: customer.village,
          district: customer.district,
          state: customer.state,
          pinCode: customer.pinCode,
          bank: {
            holder: customer.bank.holder,
            accountNumber: customer.bank.accountNumber,
            ifsc: customer.bank.ifsc,
            bankName: customer.bank.bankName,
            branch: customer.bank.branch,
            city: customer.bank.city,
            state: customer.bank.state,
          },
        }),
      })

      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Registration failed.')
        return
      }

      const newCustomer: Customer = {
        id: result.user.id || customer.id,
        fullName: result.user.fullName,
        mobile: result.user.mobile,
        email: result.user.email,
        address: result.user.address,
        village: result.user.village,
        district: result.user.district,
        state: result.user.state,
        pinCode: result.user.pinCode,
        bank: {
          holder: result.user.bank.holder,
          accountNumber: result.user.bank.accountNumber,
          ifsc: result.user.bank.ifsc,
          bankName: result.user.bank.bankName,
          branch: result.user.bank.branch,
          city: result.user.bank.city,
          state: result.user.bank.state,
          verified: result.user.bank.verified || false,
        },
      }

      setCustomers((current) => [...current, newCustomer])
      setSelectedCustomerId(newCustomer.id)
      setRole('customer')
      setUser(result.user)
      setStage('app')
      setActiveTab('dashboard')
      saveAuthSession({
        role: 'customer',
        user: result.user,
        selectedCustomerId: newCustomer.id,
        activeTab: 'dashboard',
        theme,
        expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
      })
    } catch (error) {
      window.alert('Unable to connect to the server.')
      console.error(error)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setStage('login')
    setRole(null)
    setCart([])
    setActiveTab('dashboard')
  }

  // Customer Handlers
  const handleAddCustomer = async (customer: Customer) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to add customer.')
        return
      }

      setCustomers((current) => [...current, mapCustomer(result.customer)])
      setEditingCustomerId(null)
      setShowCustomerForm(false)
      window.alert('Customer added successfully.')
    } catch (error) {
      console.error('Failed to add customer:', error)
      window.alert('Unable to save customer to the database.')
    }
  }

  const handleUpdateCustomer = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to update customer.')
        return
      }

      setCustomers((current) => current.map((item) => (item.id === customer.id ? mapCustomer(result.customer) : item)))
      setEditingCustomerId(null)
      setShowCustomerForm(false)
      window.alert('Customer updated successfully.')
    } catch (error) {
      console.error('Failed to update customer:', error)
      window.alert('Unable to update customer in the database.')
    }
  }

  const verifyBank = (customerId: string) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? { ...customer, bank: { ...customer.bank, verified: true } }
          : customer,
      ),
    )
  }

  // Purchase Handlers
  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to save transaction.')
        return
      }
      setTransactions((current) => [...current, result.transaction])
    } catch (error) {
      console.error('Failed to save transaction:', error)
      window.alert('Unable to save transaction to the database.')
    }
  }

  // Product Handlers
  const handleAddProduct = async (product: Product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to add product.')
        return
      }
      setProducts((current) => [...current, result.product])
    } catch (error) {
      console.error('Failed to add product:', error)
      window.alert('Unable to save product in the database.')
    }
  }

  const removeProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to remove product.')
        return
      }
      setProducts((current) => current.filter((product) => product.id !== productId))
    } catch (error) {
      console.error('Failed to remove product:', error)
      window.alert('Unable to delete product from the database.')
    }
  }

  const handleUpdateProduct = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to update product.')
        return
      }
      setProducts((current) => current.map((item) => (item.id === product.id ? result.product : item)))
      window.alert('Product updated successfully.')
    } catch (error) {
      console.error('Failed to update product:', error)
      window.alert('Unable to update product in the database.')
    }
  }

  // Shop Handlers
  const addToCart = (productId: string) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { productId, quantity: 1 }]
    })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId))
      return
    }
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }

  const handleCheckout = async () => {
    if (!activeCustomer) {
      window.alert('Customer account is required to checkout.')
      return
    }
    if (!cartItems.length) {
      window.alert('Your cart is empty.')
      return
    }

    const orderPayload = {
      customerId: activeCustomer.id,
      createdAt: todayString(),
      items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      deliveryAddress: `${activeCustomer.address}, ${activeCustomer.village}, ${activeCustomer.district}, ${activeCustomer.state} - ${activeCustomer.pinCode}`,
      mobile: activeCustomer.mobile,
      paymentMethod: checkoutMethod,
      status: 'Pending' as const,
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      const result = await response.json()
      if (!result.success) {
        window.alert(result.message || 'Failed to create order.')
        return
      }

      setOrders((current) => [...current, result.order])
      setProducts((current) =>
        current.map((product) => {
          const cartLine = cartItems.find((item) => item.product.id === product.id)
          if (!cartLine) return product
          return { ...product, stock: Math.max(0, product.stock - cartLine.quantity) }
        }),
      )
      setCart([])
      setActiveTab('orders')
    } catch (error) {
      console.error('Failed to create order:', error)
      window.alert('Unable to save order to the database.')
    }
  }

  // Render
  if (stage === 'login') {
    return <Login onLogin={handleRoleLogin} onRegisterClick={() => setStage('register')} errorMessage={errorMessage} />
  }

  if (stage === 'register') {
    return <Register onRegister={handleRegister} onBackClick={() => setStage('login')} />
  }

  return (
    <div className={`app-shell ${theme}-theme`}>
      <div className="app-layout">
        <Sidebar role={role} activeTab={activeTab} onTabChange={setActiveTab} navPinned={navPinned} onToggleNav={() => setNavPinned((v) => !v)} />
        <main className="main-content">
          <TopBar userFullName={user?.fullName ?? 'Guest'} theme={theme} onThemeToggle={() => setTheme((v) => (v === 'light' ? 'dark' : 'light'))} />
          <Header role={role} activeCustomer={activeCustomer} onLogout={handleLogout} />

          {/* Dashboard */}
          {activeTab === 'dashboard' && role === 'admin' && (
            <AdminDashboard
              todayPurchases={todayPurchases}
              todaySales={todaySales}
              totalCustomers={totalCustomers}
              currentStock={currentStock}
              totalInventoryValue={totalInventoryValue}
              lowStockCount={lowStockProducts.length}
              onManageCustomers={() => setActiveTab('customers')}
              onNewPurchase={() => setActiveTab('purchases')}
              onViewPurchases={() => setActiveTab('purchases')}
              onManageProducts={() => setActiveTab('products')}
            />
          )}

          {activeTab === 'dashboard' && role === 'finance' && <FinanceDashboard />}

          {activeTab === 'dashboard' && role === 'customer' && (
            <CustomerDashboard
              ledger={ledger}
              onBrowseShop={() => setActiveTab('shop')}
              onOrderHistory={() => setActiveTab('orders')}
            />
          )}

          {/* Customers */}
          {activeTab === 'customers' && (
            <>
              <CustomersList
                customers={customers}
                onVerifyBank={verifyBank}
                onEditCustomer={(customerId) => {
                  setEditingCustomerId(customerId)
                  setShowCustomerForm(true)
                }}
                onCreateCustomer={() => {
                  setEditingCustomerId(null)
                  setShowCustomerForm(true)
                }}
              />
              {role === 'admin' && (showCustomerForm || editingCustomer) && (
                <AddCustomerForm
                  editingCustomer={editingCustomer}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onCancelEdit={() => {
                    setEditingCustomerId(null)
                    setShowCustomerForm(false)
                  }}
                />
              )}
              <div className="card">
                <h2>Customer Payments</h2>
                <p>Payments are visible in the customer portal once a transaction is entered.</p>
              </div>
            </>
          )}

          {/* Purchases */}
          {activeTab === 'purchases' && (
            <Purchases
              customers={customers}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <Products products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onRemoveProduct={removeProduct} />
          )}

          {/* Inventory */}
          {activeTab === 'inventory' && (
            <Inventory
              products={products}
              purchasedQuantity={purchasedQuantity}
              currentStock={currentStock}
              soldStock={soldStock}
            />
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <Reports customers={customers} transactions={transactions} />
          )}
          {activeTab === 'finance' && <Reports customers={customers} transactions={transactions} />}

          {activeTab === 'marketforecast' && (
            <MarketForecast
              factors={factors}
              setFactors={setFactors}
              crudeSource={crudeSource}
              crudeUpdatedAt={crudeUpdatedAt}
            />
          )}
          {activeTab === 'marketfactors' && <MarketFactors factors={factors} />}
          {activeTab === 'pricepredictor' && (
            <PricePredictor factors={factors} spotPrice={spotPrice} spotUpdatedAt={spotUpdatedAt} />
          )}
          {activeTab === 'purchaserate' && role === 'admin' && (
            <PurchaseRateSetter spotPrice={spotPrice} />
          )}

          {/* Shop */}
          {activeTab === 'shop' && <Shop products={products} onAddToCart={addToCart} />}

          {/* Cart */}
          {activeTab === 'cart' && (
            <Cart
              cartItems={cartItems}
              cartTotal={cartTotal}
              checkoutMethod={checkoutMethod}
              onUpdateQuantity={updateCartQuantity}
              onCheckout={handleCheckout}
              onCheckoutMethodChange={setCheckoutMethod}
            />
          )}

          {/* Orders */}
          {activeTab === 'orders' && <Orders orders={customerOrders} />}

          {/* Profile */}
          {activeTab === 'profile' && <Profile customer={activeCustomer} />}
        </main>
      </div>
    </div>
  )
}

export default App
