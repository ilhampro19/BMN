import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import UserProfileModal from './UserProfileModal'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const navLinkClass = (isCollapsedView = false) => ({ isActive }) =>
    `flex items-center ${isCollapsedView ? 'justify-center px-0 py-3.5' : 'gap-3 px-5 py-3'} text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-white/15 text-white shadow-xs border-l-3 border-gold font-bold'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  const NavContent = ({ isCollapsedView = false }) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scrollbar">
      <NavLink to="/dashboard" className={navLinkClass(isCollapsedView)} title="Dashboard">
        {isCollapsedView ? <span className="font-bold">DB</span> : (isPimpinan ? 'Executive Dashboard' : isStaf ? 'Dashboard Staf' : isOperator ? 'Dashboard Unit' : 'Dashboard')}
      </NavLink>

      <NavLink to="/pengajuan-servis" className={navLinkClass(isCollapsedView)} title="Layanan Servis BMN">
        {isCollapsedView ? <span className="font-bold">LS</span> : (isStaf ? 'Pengajuan Servis BMN' : 'Layanan Servis BMN')}
      </NavLink>

      <NavLink to="/barang" className={navLinkClass(isCollapsedView)} title="Master Barang BMN">
        {isCollapsedView ? <span className="font-bold">BG</span> : (isStaf ? 'Daftar Aset BMN' : isPimpinan ? 'Daftar Aset BMN' : isOperator ? 'Aset Unit Kerja' : 'Master Barang BMN')}
      </NavLink>

      {(isAdmin || isOperator || isPimpinan) && (
        <NavLink to="/approval" className={navLinkClass(isCollapsedView)} title="Persetujuan (Approval)">
          {isCollapsedView ? <span className="font-bold">AP</span> : (isOperator ? 'Verifikasi Usulan (TU)' : 'Persetujuan (Approval)')}
        </NavLink>
      )}

      {!isStaf && (
        <NavLink to="/kir" className={navLinkClass(isCollapsedView)} title="Kartu Inventaris (KIR)">
          {isCollapsedView ? <span className="font-bold">KI</span> : 'Kartu Inventaris (KIR)'}
        </NavLink>
      )}

      {!isStaf && (
        <NavLink to="/peminjaman-wasrik" className={navLinkClass(isCollapsedView)} title="Peminjaman Wasrik">
          {isCollapsedView ? <span className="font-bold">PW</span> : 'Peminjaman Wasrik'}
        </NavLink>
      )}

      {!isStaf && (
        <NavLink to="/pelacakan" className={navLinkClass(isCollapsedView)} title="Pelacakan & BAST">
          {isCollapsedView ? <span className="font-bold">PL</span> : (isPimpinan ? 'Audit Jejak Mutasi' : 'Pelacakan & BAST')}
        </NavLink>
      )}

      {isAdmin && (
        <NavLink to="/kategori" className={navLinkClass(isCollapsedView)} title="Kategori & Tarif">
          {isCollapsedView ? <span className="font-bold">KT</span> : 'Kategori & Tarif'}
        </NavLink>
      )}

      {isAdmin && (
        <NavLink to="/users" className={navLinkClass(isCollapsedView)} title="Manajemen Pengguna">
          {isCollapsedView ? <span className="font-bold">US</span> : 'Manajemen Pengguna'}
        </NavLink>
      )}

      {(isAdmin || isPimpinan) && (
        <NavLink to="/penyusutan" className={navLinkClass(isCollapsedView)} title="Penyusutan">
          {isCollapsedView ? <span className="font-bold">PS</span> : (isPimpinan ? 'Laporan Nilai Buku' : 'Penyusutan')}
        </NavLink>
      )}

      {!isStaf && (
        <NavLink to="/renovasi" className={navLinkClass(isCollapsedView)} title="Pemeliharaan / Servis">
          {isCollapsedView ? <span className="font-bold">RV</span> : (isOperator ? 'Servis & Perbaikan' : 'Pemeliharaan / Servis')}
        </NavLink>
      )}
    </nav>
  )

  return (
    <div className="min-h-screen bg-paper font-sans antialiased text-gray-900 selection:bg-amber-500 selection:text-white">
      
      {/* ─── 1. MOBILE SLIDE-OVER DRAWER (Layar HP & Tablet < 1024px) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-navy flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
                  <img src={logoKemendagri} alt="Logo Kemendagri" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Itjen Kemendagri</p>
                  <p className="text-[10px] text-white/50">Sistem BMN v1.0</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                title="Tutup Menu"
              >
                <X size={18} />
              </button>
            </div>

            <NavContent isCollapsedView={false} />

            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── 2. DESKTOP PERMANENT SIDEBAR (Layar Desktop >= 1024px) ─── */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-navy border-r border-gold/20 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-40 w-6 h-6 rounded-full bg-navy border border-gold/40 flex items-center justify-center text-white/70 hover:text-white hover:border-gold transition-colors shadow-md cursor-pointer"
          title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Header */}
        <div className={`py-6 border-b border-white/10 flex items-center gap-3 transition-all duration-300 ${collapsed ? 'px-2 justify-center' : 'px-5'}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
            <img src={logoKemendagri} alt="Logo Kemendagri" className="w-7 h-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white tracking-wider uppercase truncate">
                Itjen Kemendagri
              </p>
              <p className="text-[10px] text-white/50 truncate">Sistem Manajemen Aset BMN</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <NavContent isCollapsedView={collapsed} />

        {/* Footer Logout */}
        <div className={`p-4 border-t border-white/10 transition-all ${collapsed ? 'px-2' : 'px-4'}`}>
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40 text-xs font-semibold transition-colors cursor-pointer ${
              collapsed ? 'px-0' : 'px-4'
            }`}
            title="Keluar dari Sistem"
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ─── 3. MAIN PAGE CONTAINER (Dengan padding-left eksak di desktop) ─── */}
      <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'} min-w-0 flex flex-col min-h-screen`}>
        
        {/* Topbar Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 shadow-2xs">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center p-0.5">
                <img src={logoKemendagri} alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-xs font-bold text-navy tracking-tight">
                BMN Itjen
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Help Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-gray-500 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Pusat Bantuan & Panduan"
            >
              <HelpCircle size={18} />
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Profile Avatar Chip */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-gray-100 transition-all text-left cursor-pointer group"
              title="Buka Profil Kedinasan"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-light border border-gold/40 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {(user?.name || 'US')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase() || 'BM'}
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-navy transition-colors truncate max-w-[140px]">
                  {user?.name || 'Pegawai'}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {user?.role || 'staf'}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 w-full max-w-[2000px] mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* HELP / PANDUAN MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pusat Bantuan Sistem BMN</h3>
                  <p className="text-xs text-gray-500">Inspektorat Jenderal Kementerian Dalam Negeri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                <span className="font-bold text-gray-800">1. Alur Layanan Servis BMN:</span>
                <p>Staf mengajukan permohonan servis barang &rarr; Operator TU memverifikasi &amp; menerbitkan nomor nota dinas &rarr; Pimpinan Itjen menyetujui &rarr; Rekanan melaksanakan perbaikan.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                <span className="font-bold text-gray-800">2. Manajemen Pengguna &amp; Hak Akses:</span>
                <p>Hanya <strong>Administrator BMN</strong> yang berwenang menambah pegawai baru, mengubah role, atau me-reset kata sandi akun kedinasan.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                <span className="font-bold text-gray-800">3. Kontak Bantuan Teknis:</span>
                <p>Subbag BMN &amp; Rumah Tangga, Gedung Itjen Kemendagri.<br />Email: <code>admin.bmn@kemendagri.go.id</code></p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full h-10 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Tutup Bantuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
