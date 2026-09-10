import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Kategori from './pages/Kategori'
import Barang from './pages/Barang'
import Penyusutan from './pages/Penyusutan'
import Renovasi from './pages/Renovasi'
import Pelacakan from './pages/Pelacakan'
import KIR from './pages/KIR'
import PeminjamanWasrik from './pages/PeminjamanWasrik'
import Approval from './pages/Approval'
import PengajuanServis from './pages/PengajuanServis'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pengajuan-servis" element={<ProtectedRoute><PengajuanServis /></ProtectedRoute>} />
      <Route path="/barang" element={<ProtectedRoute><Barang /></ProtectedRoute>} />
      
      {/* Portal Persetujuan (Approval) untuk Operator (Tahap 1), Pimpinan (Tahap 2) & Admin */}
      <Route path="/approval" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Approval /></ProtectedRoute>} />

      {/* Kartu Inventaris Ruangan (KIR) untuk Admin, Operator & Pimpinan */}
      <Route path="/kir" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><KIR /></ProtectedRoute>} />

      {/* Peminjaman Wasrik untuk Admin, Operator, Pimpinan */}
      <Route path="/peminjaman-wasrik" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><PeminjamanWasrik /></ProtectedRoute>} />

      {/* Audit Jejak Mutasi & BAST */}
      <Route path="/pelacakan" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Pelacakan /></ProtectedRoute>} />
      
      {/* Khusus Admin BMN */}
      <Route path="/kategori" element={<ProtectedRoute allowedRoles={['admin']}><Kategori /></ProtectedRoute>} />
      
      {/* Admin & Pimpinan (Nilai Buku / Laporan) */}
      <Route path="/penyusutan" element={<ProtectedRoute allowedRoles={['admin', 'pimpinan']}><Penyusutan /></ProtectedRoute>} />
      
      {/* Admin, Operator & Pimpinan (Operasional Pemeliharaan) */}
      <Route path="/renovasi" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Renovasi /></ProtectedRoute>} />
    </Routes>
  )
}

export default App