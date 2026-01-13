import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '../utils/supabaseAuth'

function UserProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div>載入中...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />
  }
  return children
}

export default UserProtectedRoute
