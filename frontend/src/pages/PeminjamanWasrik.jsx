import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Plus, Printer, CheckCircle2, Clock, X, Search, Shield, ArrowRight, Laptop, Calendar, UserCheck, XCircle, AlertCircle, Download } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

const WASRIK_API = `${API_BASE_URL}/peminjaman-wasrik`
const ITEM_API = `${API_BASE_URL}/item`

const emptyForm = {
  item_id: '',
  nama_peminjam: '',
  nip_peminjam: '',
  jabatan_tim: 'Anggota Tim Wasrik',
  no_surat_tugas: '',
  tujuan_wilayah: '',
  tanggal_berangkat: new Date().toISOString().split('T')[0],
  tanggal_kembali: '',
  keterangan: '',
}

function PeminjamanWasrik() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isAuditor = user?.role === 'auditor'

  const [loans, setLoans] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal Cetak Dokumen SIPB / BAST Pinjam Pakai
  const [printDoc, setPrintDoc] = useState(null)
  // Modal Cetak BAST Pengembalian Barang
  const [printReturnDoc, setPrintReturnDoc] = useState(null)

  // Modal Pengembalian
  const [returnItem, setReturnItem] = useState(null)
  const [kondisiKembali, setKondisiKembali] = useState('baik')
  const [catatanKembali, setCatatanKembali] = useState('')
  const [returnLoading, setReturnLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [wasrikRes, itemRes] = await Promise.all([
        axios.get(WASRIK_API),
        axios.get(ITEM_API),
      ])
      setLoans(wasrikRes.data)
      setItems(itemRes.data)
    } catch (err) {
      console.error('Gagal memuat data peminjaman wasrik', err)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setForm({
      ...emptyForm,
      nama_peminjam: isAuditor ? user.name : '',
      nip_peminjam: isAuditor ? '198204122006042001' : '',
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    if (!form.item_id) {
      setFormError('Pilih barang yang akan dipinjam.')
      setSubmitting(false)
      return
    }

    try {
      await axios.post(WASRIK_API, form)
      await fetchAll()
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan peminjaman wasrik.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReturnSubmit(e) {
    e.preventDefault()
    if (!returnItem) return
    setReturnLoading(true)

    try {
      await axios.post(`${WASRIK_API}/${returnItem.id || returnItem._id}/kembali`, {
        kondisi_kembali: kondisiKembali,
        keterangan: catatanKembali,
      })
      await fetchAll()
      setReturnItem(null)
    } catch (err) {
      alert('Gagal memproses pengembalian barang.')
    } finally {
      setReturnLoading(false)
    }
  }

  // Barang yang tersedia untuk dipinjam (hanya yang statusnya 'digunakan')
  const availableItems = items.filter((i) => i.status_penggunaan !== 'dipinjam_wasrik')

  const filteredLoans = loans.filter((l) => {
    if (isAuditor && l.nama_peminjam !== user.name) {
      return false
    }
    const term = search.toLowerCase()
    return (
      l.nama_peminjam.toLowerCase().includes(term) ||
      l.no_surat_tugas.toLowerCase().includes(term) ||
      l.tujuan_wilayah.toLowerCase().includes(term) ||
      (l.item?.itemName && l.item.itemName.toLowerCase().includes(term))
    )
  })

  function handleExportCSV() {
    const headers = [
      'No',
      'Kode Barang',
      'Nama Barang',
      'NUP',
      'Nama Peminjam',
      'NIP',
      'Jabatan / Tim',
      'No. Surat Tugas',
      'Tujuan Wilayah',
      'Tanggal Berangkat',
      'Tanggal Kembali',
      'Status Peminjaman',
      'Kondisi Kembali',
      'Catatan',
    ]

    const rows = filteredLoans.map((l, idx) => [
      idx + 1,
      `"${l.item?.kode_bmn || l.item?.itemCode || ''}"`,
      `"${(l.item?.itemName || '').replace(/"/g, '""')}"`,
      `"${l.item?.nup || '0001'}"`,
      `"${(l.nama_peminjam || '').replace(/"/g, '""')}"`,
      `"${l.nip_peminjam || ''}"`,
      `"${(l.jabatan_tim || '').replace(/"/g, '""')}"`,
      `"${(l.no_surat_tugas || '').replace(/"/g, '""')}"`,
      `"${(l.tujuan_wilayah || '').replace(/"/g, '""')}"`,
      l.tanggal_berangkat || '',
      l.tanggal_kembali || '',
      `"${l.status || 'diajukan'}"`,
      `"${l.kondisi_kembali || ''}"`,
      `"${(l.keterangan || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Log_Peminjaman_Wasrik_Itjen_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-ink/40 mb-1">
            Operasional APIP <span className="mx-1">›</span>
            <span className="text-navy font-medium">Peminjaman Aset Tugas Wasrik</span>
          </p>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Laptop className="text-navy" size={26} />
            Peminjaman Barang Tugas Wasrik / Audit Lapangan
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Pencatatan tertib peminjaman laptop dan perangkat BMN untuk tim pengawasan ke daerah terikat Surat Tugas (ST)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            title="Unduh log peminjaman ke CSV / Excel"
          >
            <Download size={14} /> Export CSV
          </button>
          <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 shadow-sm text-xs">
            <Plus size={15} /> Ajukan Pinjam Aset
          </Button>
        </div>
      </div>

      {/* FILTER SEARCH */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Cari nama peminjam, nomor ST, atau tujuan wilayah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-black/10 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-navy"
          />
        </div>
        <div className="text-xs text-ink/50 font-mono-ledger">
          Total: <span className="font-bold text-navy">{filteredLoans.length}</span> Pengajuan
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-ink/60 border-b border-black/10 uppercase tracking-wider font-semibold">
                <th className="p-4">Barang BMN</th>
                <th className="p-4">Peminjam / Auditor</th>
                <th className="p-4">No. Surat Tugas (ST) & Tujuan</th>
                <th className="p-4">Jadwal Tugas</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-ink/40">
                    Memuat data peminjaman...
                  </td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-ink/40">
                    Belum ada riwayat peminjaman aset untuk tugas wasrik.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id || loan._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-ink text-sm">{loan.item?.itemName || 'Barang Terkait'}</div>
                      <div className="font-mono text-[11px] text-navy font-medium mt-0.5">
                        {loan.item?.itemCode} • NUP: {loan.item?.nup || '0001'}
                      </div>
                      {loan.item?.nomor_seri && (
                        <div className="text-[10px] text-ink/50 font-mono">SN: {loan.item.nomor_seri}</div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-ink">{loan.nama_peminjam}</div>
                      <div className="text-[11px] text-ink/60 font-mono">NIP: {loan.nip_peminjam || '-'}</div>
                      <div className="text-[10px] text-ink/40">{loan.jabatan_tim}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-navy font-mono text-[11px]">{loan.no_surat_tugas}</div>
                      <div className="text-xs text-ink/70 font-medium mt-0.5">{loan.tujuan_wilayah}</div>
                    </td>

                    <td className="p-4 font-mono-ledger">
                      <div className="text-xs text-ink">
                        {new Date(loan.tanggal_berangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -{' '}
                        {new Date(loan.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    <td className="p-4">
                      {loan.status === 'diajukan' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={12} className="animate-pulse" /> Menunggu Persetujuan
                        </span>
                      )}
                      {loan.status === 'dipinjam' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> Disetujui / Bertugas
                        </span>
                      )}
                      {loan.status === 'ditolak' && (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> Ditolak Pimpinan
                          </span>
                          {loan.catatan_approval && (
                            <div className="text-[10px] text-red-600 mt-1 max-w-[200px] truncate" title={loan.catatan_approval}>
                              Ket: {loan.catatan_approval}
                            </div>
                          )}
                        </div>
                      )}
                      {loan.status === 'kembali' && (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Selesai / Kembali
                          </span>
                          {loan.kondisi_kembali && (
                            <div className="text-[10px] text-ink/50 mt-1 capitalize">Kondisi: {loan.kondisi_kembali}</div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {loan.status === 'dipinjam' && (
                        <button
                          onClick={() => setPrintDoc(loan)}
                          className="inline-flex items-center gap-1 text-xs border border-navy/30 text-navy hover:bg-navy/5 px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          <Printer size={13} /> Dokumen SIPB
                        </button>
                      )}

                      {loan.status === 'kembali' && (
                        <button
                          onClick={() => setPrintReturnDoc(loan)}
                          className="inline-flex items-center gap-1 text-xs border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          <Printer size={13} /> BAST Pengembalian
                        </button>
                      )}

                      {loan.status === 'diajukan' && (
                        <span className="inline-block text-[11px] text-ink/50 italic py-1.5">
                          Menunggu Approval
                        </span>
                      )}

                      {loan.status === 'dipinjam' && (
                        <button
                          onClick={() => {
                            setReturnItem(loan)
                            setKondisiKembali(loan.item?.kondisi || 'baik')
                            setCatatanKembali('')
                          }}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg transition-colors font-medium shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Kembalikan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM PENGAJUAN PINJAM (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <Laptop size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">
                    Pengajuan Peminjaman Aset BMN
                  </h2>
                  <p className="text-[11px] text-slate-500">Peminjaman laptop/peralatan pengawasan untuk tugas Wasrik Kemendagri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY (HORIZONTAL FORM) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                    {formError}
                  </div>
                )}

                {/* Pilih Barang */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Barang yang Dipinjam <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <SearchableSelect
                      value={form.item_id}
                      onChange={(val) => setForm({ ...form, item_id: val })}
                      options={availableItems.map((item) => ({
                        value: item.id || item._id,
                        label: `${item.itemName} (${item.itemCode} • NUP: ${item.nup || '0001'}) - ${item.lokasi_ruangan || '-'}`,
                      }))}
                      placeholder="Pilih / cari barang tersedia..."
                      required
                    />
                  </div>
                </div>

                {/* Nama Peminjam */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Nama Peminjam <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      value={form.nama_peminjam}
                      onChange={(e) => setForm({ ...form, nama_peminjam: e.target.value })}
                      required
                      placeholder="Contoh: Rahmat Hidayat, S.E."
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* NIP Peminjam */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    NIP Peminjam:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      value={form.nip_peminjam}
                      onChange={(e) => setForm({ ...form, nip_peminjam: e.target.value })}
                      placeholder="Contoh: 198204122006042001"
                      className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                    />
                  </div>
                </div>

                {/* No Surat Tugas */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    No. Surat Tugas (ST) <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      value={form.no_surat_tugas}
                      onChange={(e) => setForm({ ...form, no_surat_tugas: e.target.value })}
                      required
                      placeholder="Contoh: ST.090/1422/IJ/2024"
                      className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                    />
                  </div>
                </div>

                {/* Tujuan Wilayah */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Tujuan Wilayah Wasrik <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      value={form.tujuan_wilayah}
                      onChange={(e) => setForm({ ...form, tujuan_wilayah: e.target.value })}
                      required
                      placeholder="Contoh: Pemkab Banyuwangi / Pemprov Jatim"
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Tanggal Berangkat & Kembali */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Periode Peminjaman <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Tgl Berangkat:</span>
                      <Input
                        type="date"
                        value={form.tanggal_berangkat}
                        onChange={(e) => setForm({ ...form, tanggal_berangkat: e.target.value })}
                        required
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Rencana Kembali:</span>
                      <Input
                        type="date"
                        value={form.tanggal_kembali}
                        onChange={(e) => setForm({ ...form, tanggal_kembali: e.target.value })}
                        required
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Keperluan Khusus:
                  </label>
                  <div className="sm:col-span-8">
                    <textarea
                      value={form.keterangan}
                      onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                      placeholder="Kebutuhan pemeriksaan audit operasional lapangan..."
                      rows={2}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                    />
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
                <Button type="submit" size="sm" className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Ajukan Peminjaman'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGEMBALIAN BARANG (GOOGLE ADVANCED SEARCH STYLE) */}
      {returnItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Pengembalian BMN</h3>
                <p className="text-[11px] text-slate-500">
                  Barang: <span className="font-semibold text-navy">{returnItem.item?.itemName}</span> ({returnItem.item?.itemCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnItem(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="flex flex-col">
              <div className="p-6 space-y-4 text-xs">
                {/* Kondisi Fisik Saat Kembali */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                    Kondisi Fisik Saat Kembali <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-7">
                    <SearchableSelect
                      value={kondisiKembali}
                      onChange={(val) => setKondisiKembali(val)}
                      options={[
                        { value: 'baik', label: '🟢 Baik (Berfungsi Normal)' },
                        { value: 'evaluasi', label: '🟡 Evaluasi (Kerusakan Ringan)' },
                        { value: 'perhatian', label: '🔴 Perhatian (Rusak Berat)' },
                      ]}
                      placeholder="Pilih kondisi kembali..."
                      required
                    />
                  </div>
                </div>

                {/* Catatan Pengembalian */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Catatan Pengembalian:
                  </label>
                  <div className="sm:col-span-7">
                    <textarea
                      value={catatanKembali}
                      onChange={(e) => setCatatanKembali(e.target.value)}
                      placeholder="Kelengkapan charger, tas dinas, kondisi mouse, dsb..."
                      rows={2}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnItem(null)}
                  className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-5 rounded-lg shadow-sm" disabled={returnLoading}>
                  {returnLoading ? 'Memproses...' : 'Konfirmasi Selesai'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT DOKUMEN SIPB / BAST PINJAM PAKAI RESMI */}
      {printDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-8 sm:p-12 my-8 border border-black/10">
            {/* PRINT TOOLBAR */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6 print:hidden">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Preview Surat Izin Pemegang Barang (SIPB)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintDoc(null)}
                  className="px-3 py-1.5 text-xs text-ink/60 hover:bg-gray-100 rounded-lg"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 text-xs">
                  <Printer size={14} /> Cetak Dokumen (A4)
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK DENGAN KOP KEMENDAGRI */}
            <div className="font-serif text-black leading-relaxed">
              <div className="flex items-start gap-4 border-b-4 border-double border-black pb-3 mb-5">
                <img src={logoKemendagri} alt="Logo Kemendagri" className="w-20 h-24 object-contain shrink-0" />
                <div className="text-center flex-1 pr-6 font-sans">
                  <p className="text-sm font-semibold tracking-wider uppercase text-black">
                    KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                  </p>
                  <p className="text-xl font-bold uppercase tracking-tight text-black mt-0.5">
                    INSPEKTORAT JENDERAL
                  </p>
                  <p className="text-[11px] text-black leading-tight mt-1">
                    Jalan Medan Merdeka Timur nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                    Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                  </p>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                  SURAT IZIN PEMEGANG BARANG (SIPB) / BERITA ACARA PINJAM PAKAI
                </h2>
                <p className="text-xs font-mono mt-1">Nomor: BAST-WAS/{printDoc.id || 1}/{new Date().getFullYear()}</p>
              </div>

              <div className="text-xs leading-relaxed space-y-3 text-ink">
                <p>
                  Pada hari ini, tanggal <strong>{new Date(printDoc.tanggal_berangkat).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, bertempat di Kantor Inspektorat Jenderal Kementerian Dalam Negeri, yang bertanda tangan di bawah ini:
                </p>

                <div className="pl-4 space-y-1">
                  <p><strong>1. Pengelola BMN (Pihak Pertama):</strong> Subbagian Pengelolaan BMN & Rumah Tangga Itjen Kemendagri</p>
                  <p><strong>2. Penerima / Peminjam (Pihak Kedua):</strong></p>
                  <div className="pl-4 space-y-0.5">
                    <p>• Nama: <strong>{printDoc.nama_peminjam}</strong></p>
                    <p>• NIP: {printDoc.nip_peminjam || '-'}</p>
                    <p>• Jabatan dalam Tim: {printDoc.jabatan_tim}</p>
                    <p>• Dasar Penugasan: <strong>Surat Tugas No. {printDoc.no_surat_tugas}</strong></p>
                    <p>• Wilayah / Lokasi Audit: <strong>{printDoc.tujuan_wilayah}</strong></p>
                  </div>
                </div>

                <p>
                  Pihak Pertama menyerahkan kepada Pihak Kedua, dan Pihak Kedua menerima Barang Milik Negara (BMN) untuk keperluan penugasan pengawasan lapangan sebagai berikut:
                </p>

                <table className="w-full text-xs border-collapse border border-black/30 my-3">
                  <thead>
                    <tr className="bg-gray-100 text-center font-bold">
                      <th className="border border-black/30 p-2">Kode BMN</th>
                      <th className="border border-black/30 p-2">NUP</th>
                      <th className="border border-black/30 p-2">Nama Barang & Merk/Tipe</th>
                      <th className="border border-black/30 p-2">No. Seri (SN)</th>
                      <th className="border border-black/30 p-2">Kondisi Awal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center">
                      <td className="border border-black/30 p-2 font-mono font-medium">{printDoc.item?.itemCode}</td>
                      <td className="border border-black/30 p-2 font-mono">{printDoc.item?.nup || '0001'}</td>
                      <td className="border border-black/30 p-2 text-left font-semibold">
                        {printDoc.item?.itemName}
                        {printDoc.item?.merk_tipe && <span className="block text-[10px] text-ink/60">{printDoc.item.merk_tipe}</span>}
                      </td>
                      <td className="border border-black/30 p-2 font-mono">{printDoc.item?.nomor_seri || '-'}</td>
                      <td className="border border-black/30 p-2 capitalize font-semibold text-emerald-700">
                        {printDoc.item?.kondisi || 'Baik'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-ink/80 text-[11px] italic">
                  Pihak Kedua bertanggung jawab penuh atas keamanan, keutuhan, dan pengoperasian BMN tersebut selama pelaksanaan tugas, dan wajib mengembalikan kepada Pihak Pertama selambat-lambatnya tanggal <strong>{new Date(printDoc.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                </p>

                <div className="mt-12 grid grid-cols-2 text-center text-xs break-inside-avoid">
                  <div>
                    <p className="text-ink/60 mb-1">Yang Menyerahkan (Pihak Pertama),</p>
                    <p className="font-semibold text-ink">Pengelola BMN / Rumah Tangga</p>
                    <p className="text-ink/50 text-[11px] mb-20">Sekretariat Itjen Kemendagri</p>
                    <p className="font-bold underline text-ink">( .................................................... )</p>
                    <p className="text-[11px] text-ink/60 font-mono">NIP. .............................................</p>
                  </div>
                  <div>
                    <p className="text-ink/60 mb-1">Yang Menerima (Pihak Kedua),</p>
                    <p className="font-semibold text-ink">Penerima / Tim Wasrik</p>
                    <p className="text-ink/50 text-[11px] mb-20">{printDoc.jabatan_tim}</p>
                    <p className="font-bold underline text-ink">( {printDoc.nama_peminjam} )</p>
                    <p className="text-[11px] text-ink/60 font-mono">NIP. {printDoc.nip_peminjam || '.............................................'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINT BAST PENGEMBALIAN BARANG INVENTARIS RESMI KEMENDAGRI */}
      {printReturnDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-8 sm:p-12 my-8 border border-black/10">
            {/* PRINT TOOLBAR */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6 print:hidden">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">
                Preview Berita Acara Serah Terima Pengembalian
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintReturnDoc(null)}
                  className="px-3 py-1.5 text-xs text-ink/60 hover:bg-gray-100 rounded-lg"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 text-xs">
                  <Printer size={14} /> Cetak BAST Pengembalian (A4)
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK BAST PENGEMBALIAN SESUAI DOKUMEN FISIK */}
            <div className="font-serif text-black leading-relaxed">
              {/* KOP SURAT */}
              <div className="flex items-start gap-4 border-b-4 border-double border-black pb-3 mb-5">
                <img src={logoKemendagri} alt="Logo Kemendagri" className="w-20 h-24 object-contain shrink-0" />
                <div className="text-center flex-1 pr-6 font-sans">
                  <p className="text-sm font-semibold tracking-wider uppercase text-black">
                    KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                  </p>
                  <p className="text-xl font-bold uppercase tracking-tight text-black mt-0.5">
                    INSPEKTORAT JENDERAL
                  </p>
                  <p className="text-[11px] text-black leading-tight mt-1">
                    Jalan Medan Merdeka Timur Nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                    Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                  </p>
                </div>
              </div>

              {/* JUDUL */}
              <div className="text-center mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                  BERITA ACARA SERAH TERIMA PENGEMBALIAN<br />INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                </h2>
                <p className="text-xs font-mono mt-1">Nomor : 000.3.3.2/{printReturnDoc.id ? String(printReturnDoc.id).padStart(3, '0') : '107'}/ITJEN</p>
              </div>

              {/* ISI DOKUMEN */}
              <div className="text-xs space-y-3.5 text-justify">
                <p>
                  Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, yang bertandatangan dibawah ini masing-masing :
                </p>

                {/* IDENTITAS PIHAK PERTAMA & KEDUA */}
                <div className="space-y-3 pl-2">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-1">1.</span>
                    <span className="col-span-2">Nama</span>
                    <span className="col-span-9 font-bold">: Andi Agung Febrianto, S.STP, M.Kessos</span>

                    <span className="col-span-1"></span>
                    <span className="col-span-2">NIP</span>
                    <span className="col-span-9 font-mono">: 19900217 201206 1 002</span>

                    <span className="col-span-1"></span>
                    <span className="col-span-2">Jabatan</span>
                    <span className="col-span-9">: Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Pertama</em>.</span>
                  </div>

                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-1">2.</span>
                    <span className="col-span-2">Nama</span>
                    <span className="col-span-9 font-bold">: {printReturnDoc.nama_peminjam || 'Ir. Rolekson Simatupang, MM'}</span>

                    <span className="col-span-1"></span>
                    <span className="col-span-2">NIP</span>
                    <span className="col-span-9 font-mono">: {printReturnDoc.nip_peminjam || '19610706 199403 1 001'}</span>

                    <span className="col-span-1"></span>
                    <span className="col-span-2">Jabatan</span>
                    <span className="col-span-9">: {printReturnDoc.jabatan_tim || 'PPUPD Ahli Utama Pada Inspektorat II'} Pada Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Kedua</em>.</span>
                  </div>
                </div>

                <p className="pt-1">
                  Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                </p>

                {/* BUTIR KETENTUAN PENGEMBALIAN */}
                <div className="space-y-2 pl-1 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span>1.</span>
                    <div className="flex-1">
                      <em>Pihak Kedua</em> menyerahkan dan mengembalikan Barang Inventaris Inspektorat Jenderal Kemendagri untuk kepentingan dinas dengan spesifikasi dan kelengkapan sebagai berikut :

                      {/* TABEL BARANG YANG DIKEMBALIKAN */}
                      <table className="w-full text-[11px] border-collapse border border-black my-2 font-sans">
                        <thead>
                          <tr className="bg-gray-50 text-center font-bold">
                            <th className="border border-black px-2 py-1.5 w-10">No</th>
                            <th className="border border-black px-2 py-1.5 w-44">Jenis Barang</th>
                            <th className="border border-black px-2 py-1.5">Spesifikasi / Merk</th>
                            <th className="border border-black px-2 py-1.5 w-20">Jumlah</th>
                            <th className="border border-black px-2 py-1.5 w-32">Kelengkapan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="align-top">
                            <td className="border border-black px-2 py-2 text-center font-bold">1</td>
                            <td className="border border-black px-2 py-2 font-semibold">
                              {printReturnDoc.item?.itemName || 'Laptop'}
                              <span className="block text-[10px] font-mono text-black/70 font-normal mt-0.5">
                                {printReturnDoc.item?.itemCode || '3.10.01.02.002.95'}
                              </span>
                            </td>
                            <td className="border border-black px-2 py-2">
                              <p><strong>Merk:</strong> {printReturnDoc.item?.merk_tipe || printReturnDoc.item?.itemName || 'Asus'}</p>
                              <p className="mt-0.5"><strong>Tipe:</strong> {printReturnDoc.item?.nomor_seri ? `SN: ${printReturnDoc.item.nomor_seri}` : 'Zenbook 14 OLED UX3405CA'}</p>
                              <p className="text-[10px] text-black/70 mt-0.5">Kondisi: {printReturnDoc.kondisi_kembali || 'Baik'}</p>
                            </td>
                            <td className="border border-black px-2 py-2 text-center font-semibold">1 Unit</td>
                            <td className="border border-black px-2 py-2">
                              <p>1. Charger</p>
                              <p>2. Sleeve / Tas</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>2.</span>
                    <p className="flex-1"><em>Pihak Pertama</em> berhak menyimpan atau mendistribusikan barang inventaris tersebut untuk kepentingan dinas.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>3.</span>
                    <p className="flex-1"><em>Pihak Pertama</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.</p>
                  </div>
                </div>

                <p className="pt-2 text-[11px]">
                  Demikian Berita Acara Serah Terima Barang Inventaris Inspektorat Jenderal Kemendagri ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.
                </p>

                {/* TANDA TANGAN 3 PIHAK: PIHAK PERTAMA, PIHAK KEDUA, MENGETAHUI SEKRETARIS */}
                <div className="pt-6 space-y-8 font-sans break-inside-avoid">
                  <div className="grid grid-cols-2 text-center text-xs">
                    <div>
                      <p className="font-bold tracking-wide uppercase mb-16">PIHAK PERTAMA</p>
                      <p className="font-bold underline text-black">Andi Agung Febrianto, S.STP, M.Kessos</p>
                      <p className="text-[11px] font-mono mt-0.5">NIP. 19900217 201206 1 002</p>
                    </div>

                    <div>
                      <p className="font-bold tracking-wide uppercase mb-16">PIHAK KEDUA</p>
                      <p className="font-bold underline text-black">
                        {printReturnDoc.nama_peminjam || 'Ir. Rolekson Simatupang, MM'}
                      </p>
                      <p className="text-[11px] font-mono mt-0.5">
                        NIP. {printReturnDoc.nip_peminjam || '19610706 199403 1 001'}
                      </p>
                    </div>
                  </div>

                  {/* MENGETAHUI SEKRETARIS */}
                  <div className="text-center text-xs pt-2">
                    <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                    <p className="text-xs mb-16">Sekretaris,</p>
                    <p className="font-bold underline text-black">Dr. Ir. Bachril Bakri, M.App.Sc</p>
                    <p className="text-[11px] font-mono mt-0.5">NIP. 19661122 199303 1 001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default PeminjamanWasrik
