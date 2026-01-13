import { supabase } from './supabaseClient'

// Products
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const insertProduct = async (product) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateProductById = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// 減少商品庫存（用於結帳，使用資料庫函數）
export const decreaseProductStock = async (productId, quantity) => {
  const { data, error } = await supabase.rpc('decrease_product_stock', {
    product_id: productId,
    quantity_to_decrease: quantity
  })
  if (error) throw error
  return data
}

export const deleteProductById = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const subscribeProducts = (onChange) => {
  const channel = supabase
    .channel('products-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => onChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Cart
export const fetchCartByUser = async (userId) => {
  const { data, error } = await supabase
    .from('carts')
    .select('id, user_id, product_id, quantity, products(*)')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export const upsertCartItem = async (userId, productId, quantityToAdd = 1) => {
  // 先檢查購物車中是否已有該商品
  const { data: existingItem } = await supabase
    .from('carts')
    .select('quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  let newQuantity
  if (existingItem) {
    // 如果已存在，增加數量
    newQuantity = existingItem.quantity + quantityToAdd
  } else {
    // 如果不存在，設置為新增的數量
    newQuantity = quantityToAdd
  }

  const { data, error } = await supabase
    .from('carts')
    .upsert(
      { user_id: userId, product_id: productId, quantity: newQuantity },
      { onConflict: 'user_id,product_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// 直接設置購物車商品數量（用於更新）
export const setCartItemQuantity = async (userId, productId, quantity) => {
  const { data, error } = await supabase
    .from('carts')
    .upsert(
      { user_id: userId, product_id: productId, quantity },
      { onConflict: 'user_id,product_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export const removeCartItem = async (userId, productId) => {
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}

export const clearCartByUser = async (userId) => {
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}

export const subscribeCart = (userId, onChange) => {
  const channel = supabase
    .channel(`cart-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${userId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Orders (basic)
export const createOrder = async (order) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (error) {
    console.error('創建訂單失敗:', error)
    console.error('訂單數據:', order)
    throw error
  }
  return data
}

export const fetchOrdersByUser = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteOrderById = async (orderId) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
  if (error) throw error
}

