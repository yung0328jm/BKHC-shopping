// 公告管理工具
const ANNOUNCEMENT_KEY = 'announcement'

// 获取公告
export const getAnnouncement = () => {
  const announcement = localStorage.getItem(ANNOUNCEMENT_KEY)
  if (announcement) {
    const data = JSON.parse(announcement)
    // 兼容舊版本：如果沒有 title 和 gridItems，使用預設值
    if (!data.title) {
      data.title = '重要公告'
    }
    if (!data.gridItems) {
      data.gridItems = []
    }
    return data
  }
  // 默认公告
  return {
    title: '重要公告',
    paymentInfo: '請在訂單確認後3日內完成匯款\n匯款帳號：\n銀行：\n帳號：\n戶名：',
    shippingInfo: '商品將於收到款項後3-5個工作天內出貨\n運費說明：\n配送方式：',
    gridItems: [],
    updatedAt: new Date().toISOString()
  }
}

// 更新公告
export const updateAnnouncement = (title, paymentInfo, shippingInfo, gridItems) => {
  const announcement = {
    title: title || '重要公告',
    paymentInfo: paymentInfo || '',
    shippingInfo: shippingInfo || '',
    gridItems: gridItems || [],
    updatedAt: new Date().toISOString()
  }
  localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement))
  return announcement
}
