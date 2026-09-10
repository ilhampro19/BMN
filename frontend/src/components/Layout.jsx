import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Search, Bell, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `block py-3 text-sm cursor-pointer border-l-2 transition-all duration-200 overflow-hidden whitespace-nowrap ${
      collapsed ? 'px-0 flex items-center justify-center border-l-0' : 'px-6'
    } ${
      isActive
        ? 'text-white font-medium bg-white/[0.06] border-gold'
        : 'text-white/60 border-transparent hover:bg-white/[0.04] hover:text-white/85'
    }`

  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const sidebarWidth = collapsed ? 'w-16 min-w-16' : 'w-64 min-w-64'
  const mainMargin = collapsed ? 'ml-16' : 'ml-64'

  return (
    <div className="flex min-h-screen bg-paper">
      {/* SIDEBAR */}
      <aside className={`${sidebarWidth} bg-navy flex flex-col fixed top-0 left-0 bottom-0 border-r border-gold/20 z-20 transition-all duration-200`}>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-30 w-6 h-6 rounded-full bg-navy border border-gold/30 flex items-center justify-center text-white/60 hover:text-white hover:border-gold/60 transition-colors shadow-md"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className={`pt-8 pb-6 border-b border-white/10 flex items-center gap-3 overflow-hidden transition-all duration-200 ${collapsed ? 'px-1 justify-center' : 'px-6'}`}>
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

        <div className={`py-5 border-t border-white/10 transition-all duration-200 ${collapsed ? 'px-1' : 'px-6'}`}>
          {!collapsed && (
            <div className="text-xs text-white/60 mb-3 font-mono-ledger">
              <span className="text-white font-medium block">{user?.name || 'Admin'}</span>
              <span className="inline-block uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gold font-semibold mt-1">
                {user?.role || 'admin'}
              </span>
              {user?.unit_kerja && (
                <span className="block text-[10px] text-white/40 truncate mt-1">{user.unit_kerja}</span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`block w-full border border-white/20 text-white/80 bg-transparent rounded py-2 text-sm hover:bg-white/[0.06] hover:text-white transition-colors ${collapsed ? 'text-xs px-1' : ''}`}
            title="Keluar"
          >
            {collapsed ? '↩' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={`${mainMargin} flex-1 flex flex-col transition-all duration-200`}>
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              type="text"
              placeholder="Cari kode barang atau lokasi..."
              className="w-full bg-gray-50 border border-black/5 rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-navy/30"
            />
          </div>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-ink/40 hover:text-ink/70 cursor-pointer transition-colors" />
            <Settings size={18} className="text-ink/40 hover:text-ink/70 cursor-pointer transition-colors" />
            <HelpCircle size={18} className="text-ink/40 hover:text-ink/70 cursor-pointer transition-colors" />
            <div className="w-px h-6 bg-black/10" />
            <div className="text-right">
              <p className="text-xs font-semibold text-ink">Sistem Aset Negara</p>
              <p className="text-[10px] text-ink/40">v.1.0</p>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-9">{children}</main>
      </div>
    </div>
  )
}

export default Layout