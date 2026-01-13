import { useState, useEffect, useRef } from 'react'
import { getCurrentUserId, getUserProfile } from '../utils/supabaseAuth'
import { supabase } from '../utils/supabaseClient'
import { 
  getOrCreateUserConversation, 
  getMessagesByConversation, 
  sendMessage,
  markMessagesAsRead,
  subscribeMessages
} from '../utils/supabaseApi'
import './UserChat.css'

function UserChat() {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const currentUserId = useRef(null)
  const unsubscribeRef = useRef(null)
  const processedMessageIds = useRef(new Set())

  useEffect(() => {
    initializeChat()
  }, [])

  useEffect(() => {
    if (!conversation?.id) return
    
    const conversationId = conversation.id
    
    // 清理舊訂閱
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    
    loadMessages(conversationId)
    markMessagesAsRead(conversationId, currentUserId.current)
    
    // 清理訂閱
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [conversation?.id]) // 只依賴 conversation.id，避免對象引用變化導致重複執行

  const initializeChat = async () => {
    try {
      setIsLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入')
        return
      }
      currentUserId.current = userId
      
      const conv = await getOrCreateUserConversation(userId)
      setConversation(conv)
    } catch (error) {
      console.error('初始化聊天失敗:', error)
      alert('載入聊天失敗')
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
          } catch (err) {
            // 如果獲取發送者資訊失敗，仍然添加訊息
            setMessages(prevMsgs => {
              if (prevMsgs.some(msg => msg.id === newMsg.id)) {
                return prevMsgs
              }
              return [...prevMsgs, newMsg]
            })
          }
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
    if (!newMessage.trim() || !conversation) return

    try {
      const userId = await getCurrentUserId()
      await sendMessage(conversation.id, userId, newMessage)
      setNewMessage('')
      // 不需要重新載入訊息，Realtime 訂閱會自動更新
    } catch (error) {
      console.error('發送訊息失敗:', error)
      alert('發送訊息失敗，請稍後再試')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (isLoading) {
    return (
      <div className="user-chat-container">
        <div className="loading">載入中...</div>
      </div>
    )
  }

  return (
    <div className="user-chat-container">
      <h2 className="page-title">聯絡客服</h2>
      
      <div className="user-chat-area">
        <div className="chat-header-user">
          <div className="chat-header-info">
            <div className="chat-header-title-wrapper">
              <div className="chat-header-title">不可貨缺小幫手</div>
              <span className="shopping-cart-icon">🛒</span>
            </div>
            <div className="chat-header-subtitle">我們會盡快回覆您的訊息</div>
          </div>
        </div>

        <div className="messages-container-user">
          {messages.length === 0 ? (
            <div className="empty-messages-user">
              <p>還沒有訊息，開始對話吧！</p>
              <p className="empty-hint">輸入您的問題，管理員會盡快回覆</p>
            </div>
          ) : (
            messages.map(msg => {
              const isAdmin = msg.sender?.is_admin === true
              return (
                <div
                  key={msg.id}
                  className={`message-item-user ${isAdmin ? 'message-received-user' : 'message-sent-user'}`}
                >
                  <div className="message-content-user">
                    {isAdmin && (
                      <div className="message-sender-name">管理員</div>
                    )}
                    <div className="message-text-user">{msg.content}</div>
                    <div className="message-time-user">
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

        <form onSubmit={handleSendMessage} className="message-input-form-user">
          <input
            type="text"
            className="message-input-user"
            placeholder="輸入您的訊息..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn-send-message-user" disabled={!newMessage.trim()}>
            發送
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserChat
