// 管理员认证工具
const ADMIN_KEY = 'admin_credentials'
const ADMIN_SESSION_KEY = 'admin_session'

// 初始化默认管理员账号（如果不存在）
export const initAdmin = () => {
  const admin = localStorage.getItem(ADMIN_KEY)
  if (!admin) {
    const defaultAdmin = {
      username: 'admin',
      password: 'admin123' // 默认密码，建议首次登录后修改
    }
    localStorage.setItem(ADMIN_KEY, JSON.stringify(defaultAdmin))
  }
}

// 登录
export const login = (username, password) => {
  const admin = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}')
  
  if (admin.username === username && admin.password === password) {
    const session = {
      username: username,
      loginTime: new Date().toISOString(),
      type: 'admin' // 标识这是管理员
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    return true
  }
  return false
}

// 登出
export const logout = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

// 检查是否已登录（管理员）
export const isAuthenticated = () => {
  return !!localStorage.getItem(ADMIN_SESSION_KEY)
}

// 获取当前登录管理员
export const getCurrentAdmin = () => {
  const session = localStorage.getItem(ADMIN_SESSION_KEY)
  return session ? JSON.parse(session) : null
}

// 修改密码
export const changePassword = (oldPassword, newPassword) => {
  const admin = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}')
  
  if (admin.password !== oldPassword) {
    return { success: false, message: '原密碼錯誤' }
  }
  
  if (newPassword.length < 6) {
    return { success: false, message: '新密碼長度至少需要6個字符' }
  }
  
  admin.password = newPassword
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  return { success: true, message: '密碼修改成功' }
}

// 修改用户名
export const changeUsername = (newUsername, password) => {
  const admin = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}')
  
  if (admin.password !== password) {
    return { success: false, message: '密碼錯誤' }
  }
  
  if (!newUsername.trim()) {
    return { success: false, message: '用戶名不能為空' }
  }
  
  admin.username = newUsername.trim()
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  
  // 更新session
  const session = getCurrentAdmin()
  if (session) {
    session.username = newUsername.trim()
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  }
  
  return { success: true, message: '用戶名修改成功' }
}
