// 運費管理工具
const SHIPPING_FEE_KEY = 'shippingFee'

// 獲取運費設定
export const getShippingFee = () => {
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

// 更新運費設定
export const updateShippingFee = (fee711, feeHome, feePickup) => {
  const shippingFee = {
    '711賣貨便': parseFloat(fee711) || 0,
    '宅配': parseFloat(feeHome) || 0,
    '面交': parseFloat(feePickup) || 0,
    updatedAt: new Date().toISOString()
  }
  localStorage.setItem(SHIPPING_FEE_KEY, JSON.stringify(shippingFee))
  return shippingFee
}

// 根據配送方式獲取運費
export const getFeeByDeliveryMethod = (deliveryMethod) => {
  const shippingFee = getShippingFee()
  return shippingFee[deliveryMethod] || 0
}
