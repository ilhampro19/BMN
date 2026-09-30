import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  UserCheck,
  Briefcase,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Mail,
  Copy
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { showAlert, showToast } from '../lib/alerts'

const API_URL = `${API_BASE_URL}/users`

const emptyForm = {
  name: '',
  email: '',
  role: 'staf',
  unit_kerja: '',
  password: 'password123',
}

function getRoleBadge(role) {
  switch (role) {
    case 'admin':
      return {
        label: 'Admin BMN',
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: Shield,
      }
    case 'operator':
      return {
        label: 'Operator TU',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: UserCheck,
      }
    case 'pimpinan':
      return {
        label: 'Pimpinan Itjen',
        bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        icon: Briefcase,
      }
    case 'staf':
    default:
      return {
        label: 'Staf Pemohon',
        bg: 'bg-blue-100 text-blue-900 border-blue-300',
        icon: User,
      }
  }
}

function Users() {
  const { user: currentUser } = useAuth()
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [alertMsg, setAlertMsg] = useState(null)

  // Form Modal (Create / Edit)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState(null)
  const [newPasswordVal, setNewPasswordVal] = useState('password123')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetSuccessData, setResetSuccessData] = useState(null)
  const [copiedReset, setCopiedReset] = useState(false)

  // Delete Confirm Modal
  const [deleteTargetUser, setDeleteTargetUser] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await axios.get(API_URL)
      setUsersList(res.data)
    } catch (err) {
      showToast.error('Gagal Memuat Data', 'Tidak dapat memuat daftar pengguna.')
    } finally {
      setLoading(false)
    }
  }

  function showInlineAlert(type, text) {
    setAlertMsg({ type, text })
    setTimeout(() => setAlertMsg(null), 4000)
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setShowPassword(false)
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(target) {
    setEditingId(target.id)
    setForm({
      name: target.name,
      email: target.email,
      role: target.role,
      unit_kerja: target.unit_kerja || '',
      password: '', // blank means keep existing password
    })
    setShowPassword(false)
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      if (editingId) {
        // Update user
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          unit_kerja: form.unit_kerja,
        }
        if (form.password) {
          payload.password = form.password
        }
        await axios.put(`${API_URL}/${editingId}`, payload)
        showToast.success('Pengguna Diperbarui', 'Data pengguna berhasil diperbarui.')
      } else {
        // Create user
        await axios.post(API_URL, form)
        showToast.success('Pengguna Didaftarkan', 'Akun pengguna baru berhasil dibuat.')
      }

      setShowModal(false)
      fetchUsers()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (!resetTargetUser) return
    setResetSubmitting(true)
    try {
      const res = await axios.post(`${API_URL}/${resetTargetUser.id}/reset-password`, {
        new_password: newPasswordVal,
      })
      setResetSuccessData({
        name: resetTargetUser.name,
        email: resetTargetUser.email,
        password: res.data.default_password,
      })
    } catch (err) {
      showToast.error('Reset Password Gagal', err.response?.data?.message || 'Gagal mereset kata sandi.')
      setResetTargetUser(null)
    } finally {
      setResetSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTargetUser) return
    setDeleteSubmitting(true)
    try {
      await axios.delete(`${API_URL}/${deleteTargetUser.id}`)
      showToast.success('Akun Dihapus', `Akun ${deleteTargetUser.name} berhasil dihapus.`)
      setDeleteTargetUser(null)
      fetchUsers()
    } catch (err) {
      showToast.error('Gagal Menghapus', err.response?.data?.message || 'Gagal menghapus pengguna.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.unit_kerja && u.unit_kerja.toLowerCase().includes(search.toLowerCase()))
    const matchRole = filterRole ? u.role === filterRole : true
    return matchSearch && matchRole
  })

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <Shield className="text-navy" size={26} />
              Manajemen Pengguna (User)
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              Kelola akun pegawai kedinasan, unit kerja, hak akses (role), dan pengaturan ulang kata sandi BMN Itjen.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-navy hover:bg-navy-light text-white font-semibold rounded-xl shadow-sm flex items-center gap-2 h-10 px-4 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus size={16} />
            <span>Tambah Pengguna</span>
          </Button>
        </div>

        {/* ALERT NOTIFICATION */}
        {alertMsg && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm transition-all ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {alertMsg.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <AlertCircle size={18} className="text-red-600" />
              )}
              <span className="font-medium">{alertMsg.text}</span>
            </div>
            <button
              onClick={() => setAlertMsg(null)}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* CONTROLS: SEARCH & ROLE FILTER */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <Input
              type="text"
              placeholder="Cari nama, email, atau unit kerja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Label htmlFor="role-filter" className="text-xs font-semibold text-gray-500 uppercase shrink-0">
              Filter Role:
            </Label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer text-gray-700"
            >
              <option value="">Semua Role ({usersList.length})</option>
              <option value="admin">Admin BMN</option>
              <option value="operator">Operator TU</option>
              <option value="staf">Staf Pemohon</option>
              <option value="pimpinan">Pimpinan Itjen</option>
            </select>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Tidak ada pengguna yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-5">Nama &amp; Email Pegawai</th>
                    <th className="py-3.5 px-5">Hak Akses (Role)</th>
                    <th className="py-3.5 px-5">Unit Kerja</th>
                    <th className="py-3.5 px-5">Terdaftar Sejak</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const badge = getRoleBadge(u.role)
                    const RoleIcon = badge.icon
                    const isSelf = currentUser?.id === u.id
                    const isMasterAdmin = u.id === 1

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* User identity */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-navy/5 dark:bg-white/10 border border-navy/10 dark:border-white/10 flex items-center justify-center text-navy dark:text-white font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                              {u.photo_url ? (
                                <img src={u.photo_url} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{u.name.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-2">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-mono">
                                <Mail size={12} className="text-gray-400" />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <RoleIcon size={13} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Unit kerja */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                            <Building2 size={13} className="text-gray-400 shrink-0" />
                            <span>{u.unit_kerja || 'Sekretariat Itjen'}</span>
                          </div>
                        </td>

                        {/* Registered date */}
                        <td className="py-4 px-5 text-xs text-gray-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Reset Kata Sandi"
                              onClick={() => {
                                setResetSuccessData(null)
                                setNewPasswordVal('password123')
                                setResetTargetUser(u)
                              }}
                              className="h-8 px-2.5 text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              <KeyRound size={14} className="mr-1" />
                              Reset Sandi
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Data Pengguna"
                              onClick={() => openEditModal(u)}
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              <Pencil size={14} />
                            </Button>

                            {/* Delete */}
                            {!isMasterAdmin && !isSelf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Hapus Pengguna"
                                onClick={() => setDeleteTargetUser(u)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MODAL: CREATE / EDIT USER ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-navy/5 text-navy flex items-center justify-center">
                    {editingId ? <Pencil size={20} /> : <UserPlus size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingId ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {editingId ? 'Perbarui informasi profil atau hak akses pegawai.' : 'Daftarkan akun kedinasan pegawai BMN baru.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Pegawai */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                    Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Contoh: Rahmat Hidayat, S.E."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                {/* Email Kedinasan */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                    Email Kedinasan (@kemendagri.go.id) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama.pegawai@kemendagri.go.id"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="h-10 text-sm rounded-xl font-mono"
                  />
                </div>

                {/* Role & Unit Kerja (2 kolom) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Role */}
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-semibold text-gray-700">
                      Hak Akses (Role) <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
                    >
                      <option value="staf">Staf Pemohon</option>
                      <option value="operator">Operator TU</option>
                      <option value="admin">Admin BMN</option>
                      <option value="pimpinan">Pimpinan Itjen</option>
                    </select>
                  </div>

                  {/* Unit Kerja */}
                  <div className="space-y-1.5">
                    <Label htmlFor="unit_kerja" className="text-xs font-semibold text-gray-700">
                      Unit Kerja
                    </Label>
                    <Input
                      id="unit_kerja"
                      type="text"
                      list="unit_kerja_suggestions"
                      placeholder="Contoh: Inspektorat Wilayah I"
                      value={form.unit_kerja}
                      onChange={(e) => setForm({ ...form, unit_kerja: e.target.value })}
                      className="h-10 text-sm rounded-xl"
                    />
                    <datalist id="unit_kerja_suggestions">
                      <option value="Sekretariat Itjen" />
                      <option value="Subbag BMN & Rumah Tangga" />
                      <option value="Bagian Umum & Kepegawaian" />
                      <option value="Inspektorat Wilayah I" />
                      <option value="Inspektorat Wilayah II" />
                      <option value="Inspektorat Wilayah III" />
                      <option value="Inspektorat Wilayah IV" />
                      <option value="Inspektorat Khusus" />
                    </datalist>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>
                      {editingId ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Awal'} {!editingId && <span className="text-red-500">*</span>}
                    </span>
                    {editingId && (
                      <span className="text-[11px] font-normal text-gray-400">Kosongkan jika tidak ingin mengubah</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingId ? 'Masukkan kata sandi baru...' : 'Default: password123'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editingId}
                      className="h-10 text-sm rounded-xl pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-10 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: RESET PASSWORD ── */}
        {resetTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-5 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Reset Kata Sandi</h3>
                    <p className="text-xs text-gray-500">{resetTargetUser.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {resetSuccessData ? (
                /* Success feedback with copy button */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 size={16} /> Kata sandi berhasil diatur ulang!
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      Silakan sampaikan informasi kredensial baru berikut kepada pegawai bersangkutan:
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200/80 font-mono text-xs space-y-1 mt-2">
                      <div className="text-gray-500">Email: <strong className="text-gray-900">{resetSuccessData.email}</strong></div>
                      <div className="text-gray-500">Password Baru: <strong className="text-emerald-700 font-bold">{resetSuccessData.password}</strong></div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = `Akun BMN Itjen Kemendagri\nEmail: ${resetSuccessData.email}\nPassword: ${resetSuccessData.password}`
                        navigator.clipboard.writeText(text)
                        setCopiedReset(true)
                        setTimeout(() => setCopiedReset(false), 2000)
                      }}
                      className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Copy size={14} />
                      {copiedReset ? 'Tersalin!' : 'Salin Kredensial'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setResetTargetUser(null)}
                      className="flex-1 h-10 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Selesai
                    </Button>
                  </div>
                </div>
              ) : (
                /* Confirmation input */
                <div className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Anda akan mengatur ulang kata sandi untuk akun <strong className="text-gray-900">{resetTargetUser.email}</strong>.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass" className="text-xs font-semibold text-gray-700">
                      Kata Sandi Baru
                    </Label>
                    <Input
                      id="new-pass"
                      type="text"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="h-10 text-sm rounded-xl font-mono"
                    />
                    <p className="text-[11px] text-gray-400">Default yang disarankan: <code>password123</code></p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetTargetUser(null)}
                      className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      disabled={resetSubmitting || !newPasswordVal}
                      onClick={handleResetPassword}
                      className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {resetSubmitting ? 'Memproses...' : 'Terapkan Reset'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL: DELETE CONFIRMATION ── */}
        {deleteTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-5 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Hapus Akun Pengguna</h3>
                    <p className="text-xs text-gray-500">Konfirmasi Penghapusan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTargetUser(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-xs text-red-900 space-y-2">
                <p>
                  Apakah Anda yakin ingin menghapus akun pegawai <strong className="text-gray-900">{deleteTargetUser.name}</strong> ({deleteTargetUser.email})?
                </p>
                <p className="text-red-700">
                  Tindakan ini tidak dapat dibatalkan. Pengguna ini tidak akan dapat login lagi ke Sistem BMN.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTargetUser(null)}
                  className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={handleDelete}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {deleteSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default Users
