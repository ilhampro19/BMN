import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    // Belum login - arahkan ke login page
    return <Navigate to="/login" replace />
  }

  // Jika halaman dibatasi untuk role tertentu
  if (allowedRoles && !allowedRoles.includes(user?.role || 'admin')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute