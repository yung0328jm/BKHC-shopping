// 订单管理工具
const ORDERS_KEY = 'orders'

// 获取所有订单
export const getOrders = () => {
  const orders = localStorage.getItem(ORDERS_KEY)
  return orders ? JSON.parse(orders).reverse() : [] // 最新的在前
}

// 获取单个订单
export const getOrder = (orderId) => {
  const orders = getOrders()
  return orders.find(order => order.id === orderId)
}

// 更新订单状态
export const updateOrderStatus = (orderId, status) => {
  const orders = getOrders()
  const index = orders.findIndex(order => order.id === orderId)
  if (index !== -1) {
    orders[index].status = status
    orders[index].updatedAt = new Date().toISOString()
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    return true
  }
  return false
}

// 删除订单
export const deleteOrder = (orderId) => {
  const orders = getOrders()
  const filtered = orders.filter(order => order.id !== orderId)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered))
}
