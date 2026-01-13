import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '../utils/supabaseAuth'
import { getUserProfile } from '../utils/supabaseAuth'

function ProtectedRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setIsAdmin(profile?.is_admin === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('檢查管理員權限失敗:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [])

  if (loading) {
    return <div>載入中...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

export default ProtectedRoute
