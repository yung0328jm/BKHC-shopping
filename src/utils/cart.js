// 购物车管理工具
const CART_KEY = 'shopping_cart'

// 获取购物车
export const getCart = () => {
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

// 添加到购物车
export const addToCart = (product, quantity = 1) => {
  const cart = getCart()
  const existingItem = cart.find(item => item.id === product.id)
  
  if (existingItem) {
    // 检查库存
    if (existingItem.quantity + quantity > product.stock) {
      return { success: false, message: `庫存不足，目前僅剩 ${product.stock} 件` }
    }
    existingItem.quantity += quantity
  } else {
    // 检查库存
    if (quantity > product.stock) {
      return { success: false, message: `庫存不足，目前僅剩 ${product.stock} 件` }
    }
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity: quantity
    })
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  return { success: true, message: '已加入購物車' }
}

// 更新购物车商品数量
export const updateCartItem = (productId, quantity) => {
  const cart = getCart()
  const item = cart.find(item => item.id === productId)
  
  if (!item) return { success: false, message: '商品不存在' }
  
  if (quantity <= 0) {
    return removeFromCart(productId)
  }
  
  if (quantity > item.stock) {
    return { success: false, message: `庫存不足，目前僅剩 ${item.stock} 件` }
  }
  
  item.quantity = quantity
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  return { success: true }
}

// 从购物车移除
export const removeFromCart = (productId) => {
  const cart = getCart()
  const filtered = cart.filter(item => item.id !== productId)
  localStorage.setItem(CART_KEY, JSON.stringify(filtered))
  return { success: true }
}

// 清空购物车
export const clearCart = () => {
  localStorage.removeItem(CART_KEY)
}

// 获取购物车总数量
export const getCartTotalQuantity = () => {
  const cart = getCart()
  return cart.reduce((total, item) => total + item.quantity, 0)
}

// 获取购物车总金额
export const getCartTotalPrice = () => {
  const cart = getCart()
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
}
