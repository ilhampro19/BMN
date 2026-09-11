import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import { Eye, EyeOff, KeyRound, X, Copy } from 'lucide-react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [copied, setCopied] = useState(false)

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
      setError(err.response?.data?.message || 'Email atau kata sandi salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 2xl:p-12 font-sans" style={{ background: '#eceae5' }}>
      {/* MAIN CARD (Fluid & Responsive: Mobile, Tablet, Laptop, Desktop, TV) */}
      <div
        className="w-full max-w-md sm:max-w-lg lg:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 my-auto"
        style={{ background: '#f7f5f2' }}
      >

        {/* ── LEFT: FORM PANEL ── */}
        <div className="flex flex-col justify-center px-6 sm:px-10 py-8 sm:py-12 lg:py-14 2xl:px-14 2xl:py-16" style={{ background: '#f7f5f2' }}>
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-7 text-center">
            <img src={logoKemendagri} alt="Logo Kemendagri" className="w-14 h-14 object-contain mb-3" />
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Masuk ke Sistem BMN</h1>
            <p className="text-[11px] text-gray-400 mt-1 tracking-wide">INSPEKTORAT JENDERAL KEMENDAGRI</p>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 tracking-widest uppercase">Gunakan akun kedinasan</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 text-sm rounded-xl border-0 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
              style={{ background: '#eceae5' }}
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 pr-11 text-sm rounded-xl border-0 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                style={{ background: '#eceae5' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-bold text-sm rounded-full transition-all shadow-md hover:opacity-90 cursor-pointer disabled:opacity-60 mt-1"
              style={{ background: '#1a2744' }}
            >
              {loading ? 'MEMVERIFIKASI...' : 'MASUK'}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-gray-300">
            &copy; {new Date().getFullYear()} Inspektorat Jenderal Kementerian Dalam Negeri
          </p>
        </div>

        {/* ── FORGOT PASSWORD MODAL ── */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-5 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Lupa Kata Sandi?</h3>
                    <p className="text-xs text-gray-500">Bantuan Akses Akun Kedinasan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 space-y-2.5 border border-gray-100 leading-relaxed">
                <p>
                  Untuk menjaga keamanan aset dan data Barang Milik Negara (BMN), pengaturan ulang kata sandi akun kedinasan dilakukan secara terpusat oleh <strong className="text-gray-900">Administrator BMN</strong>.
                </p>
                <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Unit Pengelola:</span>
                    <span className="font-semibold text-gray-800">Subbag BMN &amp; Rumah Tangga</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Email Admin:</span>
                    <span className="font-mono font-semibold text-gray-800 text-[11px]">admin.bmn@kemendagri.go.id</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Lokasi:</span>
                    <span className="font-semibold text-gray-800">Gedung Itjen Kemendagri</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 bg-blue-50/60 border border-blue-100 p-3 rounded-xl flex items-start gap-2">
                <span className="text-blue-600 font-bold shrink-0 mt-0.5">ℹ</span>
                <p>Silakan hubungi Administrator atau Operator TU di unit kerja Anda untuk melakukan reset kata sandi ke sandi default.</p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('admin.bmn@kemendagri.go.id')
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex-1 h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={14} />
                  {copied ? 'Tersalin!' : 'Salin Email Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 h-10 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                  style={{ background: '#1a2744' }}
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RIGHT: DECORATIVE PANEL ── */}
        <div
          className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden px-12 py-14"
          style={{ background: '#eceae5' }}
        >
          {/* Circle ornaments – top right */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
            style={{ border: '40px solid #dedad4' }}
          />
          {/* Circle ornaments – bottom right */}
          <div
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full"
            style={{ border: '40px solid #dedad4' }}
          />
          {/* Circle ornaments – left middle */}
          <div
            className="absolute top-1/2 -left-14 w-44 h-44 rounded-full -translate-y-1/2"
            style={{ border: '30px solid #dedad4' }}
          />

          {/* Content */}
          <div className="relative z-10 text-center space-y-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
              style={{ background: '#1a2744' }}
            >
              <img src={logoKemendagri} alt="Logo" className="w-11 h-11 object-contain" />
            </div>

            <h2 className="text-3xl font-extrabold leading-tight" style={{ color: '#1a2744' }}>
              Selamat Datang!
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
              Platform resmi pengelolaan Barang Milik Negara (BMN) Itjen Kemendagri. Masukkan akun kedinasan Anda untuk melanjutkan.
            </p>


          </div>
        </div>

      </div>
    </div>
  )
}

export default Login