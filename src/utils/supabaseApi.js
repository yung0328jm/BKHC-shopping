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

// Chat - Conversations
export const getOrCreateUserConversation = async (userId) => {
  // 先嘗試獲取現有對話
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing
  }

  // 如果不存在，創建新對話
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({ user_id: userId })
    .select()
    .single()

  if (createError) throw createError
  return newConv
}

export const getAllConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
  
  if (error) throw error
  
  // 手動獲取用戶資訊
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(c => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, display_name')
      .in('id', userIds)
    
    const profileMap = {}
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p
      })
    }
    
    return data.map(conv => ({
      ...conv,
      user: profileMap[conv.user_id] || { id: conv.user_id }
    }))
  }
  
  return data || []
}

export const getConversationById = async (conversationId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  
  if (error) throw error
  
  // 手動獲取用戶資訊
  if (data) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, email, display_name')
      .eq('id', data.user_id)
      .single()
    
    return {
      ...data,
      user: profile || { id: data.user_id }
    }
  }
  
  return data
}

// Chat - Messages
export const getMessagesByConversation = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // 手動獲取發送者資訊
  if (data && data.length > 0) {
    const senderIds = [...new Set(data.map(m => m.sender_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, display_name, is_admin')
      .in('id', senderIds)
    
    const profileMap = {}
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p
      })
    }
    
    return data.map(msg => ({
      ...msg,
      sender: profileMap[msg.sender_id] || { id: msg.sender_id }
    }))
  }
  
  return data || []
}

export const sendMessage = async (conversationId, senderId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim()
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const markMessagesAsRead = async (conversationId, userId) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId) // 不標記自己發送的訊息為已讀
  if (error) throw error
}

export const getUnreadMessageCount = async (userId) => {
  // 先獲取用戶的對話 ID
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
  
  if (convError) throw convError
  if (!conversations || conversations.length === 0) return 0
  
  const conversationIds = conversations.map(c => c.id)
  
  // 獲取未讀訊息數量
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', userId)
    .in('conversation_id', conversationIds)
  
  if (error) throw error
  return count || 0
}

// 訂閱訊息變更（Realtime）
export const subscribeMessages = (conversationId, onChange) => {
  // 使用唯一的 channel 名稱，包含時間戳以避免衝突
  const channelName = `messages-${conversationId}-${Date.now()}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT',  // 只監聽 INSERT 事件，避免重複觸發
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        // 確保只處理 INSERT 事件
        if (payload.eventType === 'INSERT') {
          onChange?.(payload)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`已訂閱訊息: ${conversationId}`)
      }
    })

  return () => {
    console.log(`取消訂閱訊息: ${conversationId}`)
    supabase.removeChannel(channel)
  }
}

