import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../utils/supabaseAuth'
import { getUserProfile } from '../utils/supabaseAuth'
import { fetchProducts, deleteProductById, subscribeProducts } from '../utils/supabaseApi'
import { upsertCartItem } from '../utils/supabaseApi'
import { getCurrentUserId } from '../utils/supabaseAuth'
import './ProductList.css'

function ProductList({ onCartUpdate }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts()
        setProducts(data)
      } catch (err) {
        console.error('載入商品失敗', err)
        alert('載入商品失敗，請稍後再試')
      }
    }

    const checkAdmin = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setIsAdmin(profile?.is_admin === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('檢查管理員權限失敗:', error)
        setIsAdmin(false)
      }
    }

    load()
    checkAdmin()

    const unsubscribe = subscribeProducts(() => {
      load()
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleDelete = (id, name) => {
    if (window.confirm(`確定要刪除商品「${name}」嗎？`)) {
      deleteProductById(id)
        .catch((err) => {
          console.error(err)
          alert('刪除失敗，請稍後再試')
        })
    }
  }

  const handleAddToCart = async (product) => {
    if (product.stock === 0) {
      alert('此商品目前缺貨')
      return
    }

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入後才能加入購物車')
        navigate('/user/login')
        return
      }

      // 檢查庫存
      if (product.stock < 1) {
        alert(`庫存不足，目前僅剩 ${product.stock} 件`)
        return
      }

      // 獲取當前購物車中該商品的數量
      // 這裡簡化處理，直接加入 1 件
      // 實際應該先查詢現有數量，然後加 1
      await upsertCartItem(userId, product.id, 1)
      alert('已加入購物車')
      
      if (onCartUpdate) {
        onCartUpdate()
      }
    } catch (error) {
      console.error('加入購物車失敗:', error)
      alert('加入購物車失敗，請稍後再試')
    }
  }

  // 獲取所有分類
  const categories = ['all', ...new Set(products.map(p => p.category))]

  // 過濾商品
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesCategory
  })

  return (
    <div className="product-list-container">
      <div className="list-header">
        <h2 className="page-title">商品列表</h2>
        {isAdmin && (
          <Link to="/add" className="btn btn-primary">
            ➕ 上架新商品
          </Link>
        )}
      </div>

      <div className="filter-section">
        <div className="category-filter">
          <label>分類篩選：</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '全部分類' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">
            {products.length === 0 
              ? '目前還沒有商品，點擊「上架新商品」開始吧！' 
              : '沒有找到符合條件的商品'}
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              className="product-card-link"
            >
              <div className="product-card">
                <div className="product-image-wrapper">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'
                    }}
                  />
                </div>
                <div className="product-card-info">
                  {product.show_badge && product.badge_label && (
                    <span className="preferred-badge">{product.badge_label}</span>
                  )}
                  <div className="product-price-row">
                    <span className="product-card-price">${product.price.toLocaleString()}</span>
                    <span className="product-stock">庫存：{product.stock} 件</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="product-admin-actions-card" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/edit/${product.id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => e.stopPropagation()}
                      style={{ textDecoration: 'none' }}
                    >
                      編輯
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(product.id, product.name)
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="stats">
        <p>共 {filteredProducts.length} 件商品</p>
      </div>

    </div>
  )
}

export default ProductList

