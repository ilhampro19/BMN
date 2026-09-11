import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Briefcase
} from 'lucide-react'

function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth()

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security'
  const [name, setName] = useState(user?.name || '')
  const [unitKerja, setUnitKerja] = useState(user?.unit_kerja || '')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation for password change
    if (newPassword) {
      if (!currentPassword) {
        setError('Kata sandi saat ini wajib diisi untuk mengubah kata sandi.')
        return
      }
      if (newPassword.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Konfirmasi kata sandi baru tidak cocok.')
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        id: user.id || user._id,
        name,
        unit_kerja: unitKerja,
      }
      if (newPassword) {
        payload.current_password = currentPassword
        payload.new_password = newPassword
      }

      const res = await axios.post(`${API_BASE_URL}/profile/update`, payload)

      // Update context state & localStorage
      updateUserProfile(res.data.user)

      setSuccess('Profil dan pengaturan berhasil diperbarui!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil.')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels = {
    admin: 'Administrator BMN',
    operator: 'Operator TU Unit',
    staf: 'Staf Pemohon',
    pimpinan: 'Inspektur Jenderal (Pimpinan)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 border border-gray-100 max-h-[92vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center font-bold text-lg shadow-md">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Profil &amp; Pengaturan Akun</h3>
              <p className="text-xs text-gray-500">Kelola identitas kedinasan dan keamanan sandi Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={14} /> Data Pribadi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <KeyRound size={14} /> Keamanan Sandi
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'profile' ? (
            <div className="space-y-3.5">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <Label htmlFor="prof-name" className="text-xs font-semibold text-gray-700">
                  Nama Lengkap &amp; Gelar
                </Label>
                <Input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nama Lengkap"
                  className="h-10 text-sm rounded-xl"
                />
              </div>

              {/* Email (Read only) */}
              <div className="space-y-1.5">
                <Label htmlFor="prof-email" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Email Kedinasan</span>
                  <span className="text-[10px] text-gray-400 font-normal">Terkunci secara sistem</span>
                </Label>
                <div className="relative">
                  <Input
                    id="prof-email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="h-10 text-sm rounded-xl bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
                  />
                  <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Role (Read only badge) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Hak Akses / Otorisasi
                </Label>
                <div className="h-10 px-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-600" />
                    {roleLabels[user?.role] || user?.role}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-navy/10 text-navy">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Unit Kerja */}
              <div className="space-y-1.5">
                <Label htmlFor="prof-unit" className="text-xs font-semibold text-gray-700">
                  Unit Kerja
                </Label>
                <div className="relative">
                  <Input
                    id="prof-unit"
                    type="text"
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    placeholder="Contoh: Subbag BMN & Rumah Tangga"
                    className="h-10 text-sm rounded-xl pr-9"
                  />
                  <Building2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                Kosongkan bagian ini jika Anda <strong>hanya</strong> ingin memperbarui nama atau unit kerja.
              </div>

              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="current-pass" className="text-xs font-semibold text-gray-700">
                  Kata Sandi Saat Ini
                </Label>
                <div className="relative">
                  <Input
                    id="current-pass"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan sandi saat ini"
                    className="h-10 text-sm rounded-xl pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="new-pass" className="text-xs font-semibold text-gray-700">
                  Kata Sandi Baru (Minimal 6 karakter)
                </Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan sandi baru"
                    className="h-10 text-sm rounded-xl pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass" className="text-xs font-semibold text-gray-700">
                  Ulangi Kata Sandi Baru
                </Label>
                <Input
                  id="confirm-pass"
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang sandi baru"
                  className="h-10 text-sm rounded-xl font-mono"
                />
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-2.5 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default UserProfileModal
