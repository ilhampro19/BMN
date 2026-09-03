import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    // Not logged in - redirect straight to the login page
    return <Navigate to="/login" replace />
  }

  // Logged in - render the requested page
  return children
}

export default ProtectedRoute