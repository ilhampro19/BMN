import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import {
  ShieldCheck,
  UserCheck,
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
  Award,
  Eye,
  EyeOff
} from 'lucide-react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Akses ditolak. Periksa kembali email kedinasan dan kata sandi Anda.')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickRole(roleEmail) {
    setEmail(roleEmail)
    setPassword('password123')
  }

  return (
    <div className="min-h-screen w-full bg-[#0b1329] relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans selection:bg-amber-500 selection:text-white">
      {/* LUXURY BACKGROUND ORNAMENTS & GLOW */}
      <div className="absolute top-[-15%] left-[-10%] w-[650px] h-[650px] bg-gradient-to-br from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-tl from-blue-600/15 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* MAIN CONTAINER (PRESTIGIOUS DUAL PANEL) */}
      <div className="relative z-10 w-full max-w-5xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.55)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* LEFT PANEL: HERO BRANDING (PRESTIGE & AUTHORITY) */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-b from-[#111a38]/90 via-[#0e1730]/95 to-[#090f20] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle gold line accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-75" />

          <div>
            {/* LOGO & OFFICIAL HEADER */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-white/5 p-[1px] shadow-lg shadow-amber-500/10">
                <div className="w-full h-full bg-[#16213e] rounded-2xl flex items-center justify-center p-2">
                  <img src={logoKemendagri} alt="Logo Kemendagri" className="w-10 h-10 object-contain drop-shadow" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-400 font-semibold block">
                  Republik Indonesia
                </span>
                <h2 className="text-base font-bold text-white tracking-wide uppercase leading-tight">
                  Kementerian Dalam Negeri
                </h2>
                <p className="text-xs text-white/50 font-medium">Inspektorat Jenderal</p>
              </div>
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <Sparkles size={13} className="text-amber-400" /> Portal Terintegrasi Aset Negara
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Sistem Manajemen <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                  Aset & BMN Itjen
                </span>
              </h1>
              <p className="text-xs text-white/60 leading-relaxed pt-1">
                Platform resmi tata kelola Barang Milik Negara (BMN), pengawasan wasrik, alur nota dinas servis berjenjang, dan mutasi ruangan gedung Itjen.
              </p>
            </div>

            {/* KEY METRICS / TRUST BADGES */}
            <div className="grid grid-cols-2 gap-2.5 pt-6 mt-6 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-lg font-bold text-amber-300">100%</p>
                <p className="text-[10px] text-white/50 leading-tight mt-0.5">Tervalidasi SAKTI & SIMAN</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-lg font-bold text-white flex items-center gap-1">
                  Tier-3 <Award size={14} className="text-amber-400" />
                </p>
                <p className="text-[10px] text-white/50 leading-tight mt-0.5">Alur Otorisasi Multi-Role</p>
              </div>
            </div>
          </div>

          {/* FOOTER LEFT */}
          <div className="pt-8 text-[11px] text-white/40 flex items-center justify-between">
            <span>Sekretariat Inspektorat Jenderal</span>
            <span className="font-mono text-white/30">v1.0 • 2026</span>
          </div>
        </div>

        {/* RIGHT PANEL: LUXURY LOGIN FORM */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 bg-white/[0.02] backdrop-blur-xl flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">

            {/* FORM TITLE */}
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Otentikasi Kedinasan <Lock size={18} className="text-amber-400" />
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Silakan masukkan kredensial akun kedinasan Anda untuk mengakses data BMN.
              </p>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">✕</div>
                <p className="flex-1 leading-snug">{error}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* EMAIL FIELD */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                  <Mail size={13} className="text-amber-400/80" /> Email Resmi Kedinasan
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama.pegawai@kemendagri.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/50 rounded-xl h-11 text-xs px-3.5 transition-all"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-400/80" /> Kata Sandi Keamanan
                  </Label>
                  <span className="text-[10px] text-amber-400/70 hover:text-amber-300 cursor-pointer">
                    Bantuan Akun?
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/50 rounded-xl h-11 text-xs px-3.5 pr-10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all flex items-center justify-center gap-2 text-xs tracking-wide uppercase mt-2 cursor-pointer"
              >
                {loading ? (
                  <span>Memverifikasi Otorisasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Dashboard BMN</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </form>

            {/* QUICK ROLE SELECTOR FOR EASY TESTING / ACCESSIBILITY */}
            <div className="pt-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-white/60 tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-amber-400" /> Akses Cepat Simulasi Role
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">Password: password123</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* ADMIN */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('admin.bmn@kemendagri.go.id')}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 group-hover:text-amber-200">
                    <ShieldCheck size={13} className="text-amber-400" />
                    <span>Admin BMN</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">Subbag BMN & Rumah Tangga</p>
                </button>

                {/* OPERATOR TU */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('operator.irwil1@kemendagri.go.id')}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                    <UserCheck size={13} className="text-emerald-400" />
                    <span>Operator TU</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">Verifikator Tahap 1 (TU)</p>
                </button>

                {/* STAF UMUM */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('staf.budi@kemendagri.go.id')}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                    <UserCheck size={13} className="text-blue-400" />
                    <span>Staf Pemohon</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">Pengusul Servis / Nota Dinas</p>
                </button>

                {/* PIMPINAN / IRJEN */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('irjen@kemendagri.go.id')}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                    <Briefcase size={13} className="text-amber-400" />
                    <span>Pimpinan Itjen</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">Inspektur Jenderal (Approval)</p>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default Login