import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import ProductList from './components/ProductList'
import PreOrderProductList from './components/PreOrderProductList'
import ProductDetail from './components/ProductDetail'
import AddProduct from './components/AddProduct'
import EditProduct from './components/EditProduct'
import UserLogin from './components/UserLogin'
import UserRegister from './components/UserRegister'
import OAuthCallback from './components/OAuthCallback'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import UserOrders from './components/UserOrders'
import AdminSettings from './components/AdminSettings'
import OrderManagement from './components/OrderManagement'
import AnnouncementEditor from './components/AnnouncementEditor'
import AdminChat from './components/AdminChat'
import UserChat from './components/UserChat'
import ProtectedRoute from './components/ProtectedRoute'
import UserProtectedRoute from './components/UserProtectedRoute'
import EnvCheck from './components/EnvCheck'
import { getCurrentUser, getCurrentUserId, getUserProfile, signOut, onAuthStateChange } from './utils/supabaseAuth'
import { fetchCartByUser } from './utils/supabaseApi'
import './App.css'

function AppContent() {
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isUser, setIsUser] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    checkUserStatus()
    updateCartCount()
    
    // 監聽 Supabase Auth 狀態變化
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        await checkUserStatus()
        updateCartCount()
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    checkUserStatus()
    updateCartCount()
  }, [location.pathname])

  const updateCartCount = async () => {
    try {
      const userId = await getCurrentUserId()
      if (userId) {
        const cartData = await fetchCartByUser(userId)
        const total = cartData.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(total)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('更新購物車數量失敗:', error)
      setCartCount(0)
    }
  }

  const checkUserStatus = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setIsUser(true)
        const profile = await getUserProfile(user.id)
        // 調試：查看實際的 profile 數據
        console.log('🔍 Profile data:', profile)
        console.log('🔍 Display name value:', profile?.display_name)
        console.log('🔍 Username value:', profile?.username)
        console.log('🔍 Account value:', profile?.account)
        
        // 優先使用 display_name（用戶名），如果沒有則使用 username（帳號）作為後備
        // Supabase 返回的欄位名稱是 snake_case (display_name)
        const displayName = profile?.display_name
        const displayUsername = (displayName && displayName.trim() && displayName !== '') 
          ? displayName.trim() 
          : (profile?.username || user.email?.split('@')[0] || '用戶')
        
        console.log('🔍 Final display username:', displayUsername)
        
        setCurrentUser({
          id: user.id,
          email: user.email,
          username: displayUsername,
          account: profile?.account || profile?.username
        })
        // 檢查是否為管理員
        setIsAdmin(profile?.is_admin === true)
      } else {
        setIsUser(false)
        setCurrentUser(null)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('檢查用戶狀態失敗:', error)
      setIsUser(false)
      setCurrentUser(null)
      setIsAdmin(false)
    }
  }

  const handleUserLogout = async (e) => {
    e.preventDefault()
    try {
      await signOut()
      setIsUser(false)
      setCurrentUser(null)
      setCartCount(0)
      window.location.href = '/'
    } catch (error) {
      console.error('登出失敗:', error)
      alert('登出失敗，請稍後再試')
    }
  }

  return (
    <div className="app">
      <div className="background-dogs">
        <div className="dog dog-1">🐶</div>
        <div className="dog dog-2">🐶</div>
        <div className="dog dog-3">🐶</div>
        <div className="dog dog-4">🐶</div>
        <div className="paw-print paw-1">🐾</div>
        <div className="paw-print paw-2">🐾</div>
        <div className="paw-print paw-3">🐾</div>
        <div className="paw-print paw-4">🐾</div>
        <div className="paw-print paw-5">🐾</div>
        <div className="paw-print paw-6">🐾</div>
        <div className="paw-print paw-7">🐾</div>
        <div className="paw-print paw-8">🐾</div>
        <div className="paw-print paw-9">🐾</div>
        <div className="paw-print paw-10">🐾</div>
      </div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo-link">
            <span className="logo-dog logo-dog-left">🐶</span>
            <h1 className="logo">
              <span className="logo-char">不</span>
              <span className="logo-char">可</span>
              <span className="logo-char">貨</span>
              <span className="logo-char">缺</span>
            </h1>
            <span className="logo-dog logo-dog-right">🐶</span>
            {isUser && (
              <span className="user-info-top">
                {currentUser?.username}
              </span>
            )}
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">商品列表</Link>
            <Link to="/preorder" className="nav-link">預購商品</Link>
            <Link to="/cart" className="nav-link cart-link">
              購物車
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            {isUser ? (
              <>
                <Link to="/orders" className="nav-link">我的訂單</Link>
                <Link to="/chat" className="nav-link">💬 聯絡客服</Link>
                <Link to="/" className="nav-link" onClick={handleUserLogout}>
                  登出
                </Link>
              </>
            ) : (
              <>
                <Link to="/user/login" className="nav-link">登入</Link>
                <Link to="/user/register" className="nav-link">註冊</Link>
              </>
            )}
            {isAdmin && (
              <>
                <span className="nav-link separator">|</span>
                <Link to="/add" className="nav-link">上架商品</Link>
                <Link to="/admin/orders" className="nav-link">訂單管理</Link>
                <Link to="/admin/chat" className="nav-link">💬 客戶聊天</Link>
                <Link to="/admin/announcement" className="nav-link">公告編輯</Link>
                <Link to="/admin/settings" className="nav-link">管理設定</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
            <Route 
              path="/" 
              element={
                <UserProtectedRoute>
                  <ProductList onCartUpdate={updateCartCount} />
                </UserProtectedRoute>
              } 
            />
            <Route 
              path="/preorder" 
              element={
                <UserProtectedRoute>
                  <PreOrderProductList onCartUpdate={updateCartCount} />
                </UserProtectedRoute>
              } 
            />
            <Route 
              path="/product/:id" 
              element={
                <UserProtectedRoute>
                  <ProductDetail onCartUpdate={updateCartCount} />
                </UserProtectedRoute>
              } 
            />
            <Route path="/user/login" element={<UserLogin onLogin={checkUserStatus} />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/env-check" element={<EnvCheck />} />
            <Route 
              path="/cart" 
              element={
                <UserProtectedRoute>
                  <Cart onCartUpdate={updateCartCount} />
                </UserProtectedRoute>
              } 
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<UserOrders />} />
            <Route 
              path="/add" 
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute>
                  <OrderManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/announcement" 
              element={
                <ProtectedRoute>
                  <AnnouncementEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/chat" 
              element={
                <ProtectedRoute>
                  <AdminChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <UserProtectedRoute>
                  <UserChat />
                </UserProtectedRoute>
              } 
            />
          </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

