// 公告管理工具
const ANNOUNCEMENT_KEY = 'announcement'

// 获取公告
export const getAnnouncement = () => {
  const announcement = localStorage.getItem(ANNOUNCEMENT_KEY)
  if (announcement) {
    return JSON.parse(announcement)
  }
  // 默认公告
  return {
    paymentInfo: '請在訂單確認後3日內完成匯款\n匯款帳號：\n銀行：\n帳號：\n戶名：',
    shippingInfo: '商品將於收到款項後3-5個工作天內出貨\n運費說明：\n配送方式：',
    updatedAt: new Date().toISOString()
  }
}

// 更新公告
export const updateAnnouncement = (paymentInfo, shippingInfo) => {
  const announcement = {
    paymentInfo: paymentInfo || '',
    shippingInfo: shippingInfo || '',
    updatedAt: new Date().toISOString()
  }
  localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement))
  return announcement
}
