// 公告管理工具 - 使用 Supabase 數據庫實現跨設備同步
import { supabase } from './supabaseClient'

// 獲取公告（從 Supabase 數據庫）
export const getAnnouncement = async () => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // 如果表不存在或查詢失敗，返回預設值
      console.error('獲取公告失敗:', error)
      return getDefaultAnnouncement()
    }
    
    if (data) {
      // 轉換數據格式以兼容現有代碼
      return {
        title: data.title || '重要公告',
        paymentInfo: data.payment_info || '',
        shippingInfo: data.shipping_info || '',
        gridItems: data.grid_items || [],
        updatedAt: data.updated_at || new Date().toISOString()
      }
    }
    
    return getDefaultAnnouncement()
  } catch (error) {
    console.error('獲取公告異常:', error)
    return getDefaultAnnouncement()
  }
}

// 同步獲取公告（用於不需要異步的場景，從 localStorage 讀取作為後備）
export const getAnnouncementSync = () => {
  const ANNOUNCEMENT_KEY = 'announcement'
  const announcement = localStorage.getItem(ANNOUNCEMENT_KEY)
  if (announcement) {
    const data = JSON.parse(announcement)
    if (!data.title) {
      data.title = '重要公告'
    }
    if (!data.gridItems) {
      data.gridItems = []
    }
    return data
  }
  return getDefaultAnnouncement()
}

// 預設公告
const getDefaultAnnouncement = () => {
  return {
    title: '重要公告',
    paymentInfo: '請在訂單確認後3日內完成匯款\n匯款帳號：\n銀行：\n帳號：\n戶名：',
    shippingInfo: '商品將於收到款項後3-5個工作天內出貨\n運費說明：\n配送方式：',
    gridItems: [],
    updatedAt: new Date().toISOString()
  }
}

// 更新公告（保存到 Supabase 數據庫）
export const updateAnnouncement = async (title, paymentInfo, shippingInfo, gridItems) => {
  try {
    // 先檢查是否存在公告記錄
    const { data: existing } = await supabase
      .from('announcements')
      .select('id')
      .limit(1)
      .single()
    
    const announcementData = {
      title: title || '重要公告',
      payment_info: paymentInfo || '',
      shipping_info: shippingInfo || '',
      grid_items: gridItems || [],
      updated_at: new Date().toISOString()
    }
    
    let result
    if (existing) {
      // 更新現有記錄
      const { data, error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // 創建新記錄
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    // 轉換格式返回
    return {
      title: result.title || '重要公告',
      paymentInfo: result.payment_info || '',
      shippingInfo: result.shipping_info || '',
      gridItems: result.grid_items || [],
      updatedAt: result.updated_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('更新公告失敗:', error)
    throw error
  }
}
