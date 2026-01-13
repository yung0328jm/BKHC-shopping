import { useState, useEffect, useRef } from 'react'
import { getCurrentUserId, getUserProfile } from '../utils/supabaseAuth'
import { supabase } from '../utils/supabaseClient'
import { 
  getAllConversations, 
  getMessagesByConversation, 
  sendMessage,
  markMessagesAsRead,
  subscribeMessages,
  deleteMessage,
  getUnreadCountForConversation
} from '../utils/supabaseApi'
import './AdminChat.css'

function AdminChat() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({}) // 儲存每個對話的未讀數量
  const messagesEndRef = useRef(null)
  const currentUserId = useRef(null)
  const unsubscribeRef = useRef(null)
  const processedMessageIds = useRef(new Set())

  useEffect(() => {
    loadConversations()
    getCurrentUserId().then(id => {
      currentUserId.current = id
    })
  }, [])

  useEffect(() => {
    if (!selectedConversation?.id) return
    
    const conversationId = selectedConversation.id
    
    // 清理舊訂閱
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    
    loadMessages(conversationId)
    markMessagesAsRead(conversationId, currentUserId.current)
    
    // 更新未讀計數（標記為已讀後）
    if (currentUserId.current) {
      getUnreadCountForConversation(conversationId, currentUserId.current)
        .then(count => {
          setUnreadCounts(prev => ({ ...prev, [conversationId]: count }))
        })
        .catch(err => console.error('更新未讀計數失敗:', err))
    }
    
    // 清理訂閱
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [selectedConversation?.id]) // 只依賴 selectedConversation.id，避免對象引用變化導致重複執行

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const data = await getAllConversations()
      setConversations(data)
      
      // 載入每個對話的未讀訊息數量
      if (currentUserId.current) {
        const counts = {}
        for (const conv of data) {
          const count = await getUnreadCountForConversation(conv.id, currentUserId.current)
          counts[conv.id] = count
        }
        setUnreadCounts(counts)
      }
      
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0])
      }
    } catch (error) {
      console.error('載入對話列表失敗:', error)
      alert('載入對話列表失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      // 先取消舊的訂閱
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      
      // 重置已處理訊息 ID 集合
      processedMessageIds.current.clear()
      
      const data = await getMessagesByConversation(conversationId)
      // 將已載入的訊息 ID 加入集合
      data.forEach(msg => processedMessageIds.current.add(msg.id))
      setMessages(data)
      
      // 訂閱新訊息
      const unsubscribe = subscribeMessages(conversationId, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new
          
          // 使用 Set 檢查是否已處理過（更可靠）
          if (processedMessageIds.current.has(newMsg.id)) {
            return
          }
          
          // 標記為已處理
          processedMessageIds.current.add(newMsg.id)
          
          // 獲取新訊息的發送者資訊
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, email, display_name, is_admin')
              .eq('id', newMsg.sender_id)
              .single()
            
            // 再次檢查（防止競態條件）
            setMessages(prevMsgs => {
              if (prevMsgs.some(msg => msg.id === newMsg.id)) {
                return prevMsgs
              }
              return [...prevMsgs, {
                ...newMsg,
                sender: profile || { id: newMsg.sender_id }
              }]
            })
            markMessagesAsRead(conversationId, currentUserId.current)
            
            // 更新未讀計數
            if (currentUserId.current) {
              const count = await getUnreadCountForConversation(conversationId, currentUserId.current)
              setUnreadCounts(prev => ({ ...prev, [conversationId]: count }))
            }
          } catch (err) {
            // 如果獲取發送者資訊失敗，仍然添加訊息
            setMessages(prevMsgs => {
              if (prevMsgs.some(msg => msg.id === newMsg.id)) {
                return prevMsgs
              }
              return [...prevMsgs, newMsg]
            })
          }
        } else if (payload.eventType === 'DELETE') {
          // 處理刪除事件
          const deletedMsgId = payload.old.id
          setMessages(prevMsgs => prevMsgs.filter(msg => msg.id !== deletedMsgId))
          processedMessageIds.current.delete(deletedMsgId)
        }
      })

      unsubscribeRef.current = unsubscribe
    } catch (error) {
      console.error('載入訊息失敗:', error)
      const errorMessage = error.message || '載入訊息失敗'
      alert(`載入訊息失敗：${errorMessage}`)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const userId = await getCurrentUserId()
      await sendMessage(selectedConversation.id, userId, newMessage)
      setNewMessage('')
      // 只更新對話列表以更新最後訊息時間，不需要重新載入訊息
      // Realtime 訂閱會自動更新訊息列表
      loadConversations()
    } catch (error) {
      console.error('發送訊息失敗:', error)
      alert('發送訊息失敗，請稍後再試')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('確定要刪除這則訊息嗎？')) {
      return
    }

    try {
      await deleteMessage(messageId)
      // 訊息會通過 Realtime 訂閱自動從列表中移除
    } catch (error) {
      console.error('刪除訊息失敗:', error)
      alert('刪除訊息失敗，請稍後再試')
    }
  }

  const getUserDisplayName = (user) => {
    return user?.display_name || user?.username || user?.email?.split('@')[0] || '客戶'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (isLoading) {
    return (
      <div className="admin-chat-container">
        <div className="loading">載入中...</div>
      </div>
    )
  }

  return (
    <div className="admin-chat-container">
      <h2 className="page-title">客戶聊天管理</h2>
      
      <div className="chat-layout">
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>對話列表</h3>
            <span className="conversation-count">共 {conversations.length} 個對話</span>
          </div>
          
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>目前沒有客戶對話</p>
            </div>
          ) : (
            <div className="conversations-items">
              {conversations.map(conv => {
                const unreadCount = unreadCounts[conv.id] || 0
                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="conversation-user-info">
                      <div className="conversation-avatar">
                        {getUserDisplayName(conv.user)?.charAt(0) || '客'}
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                      </div>
                      <div className="conversation-details">
                        <div className="conversation-name-row">
                          <div className="conversation-name">
                            {getUserDisplayName(conv.user)}
                          </div>
                          {unreadCount > 0 && (
                            <span className="unread-indicator"></span>
                          )}
                        </div>
                        <div className="conversation-time">
                          {conv.last_message_at 
                            ? new Date(conv.last_message_at).toLocaleString('zh-TW', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '無訊息'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="chat-messages-area">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {getUserDisplayName(selectedConversation.user)?.charAt(0) || '客'}
                  </div>
                  <div>
                    <div className="chat-user-name">
                      {getUserDisplayName(selectedConversation.user)}
                    </div>
                    <div className="chat-user-email">
                      {selectedConversation.user?.email || ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>還沒有訊息，開始對話吧！</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.sender?.is_admin === true
                    return (
                      <div
                        key={msg.id}
                        className={`message-item ${isAdmin ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{msg.content}</div>
                          <div className="message-footer">
                            <div className="message-time">
                              {new Date(msg.created_at).toLocaleString('zh-TW', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {isAdmin && (
                              <button
                                className="btn-delete-message"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteMessage(msg.id)
                                }}
                                title="刪除訊息"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  className="message-input"
                  placeholder="輸入訊息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-send-message" disabled={!newMessage.trim()}>
                  發送
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>請選擇一個對話開始聊天</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChat
