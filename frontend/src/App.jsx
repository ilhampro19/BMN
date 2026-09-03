import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Kategori from './pages/Kategori'
import Barang from './pages/Barang'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/kategori" element={<ProtectedRoute><Kategori /></ProtectedRoute>} />
      <Route path="/barang" element={<ProtectedRoute><Barang /></ProtectedRoute>} />
    </Routes>
  )
}

export default App