import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProducts, updateProductById } from '../utils/supabaseApi'
import './AddProduct.css'

function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '',
    badge_label: '',
    show_badge: false
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [originalStock, setOriginalStock] = useState(0)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const products = await fetchProducts()
        const product = products.find(p => p.id === id)
        
        if (!product) {
          alert('商品不存在')
          navigate('/')
          return
        }

        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          category: product.category || '',
          image: product.image || '',
          badge_label: product.badge_label || '',
          show_badge: product.show_badge || false
        })
        setOriginalStock(product.stock || 0)
        
        if (product.image && product.image.startsWith('data:')) {
          setImagePreview(product.image)
        }
      } catch (error) {
        console.error('載入商品失敗:', error)
        alert('載入商品失敗')
        navigate('/')
      }
    }
    
    loadProduct()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案！')
        e.target.value = ''
        return
      }

      // 檢查檔案大小（限制為 5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片檔案大小不能超過 5MB！')
        e.target.value = ''
        return
      }

      // 讀取檔案並轉換為 base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData(prev => ({
          ...prev,
          image: base64String
        }))
        setImagePreview(base64String)
      }
      reader.onerror = () => {
        alert('圖片讀取失敗，請重試')
        e.target.value = ''
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }))
    setImagePreview(null)
    // 重置檔案輸入
    const fileInput = document.getElementById('imageFile')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '商品名稱為必填'
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = '請輸入有效的價格'
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = '請輸入有效的庫存數量'
    }
    
    if (!formData.category.trim()) {
      newErrors.category = '商品分類為必填'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const updatedProduct = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category.trim(),
        image: formData.image || 'https://via.placeholder.com/400x300?text=No+Image',
        badge_label: formData.badge_label.trim(),
        show_badge: formData.show_badge
      }

      await updateProductById(id, updatedProduct)
      alert('商品更新成功！')
      navigate('/')
    } catch (error) {
      console.error('更新失敗:', error)
      alert('更新失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="add-product-container">
      <div className="add-product-card">
        <h2 className="page-title">編輯商品</h2>
        
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">商品名稱 <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
              placeholder="輸入商品名稱"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">商品描述</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="輸入商品詳細描述"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">價格 <span className="required">*</span></label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={errors.price ? 'input-error' : ''}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stock">庫存數量 <span className="required">*</span></label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={errors.stock ? 'input-error' : ''}
                placeholder="0"
                min="0"
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
              <small className="form-hint">原始庫存：{originalStock} 件</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">商品分類 <span className="required">*</span></label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'input-error' : ''}
              placeholder="例如：電子產品、服飾、食品等"
            />
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="show_badge"
                checked={formData.show_badge}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    show_badge: e.target.checked
                  }))
                }}
                style={{ marginRight: '0.5rem' }}
              />
              顯示標籤
            </label>
          </div>

          {formData.show_badge && (
            <div className="form-group">
              <label htmlFor="badge_label">標籤文字</label>
              <input
                type="text"
                id="badge_label"
                name="badge_label"
                value={formData.badge_label}
                onChange={handleChange}
                placeholder="例如：蝦皮優選、熱銷商品、限時特價等"
                maxLength={20}
              />
              <small className="form-hint">最多 20 個字元</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="imageFile">商品圖片</label>
            <div className="image-upload-section">
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="imageFile" className="file-input-label">
                <span className="file-input-icon">📷</span>
                <span className="file-input-text">選擇圖片檔案</span>
              </label>
              <small className="form-hint">支援 JPG、PNG、GIF 等格式，最大 5MB</small>
              
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="預覽" className="image-preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn-remove-image"
                    title="移除圖片"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '更新中...' : '更新商品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProduct
