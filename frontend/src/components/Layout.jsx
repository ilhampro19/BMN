import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  Shield,
  Info,
  CheckCircle2
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
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `block py-3 text-sm cursor-pointer border-l-2 transition-all duration-200 overflow-hidden whitespace-nowrap ${
      collapsed ? 'lg:px-0 flex items-center justify-center lg:border-l-0 px-6' : 'px-6'
    } ${
      isActive
        ? 'text-white font-medium bg-white/[0.08] border-gold'
        : 'text-white/65 border-transparent hover:bg-white/[0.04] hover:text-white'
    }`

  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const desktopSidebarWidth = collapsed ? 'lg:w-16' : 'lg:w-64'
  const desktopMainMargin = collapsed ? 'lg:ml-16' : 'lg:ml-64'

  return (
    <div className="flex min-h-screen bg-paper font-sans selection:bg-amber-500 selection:text-white">
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR: Slide-in Drawer on Mobile (<1024px), Static Column on Desktop (>=1024px) */}
      <aside
        className={`w-72 ${desktopSidebarWidth} bg-navy flex flex-col fixed top-0 left-0 bottom-0 border-r border-gold/20 z-50 lg:z-20 transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center p-1 shadow-xs">
              <img src={logoKemendagri} alt="Logo Kemendagri" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white tracking-wide uppercase">Itjen Kemendagri</p>
              <p className="text-[9px] text-white/50">Sistem BMN</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 z-30 w-6 h-6 rounded-full bg-navy border border-gold/30 items-center justify-center text-white/60 hover:text-white hover:border-gold/60 transition-colors shadow-md cursor-pointer"
          title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Desktop Brand Header */}
        <div className={`hidden lg:flex pt-8 pb-6 border-b border-white/10 items-center gap-3 overflow-hidden transition-all duration-200 ${collapsed ? 'px-1 justify-center' : 'px-6'}`}>
          <div className="w-14 h-14 rounded-full bg-paper flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img src={logoKemendagri} alt="Logo Kemendagri" className="w-9 h-9 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[11px] text-white/45 tracking-wide uppercase">
                Itjen Kemendagri
              </p>
              <p className="text-[10px] text-white/30">Sistem Manajemen Aset BMN</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <NavLink to="/dashboard" className={navLinkClass} title="Dashboard">
            {collapsed
              ? <span className="text-xs font-bold">DB</span>
              : (isPimpinan ? 'Executive Dashboard' : isStaf ? 'Dashboard Staf' : isOperator ? 'Dashboard Unit' : 'Dashboard')}
          </NavLink>

          <NavLink to="/pengajuan-servis" className={navLinkClass} title="Layanan Servis BMN">
            {collapsed ? <span className="text-xs font-bold">LS</span> : (isStaf ? 'Pengajuan Servis BMN' : 'Layanan Servis BMN')}
          </NavLink>

          <NavLink to="/barang" className={navLinkClass} title="Master Barang BMN">
            {collapsed
              ? <span className="text-xs font-bold">BG</span>
              : (isStaf ? 'Daftar Aset BMN' : isPimpinan ? 'Daftar Aset BMN' : isOperator ? 'Aset Unit Kerja' : 'Master Barang BMN')}
          </NavLink>

          {(isAdmin || isOperator || isPimpinan) && (
            <NavLink to="/approval" className={navLinkClass} title="Persetujuan (Approval)">
              {collapsed ? <span className="text-xs font-bold">AP</span> : (isOperator ? 'Verifikasi Usulan (TU)' : 'Persetujuan (Approval)')}
            </NavLink>
          )}

          {!isStaf && (
            <NavLink to="/kir" className={navLinkClass} title="Kartu Inventaris (KIR)">
              {collapsed ? <span className="text-xs font-bold">KI</span> : 'Kartu Inventaris (KIR)'}
            </NavLink>
          )}

          {!isStaf && (
            <NavLink to="/peminjaman-wasrik" className={navLinkClass} title="Peminjaman Wasrik">
              {collapsed ? <span className="text-xs font-bold">PW</span> : 'Peminjaman Wasrik'}
            </NavLink>
          )}

          {!isStaf && (
            <NavLink to="/pelacakan" className={navLinkClass} title="Pelacakan & BAST">
              {collapsed ? <span className="text-xs font-bold">PL</span> : (isPimpinan ? 'Audit Jejak Mutasi' : 'Pelacakan & BAST')}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/kategori" className={navLinkClass} title="Kategori & Tarif">
              {collapsed ? <span className="text-xs font-bold">KT</span> : 'Kategori & Tarif'}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/users" className={navLinkClass} title="Manajemen Pengguna">
              {collapsed ? <span className="text-xs font-bold">US</span> : 'Manajemen Pengguna'}
            </NavLink>
          )}

          {(isAdmin || isPimpinan) && (
            <NavLink to="/penyusutan" className={navLinkClass} title="Penyusutan">
              {collapsed ? <span className="text-xs font-bold">PS</span> : (isPimpinan ? 'Laporan Nilai Buku' : 'Penyusutan')}
            </NavLink>
          )}

          {!isStaf && (
            <NavLink to="/renovasi" className={navLinkClass} title="Pemeliharaan / Servis">
              {collapsed ? <span className="text-xs font-bold">RV</span> : (isOperator ? 'Servis & Perbaikan' : 'Pemeliharaan / Servis')}
            </NavLink>
          )}
        </nav>

        <div className={`py-4 border-t border-white/10 transition-all duration-200 ${collapsed ? 'px-1' : 'px-4'}`}>
          {!collapsed ? (
            <div
              onClick={() => setShowProfileModal(true)}
              className="group text-xs text-white/70 mb-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-gold/30 transition-all cursor-pointer"
              title="Klik untuk Pengaturan Profil"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold truncate group-hover:text-amber-300 transition-colors">
                  {user?.name || 'Pegawai'}
                </span>
                <Settings size={13} className="text-white/40 group-hover:text-amber-300 transition-colors shrink-0 ml-1" />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-block uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gold font-bold tracking-wider">
                  {user?.role || 'staf'}
                </span>
                <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
                  • Pengaturan
                </span>
              </div>
              {user?.unit_kerja && (
                <span className="block text-[10px] text-white/45 truncate mt-1">{user.unit_kerja}</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center justify-center p-2 mb-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gold transition-colors"
              title="Pengaturan Profil"
            >
              <Settings size={15} />
            </button>
          )}
          <button
            onClick={handleLogout}
            className={`block w-full border border-white/20 text-white/80 bg-transparent rounded-lg py-2 text-xs font-semibold hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer ${collapsed ? 'px-1' : ''}`}
            title="Keluar"
          >
            {collapsed ? '↩' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${desktopMainMargin}`}>
        {/* TOPBAR (Sticky Editorial Header) */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 2xl:px-12 shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Hamburger Button (Mobile / Tablet) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Branding Badge */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center p-0.5">
                <img src={logoKemendagri} alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-xs font-bold text-navy tracking-tight font-display">
                BMN Itjen
              </span>
            </div>

            {/* Search Input (Responsive width) */}
            <div className="relative hidden md:block w-48 sm:w-60 lg:w-80 xl:w-96 2xl:w-[420px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode barang atau lokasi..."
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-navy focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* 1. LONCENG NOTIFIKASI */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown)
                  setShowHelpModal(false)
                }}
                className="relative p-2 text-gray-500 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Pemberitahuan Sistem"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 space-y-3 z-40 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-800">Pemberitahuan Sistem</span>
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Sinkronisasi SIMAN Aktif
                      </div>
                      <p className="text-[11px] text-gray-500">Database aset terhubung dengan kode akun standar BMN.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Info size={13} className="text-blue-500" />
                        Alur Nota Dinas Servis
                      </div>
                      <p className="text-[11px] text-gray-500">Staf dapat mengusulkan perbaikan BMN melalui menu Layanan Servis.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PENGATURAN PROFIL (GEAR) */}
            <button
              type="button"
              onClick={() => {
                setShowProfileModal(true)
                setShowNotifDropdown(false)
              }}
              className="p-2 text-gray-500 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Pengaturan Profil Akun"
            >
              <Settings size={18} />
            </button>

            {/* 3. BANTUAN & PANDUAN (?) */}
            <button
              type="button"
              onClick={() => {
                setShowHelpModal(true)
                setShowNotifDropdown(false)
              }}
              className="p-2 text-gray-500 hover:text-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Pusat Bantuan & Panduan"
            >
              <HelpCircle size={18} />
            </button>

            <div className="w-px h-6 bg-black/10 mx-1 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink font-display">Sistem Aset Negara</p>
              <p className="text-[10px] text-ink/40">v.1.0 • Itjen Kemendagri</p>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT (Responsive Magazine Container for Mobile, Tablet, Laptop, Desktop, TV) */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 2xl:p-10 3xl:p-12 w-full max-w-[2200px] mx-auto min-w-0">
          {children}
        </main>

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
                  <p>Staf mengajukan permohonan servis barang &rarr; Operator TU memverifikasi & menerbitkan nomor nota dinas &rarr; Pimpinan Itjen menyetujui &rarr; Rekanan melaksanakan perbaikan.</p>
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
    </div>
  )
}

export default Layout