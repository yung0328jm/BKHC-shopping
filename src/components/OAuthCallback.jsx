import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { handleOAuthCallback } from '../utils/supabaseAuth'

function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 處理 Supabase OAuth 回調
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (data?.session) {
          // 處理用戶資料
          await handleOAuthCallback()
          // 登入成功，跳轉到首頁
          navigate('/')
          window.location.reload()
        } else {
          alert('登入失敗：無法取得 session')
          navigate('/user/login')
        }
      } catch (error) {
        console.error('OAuth 回調處理錯誤:', error)
        alert('登入失敗：' + (error.message || '請稍後再試'))
        navigate('/user/login')
      }
    }

    processCallback()
  }, [navigate])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>處理登入中...</h2>
        <p>請稍候</p>
      </div>
    </div>
  )
}

export default OAuthCallback
