import { NavLink, useNavigate } from 'react-router-dom'
import { Search, Bell, Settings, HelpCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `block px-6 py-3 text-sm cursor-pointer border-l-2 transition-colors ${
      isActive
        ? 'text-white font-medium bg-white/[0.06] border-gold'
        : 'text-white/60 border-transparent hover:bg-white/[0.04] hover:text-white/85'
    }`

  return (
    <div className="flex min-h-screen bg-paper">
      {/* SIDEBAR */}
      <aside className="w-64 min-w-64 bg-navy flex flex-col fixed top-0 left-0 bottom-0 border-r border-gold/20">
        <div className="px-6 pt-8 pb-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-paper flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img src={logoKemendagri} alt="Logo Kemendagri" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <p className="text-[11px] text-white/45 tracking-wide uppercase">
              Kementerian Dalam Negeri
            </p>
            <p className="text-[10px] text-white/30">Sistem Manajemen Aset</p>
          </div>
        </div>

        <nav className="flex-1 py-4">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/barang" className={navLinkClass}>
            Barang
          </NavLink>
          <NavLink to="/kategori" className={navLinkClass}>
            Kategori
          </NavLink>
        </nav>

        <div className="px-6 py-5 border-t border-white/10">
          <div className="text-xs text-white/40 mb-3 font-mono-ledger">
            {user?.name || 'Admin'} · {user?.role || 'staff'}
          </div>
          <button
            onClick={handleLogout}
            className="block w-full border border-white/20 text-white/80 bg-transparent rounded py-2 text-sm hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="ml-64 flex-1 flex flex-col">
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