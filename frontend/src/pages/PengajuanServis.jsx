import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  User,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Search,
  Filter,
  Check,
  ArrowRight,
  Info
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const SERVIS_API = `${API_BASE_URL}/pengajuan-servis`
const ITEM_API = `${API_BASE_URL}/item`

const emptyForm = {
  item_id: '',
  nama_barang_custom: '',
  is_custom_item: false,
  kategori_servis: 'perbaikan_ringan',
  nomor_nota_dinas: '',
  deskripsi_kerusakan: '',
  lokasi_barang: '',
  estimasi_biaya: '',
  tanggal_pengajuan: new Date().toISOString().split('T')[0],
}

function PengajuanServis() {
  const { user } = useAuth()
  const isStaf = user?.role === 'staf'
  const isOperator = user?.role === 'operator'
  const isPimpinan = user?.role === 'pimpinan'
  const isAdmin = user?.role === 'admin'

  const [servisList, setServisList] = useState([])
  const [itemList, setItemList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [servisRes, itemRes] = await Promise.all([
        axios.get(SERVIS_API),
        axios.get(ITEM_API),
      ])
      setServisList(servisRes.data)
      setItemList(itemRes.data)
    } catch (err) {
      console.error('Gagal memuat data pengajuan servis', err)
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setForm({
      ...emptyForm,
      lokasi_barang: user?.unit_kerja ? `Ruang ${user.unit_kerja}` : 'Ruang Kerja Lt. 2',
    })
    setErrorMsg('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    if (!form.is_custom_item && !form.item_id) {
      setErrorMsg('Pilih aset BMN yang ingin diservis atau centang opsi barang custom.')
      setSubmitting(false)
      return
    }

    if (form.is_custom_item && !form.nama_barang_custom.trim()) {
      setErrorMsg('Masukkan nama/keterangan barang yang diajukan.')
      setSubmitting(false)
      return
    }

    const payload = {
      item_id: form.is_custom_item ? null : Number(form.item_id),
      nama_barang_custom: form.is_custom_item ? form.nama_barang_custom : null,
      nama_pemohon: user?.name || 'Staf Pegawai',
      nip_pemohon: user?.nip || '199003152014031002',
      unit_kerja: user?.unit_kerja || 'Sekretariat Itjen',
      lokasi_barang: form.lokasi_barang,
      kategori_servis: form.kategori_servis,
      nomor_nota_dinas: form.nomor_nota_dinas || null,
      deskripsi_kerusakan: form.deskripsi_kerusakan,
      tanggal_pengajuan: form.tanggal_pengajuan,
      estimasi_biaya: form.estimasi_biaya ? Number(form.estimasi_biaya) : null,
    }

    try {
      await axios.post(SERVIS_API, payload)
      await fetchAll()
      setShowModal(false)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim usulan servis.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter List
  const filteredList = servisList.filter((item) => {
    // Staf hanya melihat usulan miliknya jika login staf (atau melihat semua dengan filter)
    const matchSearch =
      (item.item?.itemName || item.nama_barang_custom || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.nama_pemohon.toLowerCase().includes(search.toLowerCase()) ||
      (item.nomor_nota_dinas || '').toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi_kerusakan.toLowerCase().includes(search.toLowerCase())

    if (filterStatus === 'semua') return matchSearch
    return matchSearch && item.status === filterStatus
  })

  // Counters
  const countDiajukan = servisList.filter((s) => s.status === 'diajukan').length
  const countVerifOperator = servisList.filter((s) => s.status === 'diverifikasi_operator').length
  const countDisetujui = servisList.filter((s) => s.status === 'disetujui_pimpinan' || s.status === 'selesai').length
  const countDitolak = servisList.filter((s) => s.status.includes('ditolak')).length

  function formatRupiah(num) {
    if (!num) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'diajukan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} /> Menunggu Verifikasi Operator
          </span>
        )
      case 'diverifikasi_operator':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck size={12} /> Menunggu Persetujuan Pimpinan
          </span>
        )
      case 'disetujui_pimpinan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Disetujui Pimpinan (Dalam Perbaikan)
          </span>
        )
      case 'ditolak_operator':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} /> Ditolak Operator TU
          </span>
        )
      case 'ditolak_pimpinan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} /> Ditolak Pimpinan
          </span>
        )
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 size={12} /> Servis Selesai (Siap Digunakan)
          </span>
        )
      default:
        return <span className="text-xs text-ink/60">{status}</span>
    }
  }

  function getCategoryLabel(cat) {
    const map = {
      perbaikan_ringan: 'Perbaikan Ringan',
      ganti_sparepart: 'Penggantian Suku Cadang',
      servis_rutin: 'Servis / Maintenance Berkala',
      kerusakan_berat: 'Kerusakan Berat / Total',
      lainnya: 'Lainnya',
    }
    return map[cat] || cat
  }

  return (
    <Layout>
      {/* BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-ink/40 mb-1">
            Pelayanan Pegawai <span className="mx-1">›</span>
            <span className="text-navy font-medium">Pengajuan Servis BMN</span>
          </p>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Wrench className="text-navy" size={26} />
            Pengajuan Servis & Pemeliharaan Aset
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Layanan pengusulan perbaikan barang inventaris oleh Staf dengan verifikasi Operator TU dan persetujuan Pimpinan
          </p>
        </div>

        <Button
          onClick={openModal}
          className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus size={16} /> Ajukan Servis Barang Baru
        </Button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink/50">Total Pengajuan</span>
            <span className="w-7 h-7 rounded-lg bg-navy/5 text-navy flex items-center justify-center font-bold text-xs">
              <FileText size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold text-ink mt-2">{servisList.length}</p>
          <p className="text-[11px] text-ink/40 mt-0.5">Semua usulan servis tercatat</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Verifikasi Operator</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-2">{countDiajukan}</p>
          <p className="text-[11px] text-amber-600/70 mt-0.5">Tahap 1: Menunggu Operator TU</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Approval Pimpinan</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <ShieldCheck size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">{countVerifOperator}</p>
          <p className="text-[11px] text-blue-600/70 mt-0.5">Tahap 2: Menunggu Inspektur Jenderal</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Disetujui / Selesai</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-2">{countDisetujui}</p>
          <p className="text-[11px] text-emerald-600/70 mt-0.5">Usulan disetujui / tuntas diservis</p>
        </div>
      </div>

      {/* WORKFLOW BANNER */}
      <div className="bg-white rounded-xl border border-gold/30 p-4 shadow-sm mb-6 bg-gradient-to-r from-amber-50/40 via-white to-blue-50/30">
        <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-3 flex items-center gap-1.5">
          <Info size={14} className="text-gold" /> Alur Persetujuan Servis BMN (Multi-Tier Workflow)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-white/80 border border-black/5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Pengajuan oleh Staf</p>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Staf pegawai mengisi keluhan kerusakan aset BMN atau perangkat kerja.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/80 border border-black/5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Verifikasi Operator TU</p>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Operator memeriksa kondisi fisik, menaksir estimasi biaya, dan meneruskan ke pimpinan.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/80 border border-black/5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Persetujuan Pimpinan</p>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Pimpinan Itjen memberikan otorisasi perbaikan agar barang segera diproses servis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <Input
              type="text"
              placeholder="Cari pemohon, barang, keluhan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter size={14} className="text-ink/40 shrink-0" />
            <button
              onClick={() => setFilterStatus('semua')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'semua' ? 'bg-navy text-white' : 'bg-gray-100 text-ink/60 hover:bg-gray-200'
              }`}
            >
              Semua ({servisList.length})
            </button>
            <button
              onClick={() => setFilterStatus('diajukan')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'diajukan' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-ink/60 hover:bg-gray-200'
              }`}
            >
              Verif Operator ({countDiajukan})
            </button>
            <button
              onClick={() => setFilterStatus('diverifikasi_operator')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'diverifikasi_operator' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-ink/60 hover:bg-gray-200'
              }`}
            >
              Approval Pimpinan ({countVerifOperator})
            </button>
            <button
              onClick={() => setFilterStatus('disetujui_pimpinan')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'disetujui_pimpinan' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-ink/60 hover:bg-gray-200'
              }`}
            >
              Disetujui ({servisList.filter(s => s.status === 'disetujui_pimpinan').length})
            </button>
          </div>
        </div>

        {/* LIST PENGAJUAN */}
        <div className="divide-y divide-black/5">
          {loading ? (
            <div className="p-8 text-center text-xs text-ink/40">Memuat data pengajuan servis...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center text-xs text-ink/40">
              Tidak ada pengajuan servis yang cocok dengan kriteria filter.
            </div>
          ) : (
            filteredList.map((item) => {
              const namaBarang = item.item?.itemName || item.nama_barang_custom || 'Barang Inventaris'
              const kodeBarang = item.item?.itemCode ? `${item.item.itemCode} • NUP: ${item.item.nup || '0001'}` : 'Non-Katalog BMN'

              return (
                <div
                  key={item.id || item._id}
                  className="p-5 hover:bg-gray-50/60 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">{namaBarang}</span>
                      <span className="text-[11px] font-mono text-navy font-semibold px-2 py-0.5 rounded bg-navy/5">
                        {kodeBarang}
                      </span>
                      {item.nomor_nota_dinas && (
                        <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <FileText size={11} className="text-amber-600" /> ND: {item.nomor_nota_dinas}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-ink/60 font-medium">
                        {getCategoryLabel(item.kategori_servis)}
                      </span>
                    </div>

                    <div className="text-xs text-ink/70 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 font-medium">
                        <User size={13} className="text-ink/40" /> {item.nama_pemohon} ({item.unit_kerja})
                      </span>
                      <span className="flex items-center gap-1 text-ink/60">
                        <MapPin size={13} className="text-ink/40" /> {item.lokasi_barang || 'Lokasi Kerja'}
                      </span>
                      <span className="flex items-center gap-1 text-ink/60 font-mono-ledger">
                        <Calendar size={13} className="text-ink/40" /> {item.tanggal_pengajuan}
                      </span>
                      {item.estimasi_biaya && (
                        <span className="text-emerald-700 font-semibold">
                          Est: {formatRupiah(item.estimasi_biaya)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink/60 italic bg-paper/60 p-2 rounded border border-black/5 mt-1">
                      "{item.deskripsi_kerusakan}"
                    </p>

                    {/* STATUS TRACKER BAR */}
                    <div className="pt-2 flex items-center gap-2 text-[11px]">
                      {getStatusBadge(item.status)}
                      {item.catatan_operator && (
                        <span className="text-ink/50 text-[10px] truncate max-w-xs">
                          • Catatan Operator: {item.catatan_operator}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDetail(item)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Info size={13} /> Detail Usulan
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MODAL FORM PENGAJUAN SERVIS BARU (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Formulir Usulan Servis Aset BMN</h3>
                  <p className="text-[11px] text-slate-500">Pencatatan kerusakan inventaris untuk verifikasi Operator TU & Pimpinan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY (HORIZONTAL FORM) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} /> <span>{errorMsg}</span>
                  </div>
                )}

                {/* Pemohon & Unit Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Data Pemohon:
                  </label>
                  <div className="sm:col-span-8 flex items-center gap-2 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold">{user?.name || 'Budi Santoso, S.Sos'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{user?.unit_kerja || 'Sekretariat Itjen'}</span>
                  </div>
                </div>

                {/* Pilihan Barang */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start pt-1">
                  <div className="sm:col-span-4 sm:text-right pt-2">
                    <label className="text-xs font-medium text-slate-700 block">
                      Aset BMN yang Rusak <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <label className="text-[10px] text-navy cursor-pointer inline-flex items-center gap-1 font-medium mt-1">
                      <input
                        type="checkbox"
                        checked={form.is_custom_item}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            is_custom_item: e.target.checked,
                            item_id: '',
                          })
                        }
                        className="rounded text-navy focus:ring-navy"
                      />
                      Item Non-Katalog
                    </label>
                  </div>
                  <div className="sm:col-span-8">
                    {!form.is_custom_item ? (
                      <SearchableSelect
                        value={form.item_id}
                        onChange={(val) => setForm({ ...form, item_id: val })}
                        options={itemList.map((i) => ({
                          value: i.id || i._id,
                          label: `${i.itemName} (${i.itemCode}) - ${i.lokasi_ruangan || i.unit_kerja || 'Tanpa Lokasi'}`,
                        }))}
                        placeholder="Ketik / pilih barang dari Master BMN..."
                        required
                      />
                    ) : (
                      <Input
                        type="text"
                        placeholder="Ketik nama / merk / spesifikasi barang..."
                        value={form.nama_barang_custom}
                        onChange={(e) => setForm({ ...form, nama_barang_custom: e.target.value })}
                        required
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    )}
                  </div>
                </div>

                {/* Kategori Perbaikan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Kategori Perbaikan <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <SearchableSelect
                      value={form.kategori_servis}
                      onChange={(val) => setForm({ ...form, kategori_servis: val })}
                      options={[
                        { value: 'perbaikan_ringan', label: 'Perbaikan Ringan' },
                        { value: 'ganti_sparepart', label: 'Penggantian Sparepart' },
                        { value: 'servis_rutin', label: 'Servis Berkala / Rutin' },
                        { value: 'kerusakan_berat', label: 'Kerusakan Berat' },
                        { value: 'lainnya', label: 'Lainnya' },
                      ]}
                      placeholder="Pilih kategori perbaikan..."
                      required
                    />
                  </div>
                </div>

                {/* Nomor Nota Dinas */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Nomor Nota Dinas:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      type="text"
                      placeholder="Contoh: 700.1.2/3/Insp.III (sesuai surat fisik)"
                      value={form.nomor_nota_dinas}
                      onChange={(e) => setForm({ ...form, nomor_nota_dinas: e.target.value })}
                      className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Nomor surat permohonan dinas resmi dari unit pemohon (bila ada).
                    </p>
                  </div>
                </div>

                {/* Lokasi Fisik */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Lokasi Fisik Barang <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      type="text"
                      placeholder="Contoh: Ruang Subbag Umum Lt. 2"
                      value={form.lokasi_barang}
                      onChange={(e) => setForm({ ...form, lokasi_barang: e.target.value })}
                      required
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Deskripsi Kerusakan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Deskripsi Kerusakan <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <textarea
                      rows={3}
                      placeholder="Jelaskan secara rinci gejala kerusakan atau kendala barang..."
                      value={form.deskripsi_kerusakan}
                      onChange={(e) => setForm({ ...form, deskripsi_kerusakan: e.target.value })}
                      required
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                    />
                  </div>
                </div>

                {/* Estimasi Biaya Awal */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Estimasi Biaya Awal (Rp):
                  </label>
                  <div className="sm:col-span-8">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                      <Input
                        type="number"
                        placeholder="Contoh: 1500000 (boleh dikosongkan)"
                        value={form.estimasi_biaya}
                        onChange={(e) => setForm({ ...form, estimasi_biaya: e.target.value })}
                        className="text-xs h-9 pl-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Boleh dikosongkan jika belum tahu, Operator TU akan mengestimasi saat verifikasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? 'Mengirimkan...' : 'Kirim Usulan Servis'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL USULAN */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-4">
              <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                <FileText size={16} className="text-navy" /> Rincian Usulan Servis #{selectedDetail.id || selectedDetail._id}
              </h3>
              <button onClick={() => setSelectedDetail(null)} className="text-ink/40 hover:text-ink text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-ink/40 text-[10px] block">Aset / Barang:</span>
                <strong className="text-sm text-navy">
                  {selectedDetail.item?.itemName || selectedDetail.nama_barang_custom || 'Barang Inventaris'}
                </strong>
                {selectedDetail.item?.itemCode && (
                  <p className="text-[11px] font-mono text-ink/60">
                    Kode: {selectedDetail.item.itemCode} (NUP: {selectedDetail.item.nup || '0001'})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-paper p-3 rounded-lg border border-black/5">
                <div>
                  <span className="text-ink/40 text-[10px] block">Pemohon:</span>
                  <span className="font-semibold text-ink">{selectedDetail.nama_pemohon}</span>
                  <p className="text-[10px] text-ink/50">{selectedDetail.unit_kerja}</p>
                </div>
                <div>
                  <span className="text-ink/40 text-[10px] block">Tanggal Diajukan:</span>
                  <span className="font-mono text-ink">{selectedDetail.tanggal_pengajuan}</span>
                </div>
              </div>

              {selectedDetail.nomor_nota_dinas && (
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs">
                  <span className="text-[10px] text-amber-700 font-bold block">Nomor Nota Dinas:</span>
                  <span className="font-mono font-semibold text-amber-900">{selectedDetail.nomor_nota_dinas}</span>
                </div>
              )}

              <div>
                <span className="text-ink/40 text-[10px] block">Kategori & Lokasi:</span>
                <span className="font-medium text-ink">
                  {getCategoryLabel(selectedDetail.kategori_servis)} • {selectedDetail.lokasi_barang}
                </span>
              </div>

              <div>
                <span className="text-ink/40 text-[10px] block">Keluhan Kerusakan:</span>
                <p className="p-2.5 bg-gray-50 rounded border text-ink/70">{selectedDetail.deskripsi_kerusakan}</p>
              </div>

              {selectedDetail.catatan_operator && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900">
                  <span className="font-bold block text-[11px]">Catatan Verifikasi Operator TU:</span>
                  <p className="text-xs mt-0.5">{selectedDetail.catatan_operator}</p>
                  <span className="text-[10px] text-blue-700/60 block mt-1">
                    Oleh: {selectedDetail.verified_by_operator || 'Operator TU'}
                  </span>
                </div>
              )}

              {selectedDetail.catatan_pimpinan && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                  <span className="font-bold block text-[11px]">Arahan / Keputusan Pimpinan:</span>
                  <p className="text-xs mt-0.5">{selectedDetail.catatan_pimpinan}</p>
                  <span className="text-[10px] text-emerald-700/60 block mt-1">
                    Oleh: {selectedDetail.approved_by_pimpinan || 'Inspektur Jenderal'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-black/10 flex justify-end">
              <Button size="sm" onClick={() => setSelectedDetail(null)} className="bg-navy hover:bg-navy-light text-xs">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default PengajuanServis
