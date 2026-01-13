import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, changeUsername, logout, getCurrentAdmin } from '../utils/auth'
import { getShippingFee, updateShippingFee } from '../utils/shippingFee'
import './AdminSettings.css'

function AdminSettings() {
  const navigate = useNavigate()
  const currentUser = getCurrentAdmin()
  const [activeTab, setActiveTab] = useState('password')
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
    password: ''
  })
  const [shippingFeeForm, setShippingFeeForm] = useState({
    fee711: '',
    feeHome: '',
    feePickup: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const shippingFee = getShippingFee()
    setShippingFeeForm({
      fee711: shippingFee['711賣貨便'] || '',
      feeHome: shippingFee['宅配'] || '',
      feePickup: shippingFee['面交'] || ''
    })
  }, [])

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage({ type: '', text: '' })
  }

  const handleUsernameChange = (e) => {
    const { name, value } = e.target
    setUsernameForm(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage({ type: '', text: '' })
  }

  const handleShippingFeeChange = (e) => {
    const { name, value } = e.target
    setShippingFeeForm(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage({ type: '', text: '' })
  }

  const handleShippingFeeSubmit = (e) => {
    e.preventDefault()
    
    if (shippingFeeForm.fee711 === '' || shippingFeeForm.feeHome === '' || shippingFeeForm.feePickup === '') {
      setMessage({ type: 'error', text: '請填寫所有運費欄位' })
      return
    }

    const fee711 = parseFloat(shippingFeeForm.fee711)
    const feeHome = parseFloat(shippingFeeForm.feeHome)
    const feePickup = parseFloat(shippingFeeForm.feePickup)

    if (isNaN(fee711) || isNaN(feeHome) || isNaN(feePickup) || fee711 < 0 || feeHome < 0 || feePickup < 0) {
      setMessage({ type: 'error', text: '運費必須為有效的正數或零' })
      return
    }

    updateShippingFee(fee711, feeHome, feePickup)
    setMessage({ type: 'success', text: '運費設定已成功更新！' })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '請填寫所有欄位' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '新密碼與確認密碼不一致' })
      return
    }

    const result = changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    
    if (result.success) {
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }

  const handleUsernameSubmit = (e) => {
    e.preventDefault()
    
    if (!usernameForm.newUsername || !usernameForm.password) {
      setMessage({ type: 'error', text: '請填寫所有欄位' })
      return
    }

    const result = changeUsername(usernameForm.newUsername, usernameForm.password)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    
    if (result.success) {
      setUsernameForm({
        newUsername: '',
        password: ''
      })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-card">
        <h2 className="page-title">管理員設定</h2>
        
        <div className="user-info">
          <p>當前登入用戶：<strong>{currentUser?.username}</strong></p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            修改密碼
          </button>
          <button
            className={`tab ${activeTab === 'username' ? 'active' : ''}`}
            onClick={() => setActiveTab('username')}
          >
            修改用戶名
          </button>
          <button
            className={`tab ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            運費設定
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="oldPassword">原密碼</label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={passwordForm.oldPassword}
                onChange={handlePasswordChange}
                placeholder="輸入原密碼"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">新密碼</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="輸入新密碼（至少6個字符）"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">確認新密碼</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="再次輸入新密碼"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              修改密碼
            </button>
          </form>
        )}

        {activeTab === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="newUsername">新用戶名</label>
              <input
                type="text"
                id="newUsername"
                name="newUsername"
                value={usernameForm.newUsername}
                onChange={handleUsernameChange}
                placeholder="輸入新用戶名"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">確認密碼</label>
              <input
                type="password"
                id="password"
                name="password"
                value={usernameForm.password}
                onChange={handleUsernameChange}
                placeholder="輸入當前密碼以確認"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              修改用戶名
            </button>
          </form>
        )}

        {activeTab === 'shipping' && (
          <form onSubmit={handleShippingFeeSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="fee711">711賣貨便運費 (NT$)</label>
              <input
                type="number"
                id="fee711"
                name="fee711"
                value={shippingFeeForm.fee711}
                onChange={handleShippingFeeChange}
                placeholder="輸入711賣貨便運費"
                min="0"
                step="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="feeHome">宅配運費 (NT$)</label>
              <input
                type="number"
                id="feeHome"
                name="feeHome"
                value={shippingFeeForm.feeHome}
                onChange={handleShippingFeeChange}
                placeholder="輸入宅配運費"
                min="0"
                step="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="feePickup">面交運費 (NT$)</label>
              <input
                type="number"
                id="feePickup"
                name="feePickup"
                value={shippingFeeForm.feePickup}
                onChange={handleShippingFeeChange}
                placeholder="輸入面交運費（通常為0）"
                min="0"
                step="1"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              更新運費設定
            </button>
          </form>
        )}

        <div className="settings-actions">
          <button
            onClick={() => navigate('/add')}
            className="btn btn-secondary"
          >
            返回上架頁面
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            登出
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
