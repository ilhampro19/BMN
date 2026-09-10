import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import QRCodeModal from '../components/QRCodeModal'
import QRScannerModal from '../components/QRScannerModal'
import ImportExcelModal from '../components/ImportExcelModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Plus, Pencil, Trash2, Search, MapPin, QrCode as QrIcon, Building2, UserCheck, Laptop, Clock, Camera, FileSpreadsheet, Download, Wrench, X, CheckCircle2, AlertCircle, PackagePlus } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UNIT_KERJA_OPTIONS, RUANGAN_GEDUNG_ITJEN } from '../lib/constants'

const ITEM_API = `${API_BASE_URL}/item`
const KATEGORI_API = `${API_BASE_URL}/kategori-item`

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage', bar: 'bg-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre', bar: 'bg-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust', bar: 'bg-rust' },
}

const emptyForm = {
  kategoriItem: '',
  itemCode: '',
  nup: '0001',
  kode_bmn: '3.05.01.04.001',
  itemName: '',
  merk_tipe: '',
  nomor_seri: '',
  tahunPerolehan: new Date().getFullYear(),
  nilaiPerolehan: '',
  kondisi: 'baik',
  status_penggunaan: 'digunakan',
  unit_kerja: 'Sekretariat Itjen',
  lokasi_ruangan: RUANGAN_GEDUNG_ITJEN[0],
  penanggung_jawab: '',
}

function Barang() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const navigate = useNavigate()
  const [itemList, setItemList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterUnit, setFilterUnit] = useState(isOperator && user?.unit_kerja ? user.unit_kerja : 'Semua Unit Kerja')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal QR Code Label & Scanner
  const [selectedQrItem, setSelectedQrItem] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  // Modal Import Excel SAKTI
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [itemRes, kategoriRes] = await Promise.all([
        axios.get(ITEM_API),
        axios.get(KATEGORI_API),
      ])
      setItemList(itemRes.data)
      setKategoriList(kategoriRes.data)
    } catch (err) {
      setError('Gagal memuat data barang')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      unit_kerja: user?.unit_kerja || 'Sekretariat Itjen',
      lokasi_ruangan: RUANGAN_GEDUNG_ITJEN[0],
    })
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(item) {
    setEditingId(item._id || item.id)
    setForm({
      kategoriItem: item.kategoriItem?._id || item.kategori_item_id || '',
      itemCode: item.itemCode,
      nup: item.nup || '0001',
      kode_bmn: item.kode_bmn || '3.05.01.04.001',
      itemName: item.itemName,
      merk_tipe: item.merk_tipe || '',
      nomor_seri: item.nomor_seri || '',
      tahunPerolehan: item.tahunPerolehan,
      nilaiPerolehan: item.nilaiPerolehan,
      kondisi: item.kondisi,
      status_penggunaan: item.status_penggunaan || 'digunakan',
      unit_kerja: item.unit_kerja || 'Sekretariat Itjen',
      lokasi_ruangan: item.lokasi_ruangan || RUANGAN_GEDUNG_ITJEN[0],
      penanggung_jawab: item.penanggung_jawab || '',
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

    const payload = {
      kategoriItem: form.kategoriItem,
      itemCode: form.itemCode,
      nup: form.nup,
      kode_bmn: form.kode_bmn,
      itemName: form.itemName,
      merk_tipe: form.merk_tipe,
      nomor_seri: form.nomor_seri,
      tahunPerolehan: Number(form.tahunPerolehan),
      nilaiPerolehan: Number(form.nilaiPerolehan),
      kondisi: form.kondisi,
      status_penggunaan: form.status_penggunaan,
      unit_kerja: form.unit_kerja,
      lokasi_ruangan: form.lokasi_ruangan,
      penanggung_jawab: form.penanggung_jawab,
    }

    try {
      if (editingId) {
        await axios.put(`${ITEM_API}/${editingId}`, payload)
      } else {
        await axios.post(ITEM_API, payload)
      }
      await fetchAll()
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, nama) {
    const confirmed = window.confirm(`Hapus barang "${nama}"? Tindakan ini tidak bisa dibatalkan.`)
    if (!confirmed) return

    try {
      await axios.delete(`${ITEM_API}/${id}`)
      await fetchAll()
    } catch (err) {
      alert('Gagal menghapus barang')
    }
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)
  }

  function hitungPersenUmur(item) {
    const umurEkonomis = item.kategoriItem?.umurEkonomisTahun
    if (!umurEkonomis) return 0
    const tahunSekarang = new Date().getFullYear()
    const umurAset = Math.max(0, tahunSekarang - item.tahunPerolehan)
    return Math.min(Math.round((umurAset / umurEkonomis) * 100), 100)
  }

  // Export Data ke Format CSV / Excel
  function handleExportExcel() {
    const headers = [
      'Kode Barang',
      'NUP',
      'Kode Akun SAKTI',
      'Nama Barang',
      'Merk/Tipe',
      'Nomor Seri (SN)',
      'Tahun Perolehan',
      'Nilai Perolehan (Rp)',
      'Kondisi',
      'Status Penggunaan',
      'Unit Kerja',
      'Lokasi Ruangan',
      'Penanggung Jawab',
    ]

    const rows = filteredItems.map((item) => [
      `"${item.itemCode || ''}"`,
      `"${item.nup || '0001'}"`,
      `"${item.kode_bmn || '3.05.01.04.001'}"`,
      `"${(item.itemName || '').replace(/"/g, '""')}"`,
      `"${(item.merk_tipe || '').replace(/"/g, '""')}"`,
      `"${(item.nomor_seri || '').replace(/"/g, '""')}"`,
      item.tahunPerolehan || '',
      item.nilaiPerolehan || 0,
      `"${item.kondisi || 'baik'}"`,
      `"${item.status_penggunaan || 'digunakan'}"`,
      `"${item.unit_kerja || 'Sekretariat Itjen'}"`,
      `"${(item.lokasi_ruangan || '').replace(/"/g, '""')}"`,
      `"${(item.penanggung_jawab || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Aset_BMN_Itjen_Kemendagri_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleScanFound(detectedCode) {
    setSearch(detectedCode)
    setShowScanner(false)
  }

  // Filter Items
  const filteredItems = itemList.filter((item) => {
    // Filter Unit Kerja
    if (filterUnit !== 'Semua Unit Kerja' && item.unit_kerja !== filterUnit) {
      return false
    }

    // Filter Pencarian
    const term = search.toLowerCase().trim()
    const cleanTerm = term.replace(/\./g, '')
    const rawKode = item.kode_bmn ? item.kode_bmn.replace(/\./g, '').toLowerCase() : ''
    const rawNup = item.nup ? String(item.nup).replace(/^0+/, '') : ''
    const termNup = term.replace(/^0+/, '')

    return (
      item.itemName?.toLowerCase().includes(term) ||
      item.itemCode?.toLowerCase().includes(term) ||
      item.nup?.toLowerCase().includes(term) ||
      (termNup && rawNup === termNup) ||
      item.kode_bmn?.toLowerCase().includes(term) ||
      (cleanTerm && rawKode.includes(cleanTerm)) ||
      item.merk_tipe?.toLowerCase().includes(term) ||
      item.nomor_seri?.toLowerCase().includes(term) ||
      item.lokasi_ruangan?.toLowerCase().includes(term) ||
      item.penanggung_jawab?.toLowerCase().includes(term)
    )
  })

  const totalBaik = filteredItems.filter((i) => i.kondisi === 'baik').length
  const totalEvaluasi = filteredItems.filter((i) => i.kondisi === 'evaluasi').length
  const totalPerhatian = filteredItems.filter((i) => i.kondisi === 'perhatian').length

  return (
    <Layout>
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Building2 className="text-navy" size={26} />
            {isStaf ? 'Daftar Aset BMN Itjen' : isPimpinan ? 'Daftar Aset BMN Itjen Kemendagri' : 'Master Barang Milik Negara'}
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Pengelolaan aset BMN resmi Itjen Kemendagri sesuai standar kodefikasi SAKTI Kemenkeu
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Tombol Ajukan Servis Cepat untuk Staf */}
          {isStaf && (
            <button
              onClick={() => navigate('/pengajuan-servis')}
              className="flex items-center gap-1.5 bg-navy hover:bg-navy-light text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Wrench size={14} /> Ajukan Servis BMN
            </button>
          )}

          {/* Tombol Scanner Kamera */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-ink text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            title="Scan QR Code fisik menggunakan kamera"
          >
            <Camera size={14} className="text-navy" /> Scan QR Kamera
          </button>

          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            title="Unduh seluruh data BMN ke file Excel / CSV"
          >
            <Download size={14} /> Export Excel
          </button>

          {/* Tombol Import Excel Massal */}
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 border border-navy/20 bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Unggah massal data SAKTI Kemenkeu"
            >
              <FileSpreadsheet size={14} /> Import SAKTI
            </button>
          )}

          {!isPimpinan && !isStaf && (
            <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light text-white shadow-sm flex items-center gap-1.5 text-xs">
              <Plus size={15} /> Tambah BMN Baru
            </Button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, NUP, nama barang, merk, nomor seri..."
            className="w-full bg-gray-50 border border-black/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:bg-white focus:border-navy"
          />
        </div>

        <div className="w-64">
          <SearchableSelect
            value={filterUnit}
            onChange={(val) => setFilterUnit(val)}
            options={UNIT_KERJA_OPTIONS.map((u) => ({
              value: u,
              label: u,
            }))}
            placeholder="Filter Unit Kerja..."
          />
        </div>
      </div>

      {loading && <p className="text-sm text-ink/50">Memuat data inventaris BMN...</p>}
      {error && <p className="text-sm text-rust">{error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Kode BMN & NUP</th>
                    <th className="px-4 py-3">Nama Barang & Merk/Tipe</th>
                    <th className="px-4 py-3">Unit Kerja & Lokasi</th>
                    <th className="px-4 py-3">Penanggung Jawab</th>
                    <th className="px-4 py-3 w-16 text-center">Tahun</th>
                    <th className="px-4 py-3">Kondisi</th>
                    <th className="px-4 py-3">Status Penggunaan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center p-8 text-ink/40">
                        Tidak ada barang ditemukan sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const meta = statusMeta[item.kondisi] || statusMeta.baik
                      return (
                        <tr key={item._id || item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3.5 text-center text-ink/40 font-mono">{index + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-navy text-xs">{item.itemCode}</div>
                            <div className="text-[10px] text-ink/50 font-mono">
                              NUP: <span className="font-bold text-ink">{item.nup || '0001'}</span>
                            </div>
                            {item.kode_bmn && (
                              <div className="text-[9px] text-ink/40 font-mono">SAKTI: {item.kode_bmn}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-ink text-sm">{item.itemName}</div>
                            {item.merk_tipe && (
                              <div className="text-xs text-ink/70 mt-0.5">{item.merk_tipe}</div>
                            )}
                            {item.nomor_seri && (
                              <div className="text-[10px] text-ink/50 font-mono">SN: {item.nomor_seri}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-navy text-[11px]">{item.unit_kerja || 'Sekretariat Itjen'}</div>
                            <div className="flex items-center gap-1 text-[11px] text-ink/60 mt-0.5">
                              <MapPin size={11} className="text-ink/40 shrink-0" />
                              <span>{item.lokasi_ruangan || 'Belum Ditentukan'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-xs text-ink/80 font-medium">{item.penanggung_jawab || '—'}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-ink/70">{item.tahunPerolehan}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${meta.badge}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {item.status_penggunaan === 'dipinjam_wasrik' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={11} /> Dipinjam Wasrik
                              </span>
                            ) : item.status_penggunaan === 'dalam_pemeliharaan' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <Wrench size={11} /> Sedang Servis/Renovasi
                              </span>
                            ) : item.status_penggunaan === 'rusak_berat' ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                Usul Hapus
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Digunakan
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                            {/* Tombol Cetak Label QR Code */}
                            <button
                              onClick={() => setSelectedQrItem(item)}
                              className="p-1.5 rounded hover:bg-navy/10 text-navy transition-colors"
                              title="Cetak Label QR Code Stiker BMN"
                            >
                              <QrIcon size={15} />
                            </button>

                            {/* Tombol Ajukan Servis untuk Staf */}
                            {isStaf && (
                              <button
                                onClick={() => navigate('/pengajuan-servis')}
                                className="p-1.5 rounded hover:bg-amber-50 text-ink/50 hover:text-amber-700 transition-colors"
                                title="Ajukan Servis / Perbaikan Barang Ini"
                              >
                                <Wrench size={15} />
                              </button>
                            )}

                            {/* Tombol Mutasi */}
                            {!isStaf && (
                              <button
                                onClick={() => navigate('/pelacakan')}
                                className="p-1.5 rounded hover:bg-blue-50 text-ink/50 hover:text-navy transition-colors"
                                title="Lacak & Mutasi Lokasi"
                              >
                                <MapPin size={15} />
                              </button>
                            )}

                            {/* Tombol Edit */}
                            {!isPimpinan && !isStaf && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors"
                                title="Edit Data BMN"
                              >
                                <Pencil size={15} />
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item._id || item.id, item.itemName)}
                                className="p-1.5 rounded hover:bg-red-50 text-ink/50 hover:text-red-600 transition-colors"
                                title="Hapus Barang"
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
            <div className="px-5 py-3 text-xs text-ink/40 border-t border-black/5 bg-gray-50/50 flex justify-between items-center">
              <span>Menampilkan {filteredItems.length} dari {itemList.length} aset BMN terdaftar</span>
              <span className="font-mono">Satker: Inspektorat Jenderal Kemendagri</span>
            </div>
          </div>

          {/* STATUS SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-sage-bg flex items-center justify-center shrink-0 text-sage font-bold">
                ✓
              </div>
              <div>
                <div className="text-xs text-ink/50">Aset Kondisi Baik</div>
                <div className="text-lg font-bold text-ink">{totalBaik}</div>
              </div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-ochre-bg flex items-center justify-center shrink-0 text-ochre font-bold">
                !
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Evaluasi</div>
                <div className="text-lg font-bold text-ink">{totalEvaluasi}</div>
              </div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rust-bg flex items-center justify-center shrink-0 text-rust font-bold">
                ✕
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Perhatian / Rusak</div>
                <div className="text-lg font-bold text-ink">{totalPerhatian}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM TAMBAH / EDIT BARANG (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto transform transition-all">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <PackagePlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">
                    {editingId ? 'Edit Data Barang Milik Negara' : 'Pendaftaran Aset BMN Baru'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Inspektorat Jenderal Kementerian Dalam Negeri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY (HORIZONTAL FORM: LABEL KIRI, KOSONGAN/INPUT KANAN) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl shadow-xs">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* BAGIAN 1: IDENTITAS & SPESIFIKASI */}
                <div>
                  <div className="pb-2 mb-4 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Identitas & Spesifikasi Barang
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Kodefikasi Internal */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Kodefikasi Internal <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.itemCode}
                          onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                          placeholder="BMN-ITJ-2024-LTP01"
                          required
                          className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* NUP */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        NUP (No Urut Pendaftaran) <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.nup}
                          onChange={(e) => setForm({ ...form, nup: e.target.value })}
                          placeholder="0001"
                          required
                          className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* Kode Akun SAKTI */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Kode Akun SAKTI:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.kode_bmn}
                          onChange={(e) => setForm({ ...form, kode_bmn: e.target.value })}
                          placeholder="3.05.01.04.001"
                          className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* Nama Barang */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Nama Barang / Jenis Aset <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.itemName}
                          onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                          placeholder="Contoh: Laptop Auditor Lenovo ThinkPad T14s"
                          required
                          className="bg-white text-xs h-9 border-slate-300 focus:border-navy font-medium"
                        />
                      </div>
                    </div>

                    {/* Merk / Tipe */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Merk / Spesifikasi Tipe:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.merk_tipe}
                          onChange={(e) => setForm({ ...form, merk_tipe: e.target.value })}
                          placeholder="Contoh: ThinkPad T14s Gen 3 Core i7-1260P"
                          className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* Nomor Seri */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Nomor Seri (Serial Number - SN):
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.nomor_seri}
                          onChange={(e) => setForm({ ...form, nomor_seri: e.target.value })}
                          placeholder="Contoh: PF48291X / MHFFN..."
                          className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* Kategori BMN */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Kategori BMN <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <SearchableSelect
                          value={form.kategoriItem}
                          onChange={(val) => setForm({ ...form, kategoriItem: val })}
                          options={kategoriList.map((k) => ({
                            value: k._id || k.id,
                            label: k.kategoriItemName,
                          }))}
                          placeholder="Pilih kategori BMN..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 2: PENEMPATAN, NILAI & STATUS */}
                <div>
                  <div className="pb-2 mb-4 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Lokasi Penempatan, Nilai & Kondisi Aset
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Tahun Perolehan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Tahun Perolehan <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          type="number"
                          min="1990"
                          max="2099"
                          value={form.tahunPerolehan}
                          onChange={(e) => setForm({ ...form, tahunPerolehan: e.target.value })}
                          required
                          className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>

                    {/* Nilai Perolehan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Nilai Perolehan (Rp) <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={form.nilaiPerolehan}
                            onChange={(e) => setForm({ ...form, nilaiPerolehan: e.target.value })}
                            required
                            className="bg-white text-xs h-9 pl-9 border-slate-300 focus:border-navy font-mono"
                          />
                        </div>
                        {Number(form.nilaiPerolehan) > 0 && (
                          <p className="text-[11px] text-emerald-700 font-semibold font-mono mt-1">
                            Format: {formatRupiah(form.nilaiPerolehan)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unit Kerja */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Unit Kerja Itjen <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
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
                    </div>

                    {/* Pilihan Ruangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Pilihan Ruangan Gedung <span className="text-red-500 font-bold">*</span>:
                      </label>
                      <div className="sm:col-span-8">
                        <SearchableSelect
                          value={form.lokasi_ruangan}
                          onChange={(val) => setForm({ ...form, lokasi_ruangan: val })}
                          options={RUANGAN_GEDUNG_ITJEN.map((r) => ({
                            value: r,
                            label: r,
                          }))}
                          placeholder="Pilih Ruangan..."
                          required
                        />
                      </div>
                    </div>

                    {/* Kondisi Fisik */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Kondisi Fisik:
                      </label>
                      <div className="sm:col-span-8">
                        <SearchableSelect
                          value={form.kondisi}
                          onChange={(val) => setForm({ ...form, kondisi: val })}
                          options={[
                            { value: 'baik', label: '🟢 Baik (Siap Operasional)' },
                            { value: 'evaluasi', label: '🟡 Evaluasi (Perlu Servis)' },
                            { value: 'perhatian', label: '🔴 Perhatian (Kritis)' },
                          ]}
                          placeholder="Pilih Kondisi..."
                        />
                      </div>
                    </div>

                    {/* Status Penggunaan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Status Penggunaan:
                      </label>
                      <div className="sm:col-span-8">
                        <SearchableSelect
                          value={form.status_penggunaan}
                          onChange={(val) => setForm({ ...form, status_penggunaan: val })}
                          options={[
                            { value: 'digunakan', label: 'Digunakan' },
                            { value: 'dalam_pemeliharaan', label: 'Dalam Pemeliharaan / Servis' },
                            { value: 'dipinjam_wasrik', label: 'Dipinjam Wasrik' },
                            { value: 'rusak_berat', label: 'Rusak Berat (Usul Hapus)' },
                          ]}
                          placeholder="Pilih Status Penggunaan..."
                        />
                      </div>
                    </div>

                    {/* Penanggung Jawab */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                        Penanggung Jawab (PJ):
                      </label>
                      <div className="sm:col-span-8">
                        <Input
                          value={form.penanggung_jawab}
                          onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
                          placeholder="Contoh: Rahmat Hidayat, S.E."
                          className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Kolom bertanda bintang wajib diisi</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-6 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-all"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>{editingId ? 'Simpan Perubahan' : 'Simpan Aset'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE LABEL PRINT */}
      {selectedQrItem && (
        <QRCodeModal item={selectedQrItem} onClose={() => setSelectedQrItem(null)} />
      )}

      {/* MODAL SCANNER KAMERA QR CODE */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanFound}
      />

      {/* MODAL IMPORT EXCEL / SAKTI */}
      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchAll}
      />
    </Layout>
  )
}

export default Barang