import { useState, useEffect } from 'react'
import { getAnnouncement, updateAnnouncement } from '../utils/announcement'
import './AnnouncementEditor.css'

function AnnouncementEditor() {
  const [announcement, setAnnouncement] = useState({
    paymentInfo: '',
    shippingInfo: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadAnnouncement()
  }, [])

  const loadAnnouncement = () => {
    const data = getAnnouncement()
    setAnnouncement({
      paymentInfo: data.paymentInfo || '',
      shippingInfo: data.shippingInfo || ''
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setAnnouncement(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage({ type: '', text: '' })
  }

  const handleSave = () => {
    setIsSaving(true)
    
    try {
      updateAnnouncement(announcement.paymentInfo, announcement.shippingInfo)
      setMessage({ type: 'success', text: '公告已成功更新！' })
      
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    } catch (error) {
      setMessage({ type: 'error', text: '更新失敗，請稍後再試' })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '尚未更新'
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentAnnouncement = getAnnouncement()

  return (
    <div className="announcement-editor-container">
      <div className="announcement-editor-card">
        <h2 className="page-title">公告編輯系統</h2>
        <p className="editor-subtitle">編輯匯款及發貨資訊，這些資訊將顯示在結帳頁面</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="editor-section">
          <div className="section-header">
            <h3>匯款資訊</h3>
            <span className="section-hint">此資訊將顯示在結帳頁面，供客戶參考</span>
          </div>
          <textarea
            name="paymentInfo"
            value={announcement.paymentInfo}
            onChange={handleChange}
            className="editor-textarea"
            rows="8"
            placeholder="請輸入匯款相關資訊，例如：&#10;請在訂單確認後3日內完成匯款&#10;匯款帳號：1234567890&#10;銀行：XX銀行&#10;帳號：1234567890&#10;戶名：XXX"
          />
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>發貨資訊</h3>
            <span className="section-hint">此資訊將顯示在結帳頁面，供客戶參考</span>
          </div>
          <textarea
            name="shippingInfo"
            value={announcement.shippingInfo}
            onChange={handleChange}
            className="editor-textarea"
            rows="8"
            placeholder="請輸入發貨相關資訊，例如：&#10;商品將於收到款項後3-5個工作天內出貨&#10;運費說明：滿1000元免運&#10;配送方式：宅配到府"
          />
        </div>

        <div className="editor-info">
          <div className="info-item">
            <span>最後更新時間：</span>
            <strong>{formatDate(currentAnnouncement.updatedAt)}</strong>
          </div>
        </div>

        <div className="editor-actions">
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? '儲存中...' : '儲存公告'}
          </button>
        </div>

        <div className="preview-section">
          <h3>預覽效果</h3>
          <div className="preview-card">
            <div className="preview-title">📢 重要公告</div>
            {announcement.paymentInfo && (
              <div className="preview-item">
                <div className="preview-label">💳 匯款資訊</div>
                <div className="preview-content">
                  {announcement.paymentInfo.split('\n').map((line, index) => (
                    <div key={index}>{line || '\u00A0'}</div>
                  ))}
                </div>
              </div>
            )}
            {announcement.shippingInfo && (
              <div className="preview-item">
                <div className="preview-label">🚚 發貨資訊</div>
                <div className="preview-content">
                  {announcement.shippingInfo.split('\n').map((line, index) => (
                    <div key={index}>{line || '\u00A0'}</div>
                  ))}
                </div>
              </div>
            )}
            {!announcement.paymentInfo && !announcement.shippingInfo && (
              <div className="preview-empty">尚未設定公告內容</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementEditor
