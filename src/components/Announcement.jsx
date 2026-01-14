import './Announcement.css'

function Announcement() {

  return (
    <div className="announcement-container">
      <div className="cork-board">
        <div className="cork-board-frame">
          <div className="cork-board-hanging-loops">
            <div className="hanging-loop"></div>
            <div className="hanging-loop"></div>
          </div>
          <div className="cork-board-surface">
            {/* 空白軟木塞板，所有內容已移除 */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Announcement
