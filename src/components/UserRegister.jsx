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

        <div className="social-login">
          <div className="social-divider">或</div>
          
          <button 
            type="button"
            className="btn-social google"
            onClick={() => {
              alert('請先完成 OAuth 設定！\n\n請參考 OAUTH_SETUP.md 檔案進行設定。')
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google 登入
          </button>

          <button 
            type="button"
            className="btn-social line"
            onClick={() => {
              alert('請先完成 OAuth 設定！\n\n請參考 OAUTH_SETUP.md 檔案進行設定。')
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.086.766.062.841l-.164.671c-.031.135-.127.418.188.254.316-.164 2.065-1.291 2.782-1.776.52-.343.92-.545 1.384-.447.605.124 2.152.227 3.206.227C20.264 21 24 16.125 24 10.314"/>
            </svg>
            LINE 登入
          </button>
        </div>

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
