import { useState, useEffect, useRef } from 'react'
import { getCurrentUserId, getUserProfile } from '../utils/supabaseAuth'
import { supabase } from '../utils/supabaseClient'
import { 
  getAllConversations, 
  getMessagesByConversation, 
  sendMessage,
  markMessagesAsRead,
  subscribeMessages
} from '../utils/supabaseApi'
import './AdminChat.css'

function AdminChat() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const currentUserId = useRef(null)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    loadConversations()
    getCurrentUserId().then(id => {
      currentUserId.current = id
    })
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markMessagesAsRead(selectedConversation.id, currentUserId.current)
    }
    
    // 清理訂閱
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const data = await getAllConversations()
      setConversations(data)
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
      
      const data = await getMessagesByConversation(conversationId)
      setMessages(data)
      
      // 訂閱新訊息
      const unsubscribe = subscribeMessages(conversationId, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new
          
          // 檢查訊息是否已存在（避免重複）
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMsg.id)
            if (exists) return prev
            
            // 獲取新訊息的發送者資訊
            supabase
              .from('profiles')
              .select('id, username, email, display_name, is_admin')
              .eq('id', newMsg.sender_id)
              .single()
              .then(({ data: profile }) => {
                setMessages(prevMsgs => {
                  // 再次檢查是否已存在
                  if (prevMsgs.some(msg => msg.id === newMsg.id)) {
                    return prevMsgs
                  }
                  return [...prevMsgs, {
                    ...newMsg,
                    sender: profile || { id: newMsg.sender_id }
                  }]
                })
                markMessagesAsRead(conversationId, currentUserId.current)
              })
              .catch(() => {
                // 如果獲取發送者資訊失敗，仍然添加訊息
                setMessages(prevMsgs => {
                  if (prevMsgs.some(msg => msg.id === newMsg.id)) {
                    return prevMsgs
                  }
                  return [...prevMsgs, newMsg]
                })
              })
            
            return prev
          })
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
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conversation-user-info">
                    <div className="conversation-avatar">
                      {getUserDisplayName(conv.user)?.charAt(0) || '客'}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-name">
                        {getUserDisplayName(conv.user)}
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
              ))}
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
                          <div className="message-time">
                            {new Date(msg.created_at).toLocaleString('zh-TW', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
