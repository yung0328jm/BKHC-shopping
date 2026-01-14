import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithUsername } from '../utils/supabaseAuth'
import './UserAuth.css'

function UserLogin({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    useEmail: false
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('請輸入帳號/電子郵件和密碼')
      return
    }

    try {
      let result
      // 如果輸入看起來像 email，使用 email 登入，否則使用 username
      if (formData.username.includes('@')) {
        result = await signIn(formData.username, formData.password)
      } else {
        result = await signInWithUsername(formData.username, formData.password)
      }
      
      if (result.success) {
        if (onLogin) {
          onLogin()
        }
        alert('登入成功！')
        navigate('/announcement')
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('登入失敗:', error)
      setError('登入失敗，請稍後再試')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">用戶登入</h2>
        <p className="auth-subtitle">登入您的帳號繼續購物</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-alert">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">帳號/電子郵件</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="輸入帳號或電子郵件"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="輸入密碼"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            登入
          </button>
        </form>

        <div className="auth-footer">
          <p>
            還沒有帳號？ <Link to="/user/register" className="auth-link">立即註冊</Link>
          </p>
          <Link to="/" className="btn-link">返回首頁</Link>
        </div>
      </div>
    </div>
  )
}

export default UserLogin
