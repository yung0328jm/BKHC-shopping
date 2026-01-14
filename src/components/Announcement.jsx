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

  return (
    <div className="announcement-container">
      <div className="cork-board">
        <div className="cork-board-frame">
          <div className="cork-board-hanging-loops">
            <div className="hanging-loop"></div>
            <div className="hanging-loop"></div>
          </div>
          <div className="cork-board-surface">
            {announcement && (
              <>
                {announcement.title && (
                  <div className="cork-board-title">
                    {announcement.title}
                  </div>
                )}
                
                {announcement.gridItems && announcement.gridItems.length > 0 && (
                  <div className="cork-board-items">
                    {announcement.gridItems.map((item, index) => (
                      <div key={index} className="cork-board-note">
                        <div className="note-pin"></div>
                        {item.title && (
                          <div className="note-title">{item.title}</div>
                        )}
                        {item.content && (
                          <div className="note-content">
                            {item.content.split('\n').map((line, idx) => (
                              <div key={idx}>{line || '\u00A0'}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(announcement.paymentInfo || announcement.shippingInfo) && (
                  <div className="cork-board-items">
                    {announcement.paymentInfo && (
                      <div className="cork-board-note">
                        <div className="note-pin"></div>
                        <div className="note-title">💳 匯款資訊</div>
                        <div className="note-content">
                          {announcement.paymentInfo.split('\n').map((line, index) => (
                            <div key={index}>{line || '\u00A0'}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {announcement.shippingInfo && (
                      <div className="cork-board-note">
                        <div className="note-pin"></div>
                        <div className="note-title">🚚 發貨資訊</div>
                        <div className="note-content">
                          {announcement.shippingInfo.split('\n').map((line, index) => (
                            <div key={index}>{line || '\u00A0'}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Announcement
