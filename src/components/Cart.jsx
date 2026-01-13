import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCartByUser, removeCartItem, clearCartByUser, subscribeCart, setCartItemQuantity } from '../utils/supabaseApi'
import { fetchProducts, updateProductById } from '../utils/supabaseApi'
import { getCurrentUserId } from '../utils/supabaseAuth'
import './Cart.css'

function Cart({ onCartUpdate }) {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingQuantity, setEditingQuantity] = useState({})

  useEffect(() => {
    loadCart()
  }, [])

  useEffect(() => {
    if (onCartUpdate) {
      onCartUpdate()
    }
  }, [cartItems, onCartUpdate])

  const loadCart = async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      
      if (!userId) {
        alert('請先登入')
        navigate('/user/login')
        return
      }

      const cartData = await fetchCartByUser(userId)
      
      // 轉換格式以兼容現有 UI
      const itemsWithInfo = cartData.map(item => {
        const product = item.products
        return {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
          quantity: item.quantity,
          product: product
        }
      })
      
      setCartItems(itemsWithInfo)

      // 訂閱購物車變化
      const unsubscribe = subscribeCart(userId, () => {
        loadCart()
      })

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } catch (error) {
      console.error('載入購物車失敗:', error)
      alert('載入購物車失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入')
        navigate('/user/login')
        return
      }

      // 轉換為數字
      const quantity = parseInt(newQuantity, 10)

      // 驗證輸入
      if (isNaN(quantity) || quantity <= 0) {
        await handleRemove(productId)
        return
      }

      // 找到對應的商品以檢查庫存
      const item = cartItems.find(item => item.id === productId)
      if (item && quantity > item.product.stock) {
        alert(`庫存不足，目前僅剩 ${item.product.stock} 件`)
        setEditingQuantity(prev => ({ ...prev, [productId]: item.quantity }))
        return
      }

      await setCartItemQuantity(userId, productId, quantity)
      setEditingQuantity(prev => {
        const newState = { ...prev }
        delete newState[productId]
        return newState
      })
      loadCart()
    } catch (error) {
      console.error('更新購物車失敗:', error)
      alert('更新失敗，請稍後再試')
      // 恢復原值
      const item = cartItems.find(item => item.id === productId)
      if (item) {
        setEditingQuantity(prev => ({ ...prev, [productId]: item.quantity }))
      }
    }
  }

  const handleQuantityInputChange = (productId, value) => {
    setEditingQuantity(prev => ({ ...prev, [productId]: value }))
  }

  const handleQuantityInputBlur = (productId) => {
    const inputValue = editingQuantity[productId]
    if (inputValue !== undefined) {
      handleQuantityChange(productId, inputValue)
    }
  }

  const handleQuantityInputKeyPress = (e, productId) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  const handleRemove = async (productId) => {
    if (!window.confirm('確定要移除此商品嗎？')) {
      return
    }

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入')
        navigate('/user/login')
        return
      }

      await removeCartItem(userId, productId)
      loadCart()
    } catch (error) {
      console.error('移除商品失敗:', error)
      alert('移除失敗，請稍後再試')
    }
  }

  const handleCheckout = () => {
    // 检查库存
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        alert(`商品「${item.name}」庫存不足，目前僅剩 ${item.product.stock} 件`)
        loadCart()
        return
      }
    }
    
    // 跳转到结账页面
    navigate('/checkout')
  }

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  if (loading) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <h2>購物車是空的</h2>
          <p>快去選購您喜歡的商品吧！</p>
          <Link to="/" className="btn btn-primary">
            前往選購
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h2 className="page-title">購物車</h2>
      
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-image">
              <img 
                src={item.image} 
                alt={item.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                }}
              />
            </div>
            
            <div className="cart-item-info">
              <h3 className="cart-item-name">{item.name}</h3>
              <div className="cart-item-price">NT$ {item.price.toLocaleString()}</div>
              <div className="cart-item-stock">庫存：{item.product.stock} 件</div>
            </div>

            <div className="cart-item-controls">
              <div className="quantity-control">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="quantity-btn"
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={editingQuantity[item.id] !== undefined ? editingQuantity[item.id] : item.quantity}
                  onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                  onBlur={() => handleQuantityInputBlur(item.id)}
                  onKeyPress={(e) => handleQuantityInputKeyPress(e, item.id)}
                  min="1"
                  max={item.product.stock}
                />
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="quantity-btn"
                  disabled={item.quantity >= item.product.stock}
                >
                  +
                </button>
              </div>
              
              <div className="cart-item-total">
                小計：NT$ {(item.price * item.quantity).toLocaleString()}
              </div>
              
              <button
                onClick={() => handleRemove(item.id)}
                className="btn-remove"
                title="移除商品"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>商品總數：</span>
          <strong>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} 件</strong>
        </div>
        <div className="summary-row total">
          <span>總金額：</span>
          <strong className="total-price">NT$ {totalPrice.toLocaleString()}</strong>
        </div>
        
        <div className="cart-actions">
          <Link to="/" className="btn btn-secondary">
            繼續購物
          </Link>
          <button
            onClick={handleCheckout}
            className="btn btn-primary btn-checkout"
          >
            前往結帳
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
