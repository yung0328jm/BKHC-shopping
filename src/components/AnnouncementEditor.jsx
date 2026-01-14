import { useState, useEffect } from 'react'
import { getAnnouncement, updateAnnouncement } from '../utils/announcement'
import './AnnouncementEditor.css'

function AnnouncementEditor() {
  const [announcement, setAnnouncement] = useState({
    title: '',
    paymentInfo: '',
    shippingInfo: '',
    gridItems: []
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadAnnouncement()
  }, [])

  const loadAnnouncement = () => {
    const data = getAnnouncement()
    setAnnouncement({
      title: data.title || '重要公告',
      paymentInfo: data.paymentInfo || '',
      shippingInfo: data.shippingInfo || '',
      gridItems: data.gridItems || []
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
      updateAnnouncement(
        announcement.title,
        announcement.paymentInfo,
        announcement.shippingInfo,
        announcement.gridItems
      )
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

  const handleGridItemChange = (index, field, value) => {
    const newGridItems = [...announcement.gridItems]
    if (!newGridItems[index]) {
      newGridItems[index] = { title: '', content: '' }
    }
    newGridItems[index][field] = value
    setAnnouncement(prev => ({
      ...prev,
      gridItems: newGridItems
    }))
  }

  const addGridItem = () => {
    setAnnouncement(prev => ({
      ...prev,
      gridItems: [...prev.gridItems, { title: '', content: '' }]
    }))
  }

  const removeGridItem = (index) => {
    const newGridItems = announcement.gridItems.filter((_, i) => i !== index)
    setAnnouncement(prev => ({
      ...prev,
      gridItems: newGridItems
    }))
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
            <h3>公佈欄標題</h3>
            <span className="section-hint">此標題將顯示在公佈欄頁面頂部</span>
          </div>
          <input
            type="text"
            name="title"
            value={announcement.title}
            onChange={handleChange}
            className="editor-input"
            placeholder="例如：重要公告、最新消息等"
            maxLength={50}
          />
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>網格內容</h3>
            <span className="section-hint">可新增多個公告項目，以網格形式顯示</span>
            <button
              type="button"
              onClick={addGridItem}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              ➕ 新增項目
            </button>
          </div>
          {announcement.gridItems.length === 0 ? (
            <div className="empty-grid-items">
              <p>目前沒有網格項目，點擊「新增項目」開始添加</p>
            </div>
          ) : (
            <div className="grid-items-editor">
              {announcement.gridItems.map((item, index) => (
                <div key={index} className="grid-item-editor">
                  <div className="grid-item-header">
                    <span className="grid-item-number">項目 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeGridItem(index)}
                      className="btn-remove-item"
                      title="刪除此項目"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="grid-item-fields">
                    <div className="grid-item-field">
                      <label>標題</label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => handleGridItemChange(index, 'title', e.target.value)}
                        className="editor-input"
                        placeholder="輸入項目標題"
                        maxLength={100}
                      />
                    </div>
                    <div className="grid-item-field">
                      <label>內容</label>
                      <textarea
                        value={item.content || ''}
                        onChange={(e) => handleGridItemChange(index, 'content', e.target.value)}
                        className="editor-textarea"
                        rows="4"
                        placeholder="輸入項目內容"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
            <div className="preview-title">📢 {announcement.title || '重要公告'}</div>
            
            {announcement.gridItems.length > 0 && (
              <div className="preview-grid">
                {announcement.gridItems.map((item, index) => (
                  <div key={index} className="preview-grid-item">
                    <div className="preview-grid-title">{item.title || '未命名項目'}</div>
                    <div className="preview-grid-content">
                      {item.content ? (
                        item.content.split('\n').map((line, idx) => (
                          <div key={idx}>{line || '\u00A0'}</div>
                        ))
                      ) : (
                        <div style={{ color: '#999' }}>（無內容）</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
            {announcement.gridItems.length === 0 && !announcement.paymentInfo && !announcement.shippingInfo && (
              <div className="preview-empty">尚未設定公告內容</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementEditor
