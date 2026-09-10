import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Plus, Trash2, MapPin, ArrowRight, Search, Building2, UserCheck, Calendar, X, AlertCircle, Printer, FileText, Clock, CheckCircle2, XCircle, Download } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import { RUANGAN_GEDUNG_ITJEN } from '../lib/constants'

const MUTASI_API = `${API_BASE_URL}/mutasi-lokasi`
const ITEM_API = `${API_BASE_URL}/item`

const emptyForm = {
  item_id: '',
  lokasi_tujuan: RUANGAN_GEDUNG_ITJEN[0],
  tanggal_mutasi: new Date().toISOString().split('T')[0],
  penanggung_jawab: '',
  keterangan: '',
}

function Pelacakan() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isPimpinan = user?.role === 'pimpinan'

  const [mutasiList, setMutasiList] = useState([])
  const [itemList, setItemList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // State untuk Cetak Dokumen BAST Mutasi
  const [printBast, setPrintBast] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [mutasiRes, itemRes] = await Promise.all([
        axios.get(MUTASI_API),
        axios.get(ITEM_API),
      ])
      setMutasiList(mutasiRes.data)
      setItemList(itemRes.data)
    } catch (err) {
      setError('Gagal memuat data pelacakan & mutasi')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal(defaultItemId = '') {
    setForm({
      ...emptyForm,
      item_id: defaultItemId ? String(defaultItemId) : '',
    })
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  const selectedItem = itemList.find((item) => String(item._id || item.id) === String(form.item_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    if (!form.item_id) {
      setFormError('Pilih barang yang akan dipindahkan.')
      setSubmitting(false)
      return
    }

    if (!form.lokasi_tujuan.trim()) {
      setFormError('Lokasi tujuan wajib diisi.')
      setSubmitting(false)
      return
    }

    const payload = {
      item_id: Number(form.item_id),
      lokasi_tujuan: form.lokasi_tujuan.trim(),
      tanggal_mutasi: form.tanggal_mutasi,
      penanggung_jawab: form.penanggung_jawab.trim(),
      keterangan: form.keterangan.trim(),
      status_approval: 'menunggu',
    }

    try {
      await axios.post(MUTASI_API, payload)
      await fetchAll()
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan mutasi.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Hapus log mutasi ini?')
    if (!confirmed) return

    try {
      await axios.delete(`${MUTASI_API}/${id}`)
      await fetchAll()
    } catch (err) {
      alert('Gagal menghapus log mutasi.')
    }
  }

  const filteredMutasi = mutasiList.filter((m) => {
    const term = search.toLowerCase()
    return (
      m.item?.itemName?.toLowerCase().includes(term) ||
      m.item?.itemCode?.toLowerCase().includes(term) ||
      m.lokasi_tujuan?.toLowerCase().includes(term) ||
      m.lokasi_asal?.toLowerCase().includes(term) ||
      m.penanggung_jawab?.toLowerCase().includes(term) ||
      m.keterangan?.toLowerCase().includes(term)
    )
  })

  function handleExportCSV() {
    const headers = [
      'No',
      'Tanggal Mutasi',
      'Kode Barang',
      'Nama Barang',
      'Lokasi Asal',
      'Lokasi Tujuan',
      'Penanggung Jawab Baru',
      'Status Approval',
      'Catatan Approval',
      'Disetujui Oleh',
      'Keterangan / Alasan',
    ]

    const rows = filteredMutasi.map((m, idx) => [
      idx + 1,
      m.tanggal_mutasi || '',
      `"${m.item?.kode_bmn || m.item?.itemCode || ''}"`,
      `"${(m.item?.itemName || '').replace(/"/g, '""')}"`,
      `"${(m.lokasi_asal || '').replace(/"/g, '""')}"`,
      `"${(m.lokasi_tujuan || '').replace(/"/g, '""')}"`,
      `"${(m.penanggung_jawab || '').replace(/"/g, '""')}"`,
      `"${m.status_approval || 'menunggu'}"`,
      `"${(m.catatan_approval || '').replace(/"/g, '""')}"`,
      `"${(m.approved_by || '').replace(/"/g, '""')}"`,
      `"${(m.keterangan || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Riwayat_Mutasi_BMN_Itjen_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-ink/40 mb-1">
            Akuntabilitas Aset <span className="mx-1">›</span>
            <span className="text-navy font-medium">Pelacakan & BAST Mutasi</span>
          </p>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <MapPin className="text-navy" size={26} />
            Pelacakan Lokasi & Berita Acara Serah Terima (BAST)
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Audit trail perpindahan fisik aset antar ruangan di lingkungan Itjen Kemendagri disertai penerbitan dokumen BAST resmi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            title="Unduh riwayat mutasi ke CSV / Excel"
          >
            <Download size={14} /> Export CSV
          </button>

          {!isPimpinan && (
            <Button onClick={() => openCreateModal()} className="bg-navy hover:bg-navy-light text-white shadow-sm flex items-center gap-2 text-xs">
              <Plus size={15} /> Catat Mutasi Baru
            </Button>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Cari kode barang, nama, ruangan tujuan, atau penanggung jawab..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-black/10 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-navy"
          />
        </div>
        <div className="text-xs text-ink/50 font-mono-ledger">
          Total: <span className="font-bold text-navy">{filteredMutasi.length}</span> Mutasi Tercatat
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 w-28">Tanggal</th>
                <th className="px-4 py-3">Nama & Kode BMN</th>
                <th className="px-4 py-3">Rute Perpindahan Ruangan</th>
                <th className="px-4 py-3">Penanggung Jawab Baru</th>
                <th className="px-4 py-3">Keterangan / Alasan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-ink/40">
                    Memuat data log mutasi...
                  </td>
                </tr>
              ) : filteredMutasi.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-ink/40">
                    Belum ada riwayat mutasi perpindahan aset.
                  </td>
                </tr>
              ) : (
                filteredMutasi.map((row) => (
                  <tr key={row._id || row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-ink/70">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-ink/40" />
                        {new Date(row.tanggal_mutasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink text-sm">{row.item?.itemName || 'Barang tidak ditemukan'}</div>
                      <div className="font-mono text-[11px] text-navy font-bold">
                        {row.item?.itemCode} • NUP: {row.item?.nup || '0001'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-black/5 text-xs">
                        <span className="text-ink/60">{row.lokasi_asal || 'Belum Ditentukan'}</span>
                        <ArrowRight size={13} className="text-navy shrink-0" />
                        <span className="font-bold text-navy flex items-center gap-1">
                          <MapPin size={12} className="text-gold" />
                          {row.lokasi_tujuan}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink text-xs">{row.penanggung_jawab || '—'}</div>
                      <div className="text-[10px] text-ink/40">Penerima Barang</div>
                    </td>

                    <td className="px-4 py-3.5 text-ink/70 max-w-xs truncate">
                      {row.keterangan || '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      {row.status_approval === 'menunggu' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} className="animate-pulse" /> Menunggu Persetujuan
                        </span>
                      )}
                      {row.status_approval === 'disetujui' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Disetujui
                        </span>
                      )}
                      {row.status_approval === 'ditolak' && (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> Ditolak
                          </span>
                          {row.catatan_approval && (
                            <div className="text-[10px] text-red-600 mt-0.5 max-w-[150px] truncate" title={row.catatan_approval}>
                              {row.catatan_approval}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {/* Tombol Cetak BAST Mutasi (Hanya setelah disetujui) */}
                      {row.status_approval === 'disetujui' ? (
                        <button
                          onClick={() => setPrintBast(row)}
                          className="inline-flex items-center gap-1 text-xs border border-navy/30 text-navy hover:bg-navy/5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                        >
                          <Printer size={13} /> Cetak BAST
                        </button>
                      ) : (
                        <span className="inline-block text-[11px] text-ink/40 italic py-1.5">
                          Menunggu Approval
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(row._id || row.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Hapus riwayat"
                        >
                          <Trash2 size={14} />
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

      {/* MODAL FORM CATAT MUTASI (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 tracking-tight">
                    Pencatatan Mutasi Lokasi & Terbitkan BAST
                  </h3>
                  <p className="text-[11px] text-slate-500">Pemindahan penempatan fisik ruangan BMN Gedung Itjen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY (HORIZONTAL FORM) */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Pilih Barang */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Barang BMN <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <SearchableSelect
                      value={form.item_id}
                      onChange={(val) => setForm({ ...form, item_id: val })}
                      options={itemList.map((i) => ({
                        value: i.id || i._id,
                        label: `${i.itemName} (${i.itemCode} • NUP: ${i.nup || '0001'}) - Saat ini: ${i.lokasi_ruangan || '-'}`,
                      }))}
                      placeholder="Pilih / cari barang BMN..."
                      required
                    />
                  </div>
                </div>

                {selectedItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <div className="sm:col-span-4 sm:text-right text-[11px] text-slate-400">Status Saat Ini:</div>
                    <div className="sm:col-span-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <div>
                        Lokasi Asal:{' '}
                        <strong className="text-navy">{selectedItem.lokasi_ruangan || 'Belum Ditentukan'}</strong>
                      </div>
                      <div>
                        PJ Lama: <strong>{selectedItem.penanggung_jawab || 'Belum Ditentukan'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lokasi Ruangan Tujuan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Ruangan Tujuan <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <SearchableSelect
                      value={form.lokasi_tujuan}
                      onChange={(val) => setForm({ ...form, lokasi_tujuan: val })}
                      options={RUANGAN_GEDUNG_ITJEN.map((r) => ({
                        value: r,
                        label: r,
                      }))}
                      placeholder="Pilih / cari ruangan tujuan..."
                      required
                    />
                  </div>
                </div>

                {/* Tanggal Mutasi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Tanggal Mutasi <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      type="date"
                      value={form.tanggal_mutasi}
                      onChange={(e) => setForm({ ...form, tanggal_mutasi: e.target.value })}
                      required
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Penanggung Jawab Baru */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Penanggung Jawab Baru:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      value={form.penanggung_jawab}
                      onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
                      placeholder="Contoh: Rahmat Hidayat, S.E."
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Alasan Pemindahan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Alasan Pemindahan:
                  </label>
                  <div className="sm:col-span-8">
                    <textarea
                      value={form.keterangan}
                      onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                      placeholder="Distribusi fasilitas kerja ruangan baru..."
                      rows={2}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <Button type="button" variant="outline" onClick={closeModal} className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm">
                  {submitting ? 'Menyimpan...' : 'Simpan & Update Lokasi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK BAST MUTASI RESMI DENGAN KOP KEMENDAGRI */}
      {printBast && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-8 sm:p-12 my-8 border border-black/10">
            {/* PRINT TOOLBAR */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6 print:hidden">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Preview Dokumen BAST Mutasi Resmi</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintBast(null)}
                  className="px-3 py-1.5 text-xs text-ink/60 hover:bg-gray-100 rounded-lg"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 text-xs">
                  <Printer size={14} /> Cetak BAST (A4)
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK BAST RESMI FORMAT RESMI KEMENDAGRI */}
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
                    Jalan Medan Merdeka Timur nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                    Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                  </p>
                </div>
              </div>

              {/* JUDUL BAST */}
              <div className="text-center mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                  BERITA ACARA SERAH TERIMA<br />INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                </h2>
                <p className="text-xs font-mono mt-1">Nomor : 000.3.3.2/{printBast.id ? String(printBast.id).padStart(3, '0') : '128'}/ITJEN</p>
              </div>

              {/* ISI DOKUMEN */}
              <div className="text-xs space-y-3.5 text-justify">
                <p>
                  Pada hari ini, tanggal <strong>{new Date(printBast.tanggal_mutasi).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, yang bertandatangan dibawah ini masing-masing :
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
                    <span className="col-span-9 font-bold">: {printBast.penanggung_jawab || '.............................................................'}</span>
                    
                    <span className="col-span-1"></span>
                    <span className="col-span-2">NIP</span>
                    <span className="col-span-9 font-mono">: .............................................................</span>
                    
                    <span className="col-span-1"></span>
                    <span className="col-span-2">Jabatan</span>
                    <span className="col-span-9">: Penanggung Jawab Ruangan {printBast.lokasi_tujuan} Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Kedua</em>.</span>
                  </div>
                </div>

                <p className="pt-1">
                  Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                </p>

                {/* 7 BUTIR KETENTUAN */}
                <div className="space-y-2 pl-1 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span>1.</span>
                    <div className="flex-1">
                      <em>Pihak Pertama</em> menyerahkan Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dalam keadaan baik dengan spesifikasi dan kelengkapan sebagai berikut :
                      
                      {/* TABEL BARANG */}
                      <table className="w-full text-[11px] border-collapse border border-black my-2 font-sans">
                        <thead>
                          <tr className="bg-gray-50 text-center font-bold">
                            <th className="border border-black px-2 py-1.5 w-10">No.</th>
                            <th className="border border-black px-2 py-1.5 w-44">Jenis Barang</th>
                            <th className="border border-black px-2 py-1.5">Spesifikasi/Merk</th>
                            <th className="border border-black px-2 py-1.5 w-20">Jumlah</th>
                            <th className="border border-black px-2 py-1.5 w-32">Kelengkapan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="align-top">
                            <td className="border border-black px-2 py-2 text-center font-bold">1.</td>
                            <td className="border border-black px-2 py-2 font-semibold">
                              {printBast.item?.itemName || 'Notebook / Komputer'}
                              <span className="block text-[10px] font-mono text-black/70 font-normal mt-0.5">
                                {printBast.item?.itemCode || '3.10.01.02.003.224'}
                              </span>
                            </td>
                            <td className="border border-black px-2 py-2">
                              <p><strong>Merk:</strong> {printBast.item?.merk_tipe || printBast.item?.itemName || 'Notebook HP'}</p>
                              <p className="mt-0.5"><strong>Tipe/SN:</strong> {printBast.item?.nomor_seri ? `SN: ${printBast.item.nomor_seri}` : '240 G6 Intel Core i5-7200U'}</p>
                              <p className="text-[10px] text-black/70 mt-0.5">NUP: {printBast.item?.nup || '0001'}</p>
                            </td>
                            <td className="border border-black px-2 py-2 text-center font-semibold">1 Unit</td>
                            <td className="border border-black px-2 py-2">1 Unit charger / kabel daya</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>2.</span>
                    <p className="flex-1"><em>Pihak Kedua</em> berhak menggunakan barang inventaris tersebut sepanjang untuk kepentingan dinas.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>3.</span>
                    <p className="flex-1"><em>Pihak Kedua</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>4.</span>
                    <p className="flex-1"><em>Pihak Kedua</em> dilarang merubah bentuk, warna dan ukuran serta dilarang menjual, menggadaikan dan pinjam pakai kepada pihak lainnya.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>5.</span>
                    <p className="flex-1">Apabila barang inventaris tersebut hilang ataupun mengalami kerusakan karena kelalaian <em>Pihak Kedua</em>, maka <em>Pihak Kedua</em> memiliki kewajiban untuk mengganti dan memperbaiki barang inventaris tersebut.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>6.</span>
                    <p className="flex-1"><em>Pihak Pertama</em> sewaktu-waktu dapat menarik kembali barang inventaris dimaksud guna memenuhi kebutuhan organisasi yang bersifat mendesak.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>7.</span>
                    <p className="flex-1">Apabila <em>Pihak Kedua</em> pindah/keluar instansi maka barang inventaris tersebut harus diserahkan kepada Pejabat Pengganti atas sepengetahuan <em>Pihak Pertama</em> dan tidak boleh dibawa.</p>
                  </div>
                </div>

                <p className="pt-2 text-[11px]">
                  Demikian Berita Acara Serah Terima Barang Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.
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
                        {printBast.penanggung_jawab || '( .................................................... )'}
                      </p>
                      <p className="text-[11px] font-mono mt-0.5">NIP. .............................................</p>
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

export default Pelacakan
