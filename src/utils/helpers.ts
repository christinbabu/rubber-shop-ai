export const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`

export const todayString = () => new Date().toISOString().slice(0, 10)

export const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`
