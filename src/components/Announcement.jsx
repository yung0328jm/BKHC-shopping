import { useState, useEffect } from 'react'
import { getAnnouncement } from '../utils/announcement'
import './Announcement.css'

function Announcement() {
  const [announcement, setAnnouncement] = useState(null)

  useEffect(() => {
    const loadAnnouncement = () => {
      const data = getAnnouncement()
      setAnnouncement(data)
    }
    loadAnnouncement()
  }, [])

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

  if (!announcement) {
    return (
      <div className="announcement-container">
        <div className="announcement-card">
          <h2 className="page-title">公佈欄</h2>
          <div className="loading">載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="announcement-container">
      <div className="announcement-card">
        <h2 className="page-title">公佈欄</h2>
        
        <div className="announcement-update-time">
          <span>最後更新時間：</span>
          <strong>{formatDate(announcement.updatedAt)}</strong>
        </div>

        {announcement.paymentInfo && (
          <div className="announcement-section">
            <div className="announcement-section-title">
              <span className="announcement-icon">💳</span>
              <h3>匯款資訊</h3>
            </div>
            <div className="announcement-content">
              {announcement.paymentInfo.split('\n').map((line, index) => (
                <div key={index}>{line || '\u00A0'}</div>
              ))}
            </div>
          </div>
        )}

        {announcement.shippingInfo && (
          <div className="announcement-section">
            <div className="announcement-section-title">
              <span className="announcement-icon">🚚</span>
              <h3>發貨資訊</h3>
            </div>
            <div className="announcement-content">
              {announcement.shippingInfo.split('\n').map((line, index) => (
                <div key={index}>{line || '\u00A0'}</div>
              ))}
            </div>
          </div>
        )}

        {!announcement.paymentInfo && !announcement.shippingInfo && (
          <div className="announcement-empty">
            <div className="empty-icon">📋</div>
            <p>目前尚無公告內容</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Announcement
