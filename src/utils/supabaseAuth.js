// Supabase 用戶認證工具
import { supabase } from './supabaseClient'

// 使用 Supabase Auth 註冊
export const signUp = async (password, account, email = null, displayName = null) => {
  try {
    // 檢查 Supabase 連接
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return { 
        success: false, 
        message: 'Supabase 未正確設定。請檢查 .env 檔案並重新啟動開發伺服器。' 
      }
    }

    // Email 為必填項（由前端驗證）
    if (!email || !email.trim()) {
      return { 
        success: false, 
        message: '電子郵件為必填項' 
      }
    }
    
    const userEmail = email.trim()

    // 使用 email 和 password 註冊
    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          account: account,
          display_name: displayName
        }
      }
    })

    if (error) {
      console.error('Supabase Auth 錯誤:', error)
      // 提供更友善的錯誤訊息
      let errorMessage = error.message
      if (error.message.includes('Invalid API key') || error.message.includes('invalid api key')) {
        errorMessage = 'Supabase API 金鑰無效！\n\n請確認：\n1. 在專案根目錄有 .env 檔案\n2. .env 檔案包含正確的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY\n3. 重新啟動開發伺服器（修改 .env 後必須重啟）'
      } else if (error.message.includes('already registered')) {
        errorMessage = '此電子郵件已被註冊，請使用其他電子郵件或直接登入'
      } else if (error.message.includes('Password')) {
        errorMessage = '密碼不符合要求（至少需要6個字符）'
      } else if (error.message.includes('fetch')) {
        errorMessage = '無法連接到 Supabase。請檢查網路連線和 Supabase 設定。'
      } else if (error.message.includes('Email') && error.message.includes('invalid')) {
        errorMessage = '由於 Supabase 的限制，傳統註冊需要有效的電子郵件。\n\n建議：\n1. 使用 Google 或 LINE 登入（無需 email）\n2. 或提供有效的電子郵件地址'
      }
      return { success: false, message: errorMessage }
    }

    // 如果註冊成功，建立 profile
    if (data.user) {
      // 先嘗試包含 account 和 display_name 的完整數據
      let profileData = {
        id: data.user.id,
        username: account, // 保留 username 欄位作為帳號（用於登入）
        email: userEmail,
        is_admin: false
      }

      // 嘗試添加 account 和 display_name 欄位（如果欄位存在）
      // 如果欄位不存在，insert 會失敗，我們會在錯誤處理中降級到僅使用 username
      const fullProfileData = {
        ...profileData,
        account: account,  // 同時存儲到 account 欄位
        display_name: displayName || account, // 顯示名稱，如果沒有提供則使用帳號
      }

      let { error: profileError } = await supabase
        .from('profiles')
        .insert(fullProfileData)

      // 如果插入失敗，可能是因為 account 或 display_name 欄位不存在，嘗試僅使用基本欄位
      if (profileError) {
        console.error('建立用戶資料失敗（嘗試完整資料）:', profileError)
        
        // 如果錯誤不是重複鍵錯誤，嘗試僅使用基本欄位
        if (profileError.code !== '23505') {
          // 可能是欄位不存在的錯誤，嘗試僅使用基本欄位
          const { error: basicProfileError } = await supabase
            .from('profiles')
            .insert(profileData)

          if (basicProfileError) {
            console.error('建立用戶資料失敗（基本資料）:', basicProfileError)
            // 如果仍然是重複鍵錯誤，嘗試更新
            if (basicProfileError.code === '23505') {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  username: account,
                  email: userEmail
                })
                .eq('id', data.user.id)
              
              if (updateError) {
                console.error('更新用戶資料失敗:', updateError)
              }
            }
          }
        } else {
          // 重複鍵錯誤，嘗試更新
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: account,
              email: userEmail,
              display_name: displayName || account
            })
            .eq('id', data.user.id)
          
          if (updateError) {
            // 如果更新失敗（可能是欄位不存在），嘗試僅更新基本欄位
            const { error: basicUpdateError } = await supabase
              .from('profiles')
              .update({
                username: account,
                email: userEmail
              })
              .eq('id', data.user.id)
            
            if (basicUpdateError) {
              console.error('更新用戶資料失敗:', basicUpdateError)
            }
          }
        }
      }
    }

    // 檢查是否需要 email 確認
    if (data.user && !data.session) {
      // 如果 user 存在但沒有 session，表示需要 email 確認
      return { 
        success: false, 
        message: '註冊成功！請檢查您的電子郵件並點擊確認連結以完成註冊。\n\n如果沒有收到郵件，請檢查垃圾郵件資料夾。' 
      }
    }

    return { success: true, message: '註冊成功！', user: data.user }
  } catch (error) {
    console.error('註冊過程發生錯誤:', error)
    return { 
      success: false, 
      message: error.message || '註冊失敗，請檢查網路連線和 Supabase 設定' 
    }
  }
}

// 使用 Supabase Auth 登入
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Supabase Auth 錯誤:', error)
      let errorMessage = error.message
      if (error.message.includes('Invalid API key') || error.message.includes('invalid api key')) {
        errorMessage = 'Supabase API 金鑰無效！\n\n請確認：\n1. 在專案根目錄有 .env 檔案\n2. .env 檔案包含正確的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY\n3. 重新啟動開發伺服器（修改 .env 後必須重啟）'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = '電子郵件或密碼錯誤'
      }
      throw new Error(errorMessage)
    }

    return { success: true, message: '登入成功！', user: data.user }
  } catch (error) {
    return { success: false, message: error.message || '登入失敗' }
  }
}

// 使用帳號登入
export const signInWithUsername = async (account, password) => {
  try {
    // 先從 profiles 表找到用戶的 email（先查 account 欄位，如果沒有則查 username 欄位）
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('account', account)
      .single()

    // 如果 account 欄位查不到，則查 username 欄位（兼容舊數據）
    if (profileError || !profile) {
      const { data: profile2, error: profileError2 } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', account)
        .single()
      
      profile = profile2
      profileError = profileError2
    }

    if (profileError || !profile) {
      console.error('查找用戶資料失敗:', profileError)
      return { 
        success: false, 
        message: '找不到該帳號，請確認帳號是否正確，或使用註冊時的電子郵件登入' 
      }
    }

    // 使用 email 登入
    const result = await signIn(profile.email, password)
    if (!result.success && result.message.includes('電子郵件或密碼錯誤')) {
      return { 
        success: false, 
        message: '密碼錯誤，或請先檢查電子郵件並完成驗證（如果已啟用）' 
      }
    }
    return result
  } catch (error) {
    return { success: false, message: error.message || '登入失敗' }
  }
}

// 登出
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// 檢查用戶是否已登入
export const isAuthenticated = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    return false
  }
}

// 獲取當前用戶
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    return null
  }
}

// 獲取當前用戶 ID
export const getCurrentUserId = async () => {
  const user = await getCurrentUser()
  return user?.id || null
}

// 獲取用戶資料（包含 username）
export const getUserProfile = async (userId) => {
  try {
    // 明確指定要查詢的欄位，確保包含所有需要的欄位
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, is_admin, account, display_name')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('獲取用戶資料失敗:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('獲取用戶資料失敗:', error)
    return null
  }
}

// 監聽認證狀態變化
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// Google OAuth 登入
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Google 登入錯誤:', error)
    return { success: false, message: error.message || 'Google 登入失敗' }
  }
}

// LINE OAuth 登入
export const signInWithLINE = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'line',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('LINE 登入錯誤:', error)
    return { success: false, message: error.message || 'LINE 登入失敗' }
  }
}

// 處理 OAuth 回調後的用戶資料
export const handleOAuthCallback = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error

    if (user) {
      // 檢查 profile 是否存在
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // 如果 profile 不存在，建立新的 profile
      if (profileError || !profile) {
        const displayName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           `user_${user.id.substring(0, 8)}`
        const account = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: account, // 保留 username 作為帳號（用於登入）
            account: account,  // 同時存儲到 account 欄位
            display_name: displayName, // 顯示名稱
            email: user.email || '',
            is_admin: false
          })

        if (insertError) {
          console.error('建立用戶資料失敗:', insertError)
        }
      }
    }

    return { success: true, user }
  } catch (error) {
    console.error('處理 OAuth 回調錯誤:', error)
    return { success: false, message: error.message }
  }
}
