import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, initAdmin } from '../utils/auth'
import './Login.css'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')

  // 初始化管理员账号
  useEffect(() => {
    initAdmin()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('請輸入用戶名和密碼')
      return
    }

    if (login(formData.username, formData.password)) {
      if (onLogin) {
        onLogin()
      }
      navigate('/add')
    } else {
      setError('用戶名或密碼錯誤')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">管理員登入</h2>
        <p className="login-subtitle">請輸入您的管理員帳號和密碼</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-alert">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">用戶名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="輸入用戶名"
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

        <div className="login-footer">
          <p className="default-info">預設帳號：admin / 密碼：admin123</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-link"
          >
            返回商品列表
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
