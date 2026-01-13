// 用户认证工具（普通用户）
const USERS_KEY = 'website_users'
const USER_SESSION_KEY = 'user_session'

// 初始化（如果需要）
export const initUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]))
  }
}

// 注册新用户
export const registerUser = (username, password, email = '') => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  
  // 检查用户名是否已存在
  if (users.find(u => u.username === username)) {
    return { success: false, message: '用戶名已被使用' }
  }
  
  // 检查密码长度
  if (password.length < 6) {
    return { success: false, message: '密碼長度至少需要6個字符' }
  }
  
  // 创建新用户
  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    password: password,
    email: email.trim(),
    createdAt: new Date().toISOString()
  }
  
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  
  return { success: true, message: '註冊成功！' }
}

// 用户登录
export const loginUser = (username, password) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  const user = users.find(u => u.username === username && u.password === password)
  
  if (user) {
    const session = {
      userId: user.id,
      username: user.username,
      loginTime: new Date().toISOString(),
      type: 'user' // 标识这是普通用户
    }
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
    return { success: true, message: '登入成功！', user: user }
  }
  
  return { success: false, message: '用戶名或密碼錯誤' }
}

// 用户登出
export const logoutUser = () => {
  localStorage.removeItem(USER_SESSION_KEY)
}

// 检查用户是否已登录
export const isUserAuthenticated = () => {
  return !!localStorage.getItem(USER_SESSION_KEY)
}

// 获取当前登录用户
export const getCurrentUser = () => {
  const session = localStorage.getItem(USER_SESSION_KEY)
  return session ? JSON.parse(session) : null
}

// 获取当前用户ID
export const getCurrentUserId = () => {
  const user = getCurrentUser()
  return user ? user.userId : null
}

// 修改用户密码
export const changeUserPassword = (oldPassword, newPassword) => {
  const user = getCurrentUser()
  if (!user) {
    return { success: false, message: '請先登入' }
  }
  
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  const userIndex = users.findIndex(u => u.id === user.userId)
  
  if (userIndex === -1) {
    return { success: false, message: '用戶不存在' }
  }
  
  if (users[userIndex].password !== oldPassword) {
    return { success: false, message: '原密碼錯誤' }
  }
  
  if (newPassword.length < 6) {
    return { success: false, message: '新密碼長度至少需要6個字符' }
  }
  
  users[userIndex].password = newPassword
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  
  return { success: true, message: '密碼修改成功' }
}
