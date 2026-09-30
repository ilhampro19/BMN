import { useState, useEffect } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import ImportPegawaiModal from '../components/ImportPegawaiModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  FileSpreadsheet,
  Building2,
  UserCheck,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { UNIT_KERJA_OPTIONS } from '../lib/constants'
import { showAlert, showToast } from '../lib/alerts'

const PEGAWAI_API = `${API_BASE_URL}/pegawai`

const emptyForm = {
  nama: '',
  nip: '',
  jabatan: '',
  unit_kerja: 'Sekretariat Itjen',
  status: 'PNS',
  no_hp: '',
  email: '',
  keterangan: '',
}

export default function Pegawai() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isPimpinan = user?.role === 'pimpinan'
  const isStaf = user?.role === 'staf'

  const [pegawaiList, setPegawaiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterUnit, setFilterUnit] = useState('Semua Unit Kerja')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal Create / Edit
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal Import Excel
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    fetchPegawai()
  }, [])

  async function fetchPegawai() {
    try {
      setLoading(true)
      const res = await axios.get(PEGAWAI_API)
      setPegawaiList(res.data)
    } catch (err) {
      setError('Gagal memuat data pegawai.')
      showToast.error('Gagal Memuat Data', 'Tidak dapat mengambil daftar pegawai.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(pegawai) {
    setEditingId(pegawai.id)
    setForm({
      nama: pegawai.nama || '',
      nip: pegawai.nip || '',
      jabatan: pegawai.jabatan || '',
      unit_kerja: pegawai.unit_kerja || 'Sekretariat Itjen',
      status: pegawai.status || 'PNS',
      no_hp: pegawai.no_hp || '',
      email: pegawai.email || '',
      keterangan: pegawai.keterangan || '',
    })
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    if (!form.nama.trim()) {
      setFormError('Nama lengkap pegawai wajib diisi.')
      setSubmitting(false)
      return
    }

    const payload = {
      nama: form.nama.trim(),
      nip: form.nip.trim() || null,
      jabatan: form.jabatan.trim() || null,
      unit_kerja: form.unit_kerja || 'Sekretariat Itjen',
      status: form.status || 'PNS',
      no_hp: form.no_hp.trim() || null,
      email: form.email.trim() || null,
      keterangan: form.keterangan.trim() || null,
    }

    try {
      if (editingId) {
        await axios.put(`${PEGAWAI_API}/${editingId}`, payload)
        showToast.success('Data Pegawai Diperbarui', `${form.nama} telah diperbarui.`)
      } else {
        await axios.post(PEGAWAI_API, payload)
        showToast.success('Pegawai Ditambahkan', `${form.nama} telah dicatat dalam master data pegawai.`)
      }
      await fetchPegawai()
      setShowModal(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan data pegawai.'
      setFormError(msg)
      showToast.error('Gagal Menyimpan', msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, nama) {
    const confirmed = await showAlert.confirm({
      title: 'Hapus Data Pegawai?',
      text: `Apakah Anda yakin ingin menghapus "${nama}" dari daftar master pegawai?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDestructive: true,
    })
    if (!confirmed) return

    try {
      await axios.delete(`${PEGAWAI_API}/${id}`)
      await fetchPegawai()
      showToast.success('Pegawai Dihapus', `Data "${nama}" telah dihapus.`)
    } catch (err) {
      showAlert.error('Gagal Menghapus', err.response?.data?.message || 'Terjadi kesalahan saat menghapus pegawai.')
    }
  }

  // Export Data Pegawai ke Excel (.xlsx)
  function handleExportExcel() {
    const headers = [
      'No',
      'Nama Pegawai',
      'NIP',
      'Jabatan',
      'Unit Kerja',
      'Status Kepegawaian',
      'No HP / Telepon',
      'Email',
      'Keterangan',
    ]

    const rows = filteredPegawai.map((p, idx) => [
      idx + 1,
      p.nama || '',
      p.nip || '-',
      p.jabatan || '-',
      p.unit_kerja || 'Sekretariat Itjen',
      p.status || 'PNS',
      p.no_hp || '-',
      p.email || '-',
      p.keterangan || '-',
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai')
    XLSX.writeFile(wb, `Data_Pegawai_Itjen_Kemendagri_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast.success('Export Berhasil', 'File Excel data pegawai berhasil diunduh.')
  }

  // Filter Pegawai
  const filteredPegawai = pegawaiList.filter((p) => {
    if (filterUnit !== 'Semua Unit Kerja' && p.unit_kerja !== filterUnit) return false
    if (filterStatus !== 'Semua Status' && p.status !== filterStatus) return false

    const term = search.toLowerCase().trim()
    if (!term) return true

    const cleanNip = p.nip ? p.nip.replace(/\s+/g, '') : ''
    const cleanTerm = term.replace(/\s+/g, '')

    return (
      p.nama?.toLowerCase().includes(term) ||
      p.nip?.toLowerCase().includes(term) ||
      cleanNip.includes(cleanTerm) ||
      p.jabatan?.toLowerCase().includes(term) ||
      p.unit_kerja?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term)
    )
  })

  // Perhitungan Pagination (10 data per halaman)
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage) || 1
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedPegawai = filteredPegawai.slice(startIndex, startIndex + itemsPerPage)

  // KPI Metrics
  const totalPNS = pegawaiList.filter((p) => p.status === 'PNS').length
  const totalNonASN = pegawaiList.filter((p) => p.status !== 'PNS').length
  const totalUnit = new Set(pegawaiList.map((p) => p.unit_kerja).filter(Boolean)).size

  return (
    <Layout>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2.5">
            <Users className="text-navy" size={26} />
            Master Data Pegawai
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Daftar induk pejabat, auditor fungsional, dan staf penanggung jawab BMN Inspektorat Jenderal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Unduh seluruh data pegawai ke format Excel"
          >
            <Download size={14} /> Export Excel
          </button>

          {/* Tombol Import Excel */}
          {!isPimpinan && !isStaf && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 border border-navy/20 bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Unggah massal file Excel Data Pegawai"
            >
              <FileSpreadsheet size={14} /> Import Excel Pegawai
            </button>
          )}

          {/* Tombol Tambah Pegawai */}
          {!isPimpinan && !isStaf && (
            <Button
              onClick={openCreateModal}
              className="bg-navy hover:bg-navy-light text-white shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus size={15} /> Tambah Pegawai Baru
            </Button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 mb-1.5">
            <span className="text-xs font-semibold">Total Pegawai</span>
            <Users size={16} className="text-navy" />
          </div>
          <div className="text-2xl font-bold text-navy font-mono">{pegawaiList.length}</div>
          <p className="text-[11px] text-ink/40 mt-1">Terdaftar di sistem BMN</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 mb-1.5">
            <span className="text-xs font-semibold">PNS / ASN</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">{totalPNS}</div>
          <p className="text-[11px] text-ink/40 mt-1">Memiliki NIP resmi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 mb-1.5">
            <span className="text-xs font-semibold">PPPK / PTT / Non-ASN</span>
            <UserCheck size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">{totalNonASN}</div>
          <p className="text-[11px] text-ink/40 mt-1">Staf pendukung &amp; administrasi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 mb-1.5">
            <span className="text-xs font-semibold">Unit Kerja Aktif</span>
            <Building2 size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-800 font-mono">{totalUnit}</div>
          <p className="text-[11px] text-ink/40 mt-1">Sekretariat &amp; Inspektorat</p>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari nama pegawai, NIP, jabatan, atau unit kerja..."
            className="w-full bg-gray-50 border border-black/10 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:bg-white focus:border-navy"
          />
        </div>

        <div className="w-60">
          <SearchableSelect
            value={filterUnit}
            onChange={(val) => {
              setFilterUnit(val)
              setCurrentPage(1)
            }}
            options={UNIT_KERJA_OPTIONS.map((u) => ({
              value: u,
              label: u,
            }))}
            placeholder="Filter Unit Kerja..."
          />
        </div>

        <div className="w-48">
          <SearchableSelect
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val)
              setCurrentPage(1)
            }}
            options={[
              { value: 'Semua Status', label: 'Semua Status' },
              { value: 'PNS', label: '🟢 PNS / ASN' },
              { value: 'PPPK', label: '🔵 PPPK' },
              { value: 'PTT / Non-ASN', label: '🟡 PTT / Non-ASN' },
              { value: 'Driver / Pengemudi', label: '🚗 Driver / Pengemudi' },
            ]}
            placeholder="Filter Status..."
          />
        </div>
      </div>

      {/* TABLE DATA PEGAWAI */}
      {loading && <p className="text-xs text-ink/50">Memuat data pegawai...</p>}
      {error && <p className="text-xs text-rust">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-xs mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3 w-10 text-center">No</th>
                  <th className="px-4 py-3">Nama Pegawai &amp; Gelar</th>
                  <th className="px-4 py-3">NIP</th>
                  <th className="px-4 py-3">Jabatan / Penugasan</th>
                  <th className="px-4 py-3">Unit Kerja</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredPegawai.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-8 text-ink/40">
                      Tidak ada data pegawai yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  paginatedPegawai.map((p, index) => {
                    const isPns = p.status === 'PNS'
                    const isPppk = p.status === 'PPPK'
                    const rowNumber = startIndex + index + 1
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 text-center text-ink/40 font-mono">{rowNumber}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-ink text-sm flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold text-[11px] flex items-center justify-center shrink-0 uppercase">
                              {p.nama.charAt(0)}
                            </div>
                            <span>{p.nama}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          {p.nip ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold border border-slate-200">
                              {p.nip}
                            </span>
                          ) : (
                            <span className="text-ink/30 italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="text-ink/80 font-medium leading-relaxed">{p.jabatan || '—'}</div>
                          {p.keterangan && (
                            <div className="text-[10px] text-ink/40 mt-0.5">{p.keterangan}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-navy text-[11px] flex items-center gap-1">
                            <Building2 size={12} className="shrink-0 text-navy/70" />
                            <span>{p.unit_kerja || 'Sekretariat Itjen'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isPns
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isPppk
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.status || 'PNS'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-ink/70">
                          {p.no_hp && (
                            <div className="flex items-center gap-1 text-slate-700">
                              <Phone size={10} className="text-slate-400" />
                              <span>{p.no_hp}</span>
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                              <Mail size={10} className="text-slate-400" />
                              <span className="truncate max-w-[140px]">{p.email}</span>
                            </div>
                          )}
                          {!p.no_hp && !p.email && <span className="text-ink/30 italic">-</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          {!isPimpinan && !isStaf && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors cursor-pointer"
                              title="Edit Data Pegawai"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id, p.nama)}
                              className="p-1.5 rounded hover:bg-red-50 text-ink/50 hover:text-red-600 transition-colors cursor-pointer"
                              title="Hapus Pegawai"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {filteredPegawai.length > 0 && (
            <div className="px-4 py-3 bg-gray-50/70 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-ink/60 font-medium text-center sm:text-left">
                Menampilkan <strong className="text-ink">{startIndex + 1}</strong> - <strong className="text-ink">{Math.min(startIndex + itemsPerPage, filteredPegawai.length)}</strong> dari <strong className="text-ink">{filteredPegawai.length}</strong> pegawai
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - safeCurrentPage) <= 1
                        )
                      })
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1]
                        return (
                          <span key={page} className="flex items-center">
                            {prevPage && page - prevPage > 1 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                                safeCurrentPage === page
                                  ? 'bg-navy text-white shadow-2xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        )
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-medium cursor-pointer shadow-2xs"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PEGAWAI */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="px-6 py-4 bg-navy text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Users className="text-gold" size={20} />
                <h2 className="text-base font-bold text-white">
                  {editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nama Lengkap & Gelar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    Nama Lengkap &amp; Gelar <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <Input
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Contoh: Dr. Muhamad Nur, ME, CRGP"
                    required
                    className="text-xs h-9 border-slate-300 focus:border-navy"
                  />
                </div>

                {/* NIP & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      NIP (Nomor Induk Pegawai):
                    </label>
                    <Input
                      value={form.nip}
                      onChange={(e) => setForm({ ...form, nip: e.target.value })}
                      placeholder="19700305 199303 1 001"
                      className="font-mono text-xs h-9 border-slate-300 focus:border-navy"
                    />
                    <p className="text-[10px] text-slate-400">Kosongkan jika PTT / Non-ASN</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      Status Kepegawaian <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <SearchableSelect
                      value={form.status}
                      onChange={(val) => setForm({ ...form, status: val })}
                      options={[
                        { value: 'PNS', label: '🟢 PNS / ASN' },
                        { value: 'PPPK', label: '🔵 PPPK' },
                        { value: 'PTT / Non-ASN', label: '🟡 PTT / Non-ASN' },
                        { value: 'Driver / Pengemudi', label: '🚗 Driver / Pengemudi' },
                      ]}
                      placeholder="Pilih Status..."
                      required
                    />
                  </div>
                </div>

                {/* Unit Kerja */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    Unit Kerja / Inspektorat <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <SearchableSelect
                    value={form.unit_kerja}
                    onChange={(val) => setForm({ ...form, unit_kerja: val })}
                    options={UNIT_KERJA_OPTIONS.filter((u) => u !== 'Semua Unit Kerja').map((u) => ({
                      value: u,
                      label: u,
                    }))}
                    placeholder="Pilih Unit Kerja..."
                    required
                  />
                </div>

                {/* Jabatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    Jabatan / Posisi Penugasan:
                  </label>
                  <Input
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    placeholder="Contoh: Auditor Ahli Muda / Pengadministrasi Umum"
                    className="text-xs h-9 border-slate-300 focus:border-navy"
                  />
                </div>

                {/* Kontak: No HP & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      No. WhatsApp / HP:
                    </label>
                    <Input
                      value={form.no_hp}
                      onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                      placeholder="081234567890"
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      Email Kedinasan:
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="nama@kemendagri.go.id"
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Keterangan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    Keterangan Tambahan:
                  </label>
                  <Input
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Catatan penempatan / tugas khusus"
                    className="text-xs h-9 border-slate-300 focus:border-navy"
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-500">
                  <span className="text-red-500 font-bold">*</span> Wajib diisi
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="text-xs h-9"
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-navy hover:bg-navy-light text-white text-xs h-9 shadow-xs cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Pegawai' : 'Simpan Pegawai'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      <ImportPegawaiModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchPegawai}
      />
    </Layout>
  )
}
