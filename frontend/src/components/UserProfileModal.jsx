import { useState, useRef, useEffect } from 'react'
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
  Camera,
  UploadCloud,
  Trash2,
  Sparkles,
  Info,
  Check,
  RotateCcw,
  BadgeCheck,
  Lock,
} from 'lucide-react'

function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState('')
  const [unitKerja, setUnitKerja] = useState('')

  // Photo state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sync state with current user whenever modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setUnitKerja(user.unit_kerja || '')
      setPhotoFile(null)
      setPhotoPreview(null)
      setRemovePhoto(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('')
      setActiveTab('profile')
    }
  }, [isOpen, user])

  if (!isOpen) return null

  function processFile(file) {
    if (!file) return

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Format foto tidak didukung. Harap gunakan format JPG, PNG, atau WebP.')
      return
    }
    // Validate size (maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto terlalu besar (maksimal 2 MB). Silakan kompres terlebih dahulu.')
      return
    }

    setError('')
    setPhotoFile(file)
    setRemovePhoto(false)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    processFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleResetPhotoChange() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Determine current active display photo
  const currentSavedPhoto = user?.photo_url || (user?.photo ? `${API_BASE_URL.replace('/api', '')}/storage/${user.photo}` : null)
  const displayPhoto = removePhoto ? null : (photoPreview || currentSavedPhoto || null)
  const initials = (name || user?.name || 'US')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'BM'

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!newPassword) return 0
    let score = 0
    if (newPassword.length >= 6) score += 1
    if (newPassword.length >= 8) score += 1
    if (/[A-Z]/.test(newPassword)) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1
    return score
  }

  const passwordScore = getPasswordStrength()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

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
      const formData = new FormData()
      formData.append('id', user.id || user._id)
      formData.append('name', name)
      formData.append('unit_kerja', unitKerja)

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      if (removePhoto) {
        formData.append('remove_photo', '1')
      }

      if (newPassword) {
        formData.append('current_password', currentPassword)
        formData.append('new_password', newPassword)
      }

      const res = await axios.post(`${API_BASE_URL}/profile/update`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data?.user) {
        updateUserProfile(res.data.user)
      }

      setSuccess('Profil kedinasan Anda berhasil diperbarui!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPhotoFile(null)
      setRemovePhoto(false)

      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1400)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil. Periksa koneksi atau input Anda.')
    } finally {
      setLoading(false)
    }
  }

  const roleMeta = {
    admin: {
      label: 'Administrator BMN',
      desc: 'Wewenang penuh pengelolaan data master aset, kategori, dan manajemen pengguna.',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
      icon: Shield,
    },
    operator: {
      label: 'Operator TU Unit',
      desc: 'Wewenang verifikasi nota dinas servis, pencatatan KIR, dan pengelolaan aset unit kerja.',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
      icon: BadgeCheck,
    },
    pimpinan: {
      label: 'Inspektur Jenderal (Pimpinan)',
      desc: 'Wewenang approval disposisi servis, pengawasan audit jejak aset, dan laporan nilai buku.',
      badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      icon: Sparkles,
    },
    staf: {
      label: 'Staf Pemohon',
      desc: 'Wewenang pengajuan permohonan servis barang dan pemantauan inventaris kerja.',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
      icon: User,
    },
  }

  const currentRole = roleMeta[user?.role] || roleMeta.staf
  const RoleIcon = currentRole.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 dark:border-white/10 max-h-[92vh] flex flex-col overflow-hidden">

        {/* TOP HERO HEADER */}
        <div className="relative bg-gradient-to-r from-navy via-[#1e2e56] to-navy-light px-6 sm:px-8 pt-7 pb-12 text-white shrink-0">
          {/* Subtle decorative background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold/20 text-amber-300 border border-gold/30">
              Sistem BMN Itjen
            </span>
            <span className="text-[11px] text-white/50">• Profil Kedinasan</span>
          </div>
          <h3 className="text-xl font-bold font-display text-white tracking-tight">
            Pengaturan Akun & Profil
          </h3>
          <p className="text-xs text-white/65 mt-0.5">
            Kelola identitas, foto profil, dan kata sandi akun kedinasan Anda.
          </p>
        </div>

        {/* AVATAR & QUICK IDENTITY SECTION (Overlapping hero) */}
        <div className="relative px-6 sm:px-8 -mt-9 mb-1 shrink-0">
          <div className="bg-white dark:bg-gray-850 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">

            {/* AVATAR BOX & UPLOAD TRIGGER */}
            <div className="relative group shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Circular Avatar Container */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-24 h-24 sm:w-26 sm:h-26 rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer relative shadow-md flex items-center justify-center ${
                  isDragging
                    ? 'border-amber-400 ring-4 ring-amber-400/30 scale-105'
                    : 'border-white dark:border-gray-800 group-hover:border-gold group-hover:shadow-lg'
                }`}
                title="Klik atau seret foto ke sini untuk mengubah foto profil"
              >
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt="Foto Profil"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy via-[#233560] to-navy-light flex items-center justify-center text-white font-bold text-2xl font-display">
                    {initials}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-navy/70 backdrop-blur-2xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 text-center">
                  <Camera size={20} className="text-amber-300 mb-0.5" />
                  <span className="text-[10px] font-semibold">Ganti Foto</span>
                </div>
              </div>

              {/* Camera mini badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-gold hover:bg-amber-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer border-2 border-white dark:border-gray-900"
                title="Unggah Foto"
              >
                <Camera size={13} />
              </button>
            </div>

            {/* IDENTITY DETAILS & PHOTO ACTIONS */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {name || user?.name || 'Pegawai'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1 font-mono mt-0.5 truncate">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    {user?.email}
                  </p>
                </div>

                <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border self-center sm:self-start ${currentRole.badge}`}>
                  <RoleIcon size={12} />
                  <span>{currentRole.label}</span>
                </div>
              </div>

              {/* Action Buttons for Avatar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-[11px] font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                >
                  <UploadCloud size={13} className="text-navy dark:text-amber-300" />
                  Unggah Foto
                </button>

                {(photoPreview || removePhoto) && (
                  <button
                    type="button"
                    onClick={handleResetPhotoChange}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-[11px] font-medium text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Batalkan perubahan foto"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}

                {displayPhoto && !removePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer border border-red-200 dark:border-red-800/40"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                )}

                {photoFile && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check size={12} /> Foto baru siap disimpan
                  </span>
                )}
                {removePhoto && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Foto akan dihapus saat disimpan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL TABS */}
        <div className="px-6 sm:px-8 pt-3 pb-2 shrink-0">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-gray-800 text-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User size={14} /> Data Pribadi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-gray-800 text-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <KeyRound size={14} /> Keamanan Sandi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roleInfo')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'roleInfo'
                  ? 'bg-white dark:bg-gray-800 text-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield size={14} /> Wewenang
            </button>
          </div>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-3">

          {/* NOTIFICATION BANNERS */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">

            {/* TAB 1: DATA PRIBADI */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Nama Lengkap & Gelar */}
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name" className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Nama Lengkap &amp; Gelar Pegawai</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Wajib diisi</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="prof-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Contoh: Dr. H. Budi Santoso, M.Si"
                      className="h-10 text-sm rounded-xl pl-3.5 pr-10"
                    />
                    <User size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Unit Kerja */}
                <div className="space-y-1.5">
                  <Label htmlFor="prof-unit" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Unit Kerja / Bagian Kedinasan
                  </Label>
                  <div className="relative">
                    <Input
                      id="prof-unit"
                      type="text"
                      value={unitKerja}
                      onChange={(e) => setUnitKerja(e.target.value)}
                      placeholder="Contoh: Subbag BMN & Rumah Tangga, Irwil I"
                      className="h-10 text-sm rounded-xl pl-3.5 pr-10"
                    />
                    <Building2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Email Kedinasan (Readonly) */}
                <div className="space-y-1.5">
                  <Label htmlFor="prof-email" className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Email Kedinasan (Akun SSO)</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1">
                      <Lock size={10} /> Terkunci secara sistem
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="prof-email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="h-10 text-sm rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed pl-3.5 pr-10"
                    />
                    <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/30 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                  <Info size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <p className="leading-relaxed">
                    Foto dan nama yang Anda ubah akan langsung terlihat pada kartu identitas sistem, laporan BAST, nota dinas peminjaman wasrik, dan log aktivitas.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: KEAMANAN & SANDI */}
            {activeTab === 'security' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                  <Lock size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="leading-relaxed">
                    Biarkan form di bawah ini <strong>kosong</strong> jika Anda hanya ingin memperbarui nama, foto, atau unit kerja tanpa mengganti kata sandi.
                  </p>
                </div>

                {/* Kata Sandi Saat Ini */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-pass" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Kata Sandi Saat Ini
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-pass"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ketik kata sandi saat ini"
                      className="h-10 text-sm rounded-xl pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      title={showCurrent ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter kombinasi"
                      className="h-10 text-sm rounded-xl pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      title={showNew ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Kekuatan Sandi:</span>
                        <span className={`font-bold ${
                          passwordScore <= 2
                            ? 'text-red-500'
                            : passwordScore <= 3
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {passwordScore <= 2 ? 'Cukup Lemah' : passwordScore <= 3 ? 'Sedang' : 'Sangat Kuat'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordScore >= 1 ? (passwordScore <= 2 ? 'bg-red-500' : passwordScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordScore >= 2 ? (passwordScore <= 2 ? 'bg-red-500' : passwordScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordScore >= 3 ? (passwordScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                        }`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="h-10 text-sm rounded-xl pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      title={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WEWENANG & AKSES */}
            {activeTab === 'roleInfo' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center shrink-0">
                      <RoleIcon size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        {currentRole.label}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Level Otoritas Sistem BMN Itjen Kemendagri
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-1">
                    {currentRole.desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Modul yang Diizinkan:
                  </span>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside">
                    <li>Akses Dashboard &amp; Monitoring Inventaris</li>
                    <li>Permohonan &amp; Pelacakan Servis BMN</li>
                    {user?.role !== 'staf' && <li>Pengelolaan Kartu Inventaris Ruangan (KIR)</li>}
                    {user?.role !== 'staf' && <li>Pengajuan &amp; Approval Peminjaman Wasrik</li>}
                    {(user?.role === 'admin' || user?.role === 'pimpinan') && <li>Laporan Penyusutan &amp; Nilai Buku</li>}
                    {user?.role === 'admin' && <li>Manajemen Pengguna &amp; Hak Akses Kedinasan</li>}
                  </ul>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50 dark:bg-gray-850/80 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={loading}
            className="h-10 px-6 bg-navy hover:bg-[#1f2d50] text-white font-semibold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}

export default UserProfileModal

