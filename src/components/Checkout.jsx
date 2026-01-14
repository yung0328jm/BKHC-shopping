import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCartByUser, clearCartByUser } from '../utils/supabaseApi'
import { decreaseProductStock } from '../utils/supabaseApi'
import { createOrder } from '../utils/supabaseApi'
import { getAnnouncement } from '../utils/announcement'
import { getCurrentUserId, getCurrentUser } from '../utils/supabaseAuth'
import { getFeeByDeliveryMethod } from '../utils/shippingFee'
import './Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryMethod: '',
    paymentMethod: 'cash'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [announcement, setAnnouncement] = useState(null)

  useEffect(() => {
    const announcementData = getAnnouncement()
    setAnnouncement(announcementData)
  }, [])

  useEffect(() => {
    const loadCart = async () => {
      try {
        const userId = await getCurrentUserId()
        if (!userId) {
          alert('請先登入後再結帳')
          navigate('/user/login')
          return
        }

        const cartData = await fetchCartByUser(userId)
        
        if (cartData.length === 0) {
          navigate('/cart')
          return
        }

        // 轉換格式
        const itemsWithInfo = cartData.map(item => {
          const product = item.products
          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image,
            quantity: item.quantity,
            is_preorder: product.is_preorder || false,
            product: product
          }
        })
        
        setCartItems(itemsWithInfo)
      } catch (error) {
        console.error('載入購物車失敗:', error)
        alert('載入購物車失敗')
        navigate('/cart')
      }
    }

    loadCart()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '姓名為必填'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '電話為必填'
    } else if (!/^[0-9-+()]+$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的電話號碼'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '地址為必填'
    }
    
    if (!formData.deliveryMethod) {
      newErrors.deliveryMethod = '請選擇配送方式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    // 再次检查库存（預購商品跳過庫存檢查）
    for (const item of cartItems) {
      if (!item.is_preorder && item.quantity > item.product.stock) {
        alert(`商品「${item.name}」庫存不足，目前僅剩 ${item.product.stock} 件`)
        navigate('/cart')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入')
        navigate('/user/login')
        return
      }

      // 更新库存（預購商品跳過庫存更新）
      for (const item of cartItems) {
        if (!item.is_preorder) {
          await decreaseProductStock(item.id, item.quantity)
        }
      }

      // 创建订单记录
      const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      const shippingFee = getFeeByDeliveryMethod(formData.deliveryMethod)
      const totalPrice = subtotal + shippingFee
      
      const order = {
        user_id: userId,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          is_preorder: item.is_preorder || false
        })),
        customer_info: formData,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total: totalPrice,
        status: 'pending',
        payment_method: formData.paymentMethod
      }
      
      const orderData = await createOrder(order)

      // 清空购物车
      await clearCartByUser(userId)

      // 显示成功消息
      alert(`訂單提交成功！\n訂單編號：${orderData.id}\n總金額：NT$ ${totalPrice.toLocaleString()}`)
      
      navigate('/')
    } catch (error) {
      console.error('結帳失敗:', error)
      console.error('錯誤詳情:', error.message)
      console.error('錯誤堆棧:', error.stack)
      
      // 提供更詳細的錯誤訊息
      let errorMessage = '結帳失敗，請稍後再試'
      if (error.message) {
        if (error.message.includes('permission denied') || error.message.includes('policy')) {
          errorMessage = '權限不足，請確認您已正確登入'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '網路連線失敗，請檢查您的網路連線'
        } else {
          errorMessage = `結帳失敗：${error.message}`
        }
      }
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const shippingFee = formData.deliveryMethod ? getFeeByDeliveryMethod(formData.deliveryMethod) : 0
  const totalPrice = subtotal + shippingFee

  if (cartItems.length === 0) {
    return null
  }

  return (
    <div className="checkout-container">
      <h2 className="page-title">結帳</h2>
      
      <div className="checkout-content">
        <div className="checkout-form-section">
          <div className="form-card">
            <h3>訂購資訊</h3>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label htmlFor="name">姓名 <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'input-error' : ''}
                  placeholder="輸入您的姓名"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">電話 <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'input-error' : ''}
                  placeholder="輸入您的電話號碼"
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="deliveryMethod">配送方式 <span className="required">*</span></label>
                <select
                  id="deliveryMethod"
                  name="deliveryMethod"
                  value={formData.deliveryMethod}
                  onChange={handleChange}
                  className={errors.deliveryMethod ? 'input-error' : ''}
                >
                  <option value="">請選擇配送方式</option>
                  <option value="711賣貨便">711賣貨便</option>
                  <option value="宅配">宅配</option>
                  <option value="面交">面交</option>
                </select>
                {errors.deliveryMethod && <span className="error-message">{errors.deliveryMethod}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address">地址 <span className="required">*</span></label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? 'input-error' : ''}
                  rows="3"
                  placeholder="輸入您的收貨地址"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">付款方式</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="cash">貨到付款</option>
                  <option value="transfer">銀行轉帳</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? '處理中...' : '確認結帳'}
              </button>
            </form>
          </div>
        </div>

        <div className="checkout-summary-section">
          <div className="summary-card">
            {announcement && (announcement.paymentInfo || announcement.shippingInfo) && (
              <div className="announcement-box">
                <div className="announcement-title">📢 重要公告</div>
                {announcement.paymentInfo && (
                  <div className="announcement-item">
                    <div className="announcement-label">💳 匯款資訊</div>
                    <div className="announcement-content">
                      {announcement.paymentInfo.split('\n').map((line, index) => (
                        <div key={index}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  </div>
                )}
                {announcement.shippingInfo && (
                  <div className="announcement-item">
                    <div className="announcement-label">🚚 發貨資訊</div>
                    <div className="announcement-content">
                      {announcement.shippingInfo.split('\n').map((line, index) => (
                        <div key={index}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <h3>訂單摘要</h3>
            <div className="order-items">
              {cartItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-quantity">x {item.quantity}</span>
                  </div>
                  <span className="order-item-price">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="order-summary-line">
              <span>小計：</span>
              <span>NT$ {subtotal.toLocaleString()}</span>
            </div>
            
            <div className="order-summary-line">
              <span>運費：</span>
              <span>
                {formData.deliveryMethod ? (
                  `NT$ ${shippingFee.toLocaleString()}`
                ) : (
                  '請選擇配送方式'
                )}
              </span>
            </div>
            
            <div className="order-total">
              <span>總金額：</span>
              <strong>NT$ {totalPrice.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
