import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
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
import Users from './pages/Users'
import Pegawai from './pages/Pegawai'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <>
      <Toaster richColors position="top-right" closeButton />
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

      {/* Peminjaman Wasrik & Kendaraan untuk Admin, Operator, Pimpinan */}
      <Route path="/peminjaman-wasrik" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><PeminjamanWasrik /></ProtectedRoute>} />
      <Route path="/peminjaman%20wasrik" element={<Navigate to="/peminjaman-wasrik" replace />} />
      <Route path="/peminjaman wasrik" element={<Navigate to="/peminjaman-wasrik" replace />} />
      <Route path="/peminjaman" element={<Navigate to="/peminjaman-wasrik" replace />} />
      <Route path="/wasrik" element={<Navigate to="/peminjaman-wasrik" replace />} />
      <Route path="/kendaraan" element={<Navigate to="/peminjaman-wasrik" replace />} />

      {/* Audit Jejak Mutasi & BAST */}
      <Route path="/pelacakan" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Pelacakan /></ProtectedRoute>} />
      
      {/* Khusus Admin BMN & Operator */}
      <Route path="/pegawai" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><Pegawai /></ProtectedRoute>} />
      <Route path="/kategori" element={<ProtectedRoute allowedRoles={['admin']}><Kategori /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      
      {/* Admin, Operator & Pimpinan (Nilai Buku / Depresiasi) */}
      <Route path="/penyusutan" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Penyusutan /></ProtectedRoute>} />
      
      {/* Admin, Operator & Pimpinan (Operasional Pemeliharaan) */}
      <Route path="/renovasi" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'pimpinan']}><Renovasi /></ProtectedRoute>} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}

export default App