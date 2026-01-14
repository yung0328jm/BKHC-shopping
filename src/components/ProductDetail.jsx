import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchProductById } from '../utils/supabaseApi'
import { upsertCartItem } from '../utils/supabaseApi'
import { getCurrentUserId, getCurrentUser, getUserProfile } from '../utils/supabaseAuth'
import './ProductDetail.css'

function ProductDetail({ onCartUpdate }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const foundProduct = await fetchProductById(id)
        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          alert('商品不存在')
          navigate('/')
        }
      } catch (error) {
        console.error('載入商品失敗:', error)
        alert('載入商品失敗，請稍後再試')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    const checkAdminStatus = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setIsAdmin(profile?.is_admin === true)
        }
      } catch (error) {
        console.error('檢查管理員狀態失敗:', error)
      }
    }

    loadProduct()
    checkAdminStatus()
  }, [id, navigate])

  const handleAddToCart = async () => {
    // 預購商品跳過庫存檢查
    if (!product) {
      return
    }

    if (!product.is_preorder) {
      if (product.stock === 0) {
        alert('此商品目前缺貨')
        return
      }

      if (quantity > product.stock) {
        alert(`庫存不足，目前僅剩 ${product.stock} 件`)
        return
      }
    }

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入後才能加入購物車')
        navigate('/user/login')
        return
      }

      await upsertCartItem(userId, product.id, quantity)
      alert('已加入購物車')
      
      if (onCartUpdate) {
        onCartUpdate()
      }
    } catch (error) {
      console.error('加入購物車失敗:', error)
      alert('加入購物車失敗，請稍後再試')
    }
  }

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    // 預購商品不限制數量上限
    if (newQuantity >= 1 && (product.is_preorder || newQuantity <= product.stock)) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">載入中...</div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← 返回
      </button>

      <div className="product-detail-content">
        <div className="product-detail-image">
          <img 
            src={product.image} 
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'
            }}
          />
        </div>

        <div className="product-detail-info">
          <div className="product-detail-category">{product.category}</div>
          <h1 className="product-detail-name">
            {product.name}
            {product.is_preorder && (
              <span style={{ 
                marginLeft: '0.5rem', 
                fontSize: '1rem', 
                color: '#e67e22',
                fontWeight: 'bold'
              }}>📦 預購</span>
            )}
          </h1>
          <div className="product-detail-price">NT$ {product.price.toLocaleString()}</div>
          <div className="product-detail-stock">
            {product.is_preorder ? '預購中' : `庫存：${product.stock} 件`}
          </div>
          
          {product.description && (
            <div className="product-detail-description">
              <h3>商品描述</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="product-detail-actions">
            <div className="quantity-selector">
              <label>數量：</label>
              <div className="quantity-control">
                <button
                  onClick={() => {
                    if (quantity > 1) {
                      handleQuantityChange(-1)
                    }
                  }}
                  className="quantity-btn"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val >= 1 && (product.is_preorder || val <= product.stock)) {
                      setQuantity(val)
                    }
                  }}
                  min="1"
                  max={product.is_preorder ? undefined : product.stock}
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="quantity-btn"
                  disabled={!product.is_preorder && quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-primary btn-large"
              disabled={!product.is_preorder && product.stock === 0}
            >
              {(!product.is_preorder && product.stock === 0) ? '缺貨' : '加入購物車'}
            </button>

            {isAdmin && (
              <Link
                to={`/edit/${product.id}`}
                className="btn btn-secondary btn-large"
                style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
              >
                編輯商品
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
