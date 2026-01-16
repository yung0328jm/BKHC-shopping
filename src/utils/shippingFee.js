// 運費管理工具 - 使用 Supabase 數據庫實現跨設備同步
import { supabase } from './supabaseClient'

// 獲取運費設定（從 Supabase 數據庫）
export const getShippingFee = async () => {
  try {
    const { data, error } = await supabase
      .from('shipping_fees')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() // 使用 maybeSingle 而不是 single，避免表不存在時報錯
    
    if (error) {
      // 如果表不存在或查詢失敗，使用後備方案
      console.warn('獲取運費設定失敗，使用後備方案:', error.message)
      return getShippingFeeSync()
    }
    
    if (data) {
      // 轉換數據格式以兼容現有代碼
      return {
        '711賣貨便': parseFloat(data.fee_711) || 60,
        '宅配': parseFloat(data.fee_home) || 100,
        '面交': parseFloat(data.fee_pickup) || 0,
        updatedAt: data.updated_at || new Date().toISOString()
      }
    }
    
    // 如果沒有數據，使用後備方案
    return getShippingFeeSync()
  } catch (error) {
    console.warn('獲取運費設定異常，使用後備方案:', error)
    return getShippingFeeSync()
  }
}

// 同步獲取運費設定（用於不需要異步的場景，從 localStorage 讀取作為後備）
export const getShippingFeeSync = () => {
  const SHIPPING_FEE_KEY = 'shippingFee'
  const shippingFee = localStorage.getItem(SHIPPING_FEE_KEY)
  if (shippingFee) {
    return JSON.parse(shippingFee)
  }
  // 默認運費
  return {
    '711賣貨便': 60,
    '宅配': 100,
    '面交': 0,
    updatedAt: new Date().toISOString()
  }
}

// 預設運費設定
const getDefaultShippingFee = () => {
  return {
    '711賣貨便': 60,
    '宅配': 100,
    '面交': 0,
    updatedAt: new Date().toISOString()
  }
}

// 更新運費設定（保存到 Supabase 數據庫）
export const updateShippingFee = async (fee711, feeHome, feePickup) => {
  try {
    // 先檢查是否存在運費設定記錄
    const { data: existing } = await supabase
      .from('shipping_fees')
      .select('id')
      .limit(1)
      .single()
    
    const shippingFeeData = {
      fee_711: parseFloat(fee711) || 0,
      fee_home: parseFloat(feeHome) || 0,
      fee_pickup: parseFloat(feePickup) || 0,
      updated_at: new Date().toISOString()
    }
    
    let result
    if (existing) {
      // 更新現有記錄
      const { data, error } = await supabase
        .from('shipping_fees')
        .update(shippingFeeData)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // 創建新記錄
      const { data, error } = await supabase
        .from('shipping_fees')
        .insert(shippingFeeData)
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    // 轉換格式返回
    return {
      '711賣貨便': parseFloat(result.fee_711) || 0,
      '宅配': parseFloat(result.fee_home) || 0,
      '面交': parseFloat(result.fee_pickup) || 0,
      updatedAt: result.updated_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('更新運費設定失敗:', error)
    throw error
  }
}

// 根據配送方式獲取運費（異步版本，帶錯誤處理）
export const getFeeByDeliveryMethod = async (deliveryMethod) => {
  try {
    const shippingFee = await getShippingFee()
    return shippingFee[deliveryMethod] || 0
  } catch (error) {
    console.error('獲取運費失敗，使用後備方案:', error)
    // 如果數據庫查詢失敗，使用同步版本作為後備
    return getFeeByDeliveryMethodSync(deliveryMethod)
  }
}

// 根據配送方式獲取運費（同步版本，用於後備）
export const getFeeByDeliveryMethodSync = (deliveryMethod) => {
  const shippingFee = getShippingFeeSync()
  return shippingFee[deliveryMethod] || 0
}
