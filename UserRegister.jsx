import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../utils/supabaseAuth'
import './UserAuth.css'

function UserRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    account: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    email: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    
    if (!formData.account.trim()) {
      newErrors.account = '帳號為必填'
    } else if (formData.account.trim().length < 3) {
      newErrors.account = '帳號長度至少需要3個字符'
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = '用戶名為必填'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = '用戶名長度至少需要2個字符'
    }
    
    if (!formData.password) {
      newErrors.password = '密碼為必填'
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼長度至少需要6個字符'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼與確認密碼不一致'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '電子郵件為必填'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件'
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
      const result = await signUp(formData.password, formData.account.trim(), formData.email.trim(), formData.displayName.trim())
      
      if (result.success) {
        alert('註冊成功！已自動登入')
        navigate('/')
      } else {
        alert(result.message || '註冊失敗，請檢查網路連線和 Supabase 設定')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('註冊失敗:', error)
      alert(`註冊失敗：${error.message || '請檢查瀏覽器控制台的錯誤訊息'}`)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">用戶註冊</h2>
        <p className="auth-subtitle">創建您的帳號開始購物</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="account">帳號 <span className="required">*</span></label>
            <input
              type="text"
              id="account"
              name="account"
              value={formData.account}
              onChange={handleChange}
              className={errors.account ? 'input-error' : ''}
              placeholder="輸入帳號（至少3個字符，用於登入）"
              autoComplete="username"
            />
            {errors.account && <span className="error-message">{errors.account}</span>}
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              帳號用於登入，請記住您的帳號
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="displayName">用戶名 <span className="required">*</span></label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={errors.displayName ? 'input-error' : ''}
              placeholder="輸入用戶名（至少2個字符，用於顯示）"
              autoComplete="name"
            />
            {errors.displayName && <span className="error-message">{errors.displayName}</span>}
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              用戶名會顯示在系統中（如訂單、個人資料等）
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="email">電子郵件 <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="輸入電子郵件（僅用於註冊驗證）"
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              註：登入時使用用戶名+密碼，不需要使用 email
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">密碼 <span className="required">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="輸入密碼（至少6個字符）"
              autoComplete="new-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">確認密碼 <span className="required">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              placeholder="再次輸入密碼"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? '註冊中...' : '註冊'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            已有帳號？ <Link to="/user/login" className="auth-link">立即登入</Link>
          </p>
          <Link to="/" className="btn-link">返回首頁</Link>
        </div>
      </div>
    </div>
  )
}

export default UserRegister
