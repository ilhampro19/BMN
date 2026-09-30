import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Wrench,
  Boxes,
  Laptop,
  Car,
  ShieldCheck,
  MapPin,
  ClipboardList,
  FileSpreadsheet,
  History,
  Tags,
  Users,
  UserCheck,
  TrendingDown,
  Hammer,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  HelpCircle,
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

  // State to track open/expanded dropdowns in sidebar (only active page is open by default)
  const [openMenus, setOpenMenus] = useState({
    barang: false,
    approval: false,
    peminjaman: false,
  })

  // Synchronize openMenus with current path (accordion mode: only open the active page's dropdown)
  useEffect(() => {
    const path = location.pathname
    setOpenMenus({
      barang: path === '/barang',
      approval: path === '/approval',
      peminjaman: path.startsWith('/peminjaman'),
    })
  }, [location.pathname])

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  function toggleMenu(menuKey) {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const navLinkClass = (isCollapsedView = false) => ({ isActive }) =>
    `flex items-center ${isCollapsedView ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2.5'} text-xs font-semibold rounded-xl cursor-pointer ${
      isActive
        ? 'bg-white/15 text-white shadow-xs border-l-3 border-gold font-bold'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  const NavContent = ({ isCollapsedView = false }) => {
    const isBarangActive = location.pathname === '/barang'
    const isApprovalActive = location.pathname === '/approval'
    const isPeminjamanActive = location.pathname.startsWith('/peminjaman')

    const searchParams = new URLSearchParams(location.search)
    const currentTab = searchParams.get('tab')

    return (
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scrollbar">
        {/* 1. DASHBOARD */}
        <NavLink to="/dashboard" className={navLinkClass(isCollapsedView)} title="Dashboard">
          <LayoutDashboard size={18} className="shrink-0" />
          {!isCollapsedView && (
            <span className="truncate">
              {isPimpinan ? 'Executive Dashboard' : isStaf ? 'Dashboard Staf' : isOperator ? 'Dashboard Unit' : 'Dashboard'}
            </span>
          )}
        </NavLink>

        {/* 2. LAYANAN SERVIS BMN */}
        <NavLink to="/pengajuan-servis" className={navLinkClass(isCollapsedView)} title="Layanan Servis BMN">
          <Wrench size={18} className="shrink-0" />
          {!isCollapsedView && (
            <span className="truncate">
              {isStaf ? 'Pengajuan Servis BMN' : 'Layanan Servis BMN'}
            </span>
          )}
        </NavLink>

        {/* 3. MASTER BARANG BMN (DROPDOWN) */}
        {isCollapsedView ? (
          <NavLink to="/barang" className={navLinkClass(true)} title="Master Barang BMN">
            <Boxes size={18} className="shrink-0" />
          </NavLink>
        ) : (
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleMenu('barang')}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl cursor-pointer ${
                isBarangActive
                  ? 'bg-white/15 text-white font-bold border-l-3 border-gold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Boxes size={18} className="shrink-0" />
                <span className="truncate">
                  {isStaf ? 'Daftar Aset BMN' : isPimpinan ? 'Daftar Aset BMN' : isOperator ? 'Aset Unit Kerja' : 'Master Barang BMN'}
                </span>
              </div>
              {openMenus.barang ? (
                <ChevronDown size={14} className="shrink-0 text-gold" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-white/50" />
              )}
            </button>

            {openMenus.barang && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-white/10 ml-5 my-0.5">
                <Link
                  to="/barang?tab=umum"
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                    isBarangActive && (currentTab === 'umum' || !currentTab)
                      ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Laptop size={14} className="shrink-0 text-sky-400" />
                  <span className="truncate">Peralatan, TIK &amp; Mebel</span>
                </Link>

                <Link
                  to="/barang?tab=kendaraan"
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                    isBarangActive && currentTab === 'kendaraan'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Car size={14} className="shrink-0 text-amber-400" />
                  <span className="truncate">Kendaraan Dinas</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 4. PERSETUJUAN (APPROVAL) (DROPDOWN) */}
        {(isAdmin || isOperator || isPimpinan) && (
          isCollapsedView ? (
            <NavLink to="/approval" className={navLinkClass(true)} title="Persetujuan (Approval)">
              <ShieldCheck size={18} className="shrink-0" />
            </NavLink>
          ) : (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleMenu('approval')}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl cursor-pointer ${
                  isApprovalActive
                    ? 'bg-white/15 text-white font-bold border-l-3 border-gold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className="truncate">
                    {isOperator ? 'Verifikasi Usulan (TU)' : 'Persetujuan (Approval)'}
                  </span>
                </div>
                {openMenus.approval ? (
                  <ChevronDown size={14} className="shrink-0 text-gold" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-white/50" />
                )}
              </button>

              {openMenus.approval && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-white/10 ml-5 my-0.5">
                  <Link
                    to="/approval?tab=servis"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      isApprovalActive && (currentTab === 'servis' || !currentTab)
                        ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Wrench size={14} className="shrink-0 text-amber-400" />
                    <span className="truncate">Pengajuan Servis</span>
                  </Link>

                  <Link
                    to="/approval?tab=mutasi"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      isApprovalActive && currentTab === 'mutasi'
                        ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <MapPin size={14} className="shrink-0 text-emerald-400" />
                    <span className="truncate">Mutasi Ruangan</span>
                  </Link>

                  <Link
                    to="/approval?tab=wasrik"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      isApprovalActive && currentTab === 'wasrik'
                        ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Laptop size={14} className="shrink-0 text-sky-400" />
                    <span className="truncate">Peminjaman Wasrik</span>
                  </Link>
                </div>
              )}
            </div>
          )
        )}

        {/* 5. KARTU INVENTARIS RUANGAN (KIR) */}
        {!isStaf && (
          <NavLink to="/kir" className={navLinkClass(isCollapsedView)} title="Kartu Inventaris (KIR)">
            <ClipboardList size={18} className="shrink-0" />
            {!isCollapsedView && <span className="truncate">Kartu Inventaris (KIR)</span>}
          </NavLink>
        )}

        {/* 6. PEMINJAMAN BMN (DROPDOWN) */}
        {!isStaf && (
          isCollapsedView ? (
            <NavLink to="/peminjaman-wasrik" className={navLinkClass(true)} title="Peminjaman BMN">
              <FileSpreadsheet size={18} className="shrink-0" />
            </NavLink>
          ) : (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleMenu('peminjaman')}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl cursor-pointer ${
                  isPeminjamanActive
                    ? 'bg-white/15 text-white font-bold border-l-3 border-gold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet size={18} className="shrink-0" />
                  <span className="truncate">Peminjaman BMN</span>
                </div>
                {openMenus.peminjaman ? (
                  <ChevronDown size={14} className="shrink-0 text-gold" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-white/50" />
                )}
              </button>

              {openMenus.peminjaman && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-white/10 ml-5 my-0.5">
                  <Link
                    to="/peminjaman-wasrik?tab=wasrik"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      isPeminjamanActive && (currentTab === 'wasrik' || !currentTab)
                        ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Laptop size={14} className="shrink-0 text-sky-400" />
                    <span className="truncate">Wasrik / IT (SIPB)</span>
                  </Link>

                  <Link
                    to="/peminjaman-wasrik?tab=kendaraan"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      isPeminjamanActive && currentTab === 'kendaraan'
                        ? 'bg-white/15 text-white font-bold border-l-2 border-gold shadow-xs'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Car size={14} className="shrink-0 text-amber-400" />
                    <span className="truncate">Kendaraan Dinas (BAST)</span>
                  </Link>
                </div>
              )}
            </div>
          )
        )}

        {/* 7. PELACAKAN & BAST */}
        {!isStaf && (
          <NavLink to="/pelacakan" className={navLinkClass(isCollapsedView)} title="Pelacakan & BAST">
            <History size={18} className="shrink-0" />
            {!isCollapsedView && (
              <span className="truncate">
                {isPimpinan ? 'Audit Jejak Mutasi' : 'Pelacakan & BAST'}
              </span>
            )}
          </NavLink>
        )}

        {/* 8. DATA PEGAWAI (ADMIN & OPERATOR) */}
        {(isAdmin || isOperator) && (
          <NavLink to="/pegawai" className={navLinkClass(isCollapsedView)} title="Data Pegawai">
            <UserCheck size={18} className="shrink-0" />
            {!isCollapsedView && <span className="truncate">Data Pegawai</span>}
          </NavLink>
        )}

        {/* 9. KATEGORI & TARIF (ADMIN) */}
        {isAdmin && (
          <NavLink to="/kategori" className={navLinkClass(isCollapsedView)} title="Kategori & Tarif">
            <Tags size={18} className="shrink-0" />
            {!isCollapsedView && <span className="truncate">Kategori &amp; Tarif</span>}
          </NavLink>
        )}

        {/* 10. MANAJEMEN PENGGUNA (ADMIN) */}
        {isAdmin && (
          <NavLink to="/users" className={navLinkClass(isCollapsedView)} title="Manajemen Pengguna">
            <Users size={18} className="shrink-0" />
            {!isCollapsedView && <span className="truncate">Manajemen Pengguna</span>}
          </NavLink>
        )}

        {/* 10. PENYUSUTAN & NILAI BUKU */}
        {(isAdmin || isOperator || isPimpinan) && (
          <NavLink to="/penyusutan" className={navLinkClass(isCollapsedView)} title="Penyusutan">
            <TrendingDown size={18} className="shrink-0" />
            {!isCollapsedView && (
              <span className="truncate">
                {isPimpinan ? 'Laporan Nilai Buku' : 'Penyusutan & Nilai Buku'}
              </span>
            )}
          </NavLink>
        )}

        {/* 11. PEMELIHARAAN / SERVIS */}
        {!isStaf && (
          <NavLink to="/renovasi" className={navLinkClass(isCollapsedView)} title="Pemeliharaan / Servis">
            <Hammer size={18} className="shrink-0" />
            {!isCollapsedView && (
              <span className="truncate">
                {isOperator ? 'Servis & Perbaikan' : 'Pemeliharaan / Servis'}
              </span>
            )}
          </NavLink>
        )}
      </nav>
    )
  }

  return (
    <div className="min-h-screen bg-paper font-sans antialiased text-gray-900 selection:bg-amber-500 selection:text-white">
      
      {/* ─── 1. MOBILE SLIDE-OVER DRAWER (Layar HP & Tablet < 1024px) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-navy flex flex-col z-50 shadow-2xl">
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40 text-xs font-semibold cursor-pointer"
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
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-navy border-r border-gold/20 transition-all duration-200 ease-in-out print:hidden ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-40 w-6 h-6 rounded-full bg-navy border border-gold/40 flex items-center justify-center text-white/70 hover:text-white hover:border-gold shadow-md cursor-pointer"
          title={collapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Header */}
        <div className={`py-6 border-b border-white/10 flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-5'}`}>
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
        <div className={`p-4 border-t border-white/10 ${collapsed ? 'px-2' : 'px-4'}`}>
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40 text-xs font-semibold cursor-pointer ${
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
      <div className={`transition-all duration-200 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'} min-w-0 flex flex-col min-h-screen print:pl-0 print:min-h-0`}>
        
        {/* Topbar Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 shadow-2xs print:hidden">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-navy hover:bg-gray-100 rounded-xl cursor-pointer"
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
              className="p-2 text-gray-500 hover:text-navy hover:bg-gray-100 rounded-xl cursor-pointer"
              title="Pusat Bantuan & Panduan"
            >
              <HelpCircle size={18} />
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Profile Avatar Chip */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-gray-100 text-left cursor-pointer group"
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
                <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-navy truncate max-w-[140px]">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 w-full max-w-[2000px] mx-auto min-w-0 print:p-0 print:m-0 print:max-w-none print:w-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
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
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
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