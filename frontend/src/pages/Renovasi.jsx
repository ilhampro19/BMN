import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Plus, Trash2, Wrench, CheckCircle2, TrendingUp, AlertCircle, X } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const RENOVASI_API = `${API_BASE_URL}/renovasi`
const ITEM_API = `${API_BASE_URL}/item`

const emptyForm = {
  item_id: '',
  tanggal_renovasi: new Date().toISOString().split('T')[0],
  biaya_renovasi: '',
  tambah_umur_tahun: 0,
  kapitalisasi: true,
  deskripsi: '',
}

function Renovasi() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isPimpinan = user?.role === 'pimpinan'

  const [renovasiList, setRenovasiList] = useState([])
  const [itemList, setItemList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [renovasiRes, itemRes] = await Promise.all([
        axios.get(RENOVASI_API),
        axios.get(ITEM_API),
      ])
      setRenovasiList(renovasiRes.data)
      setItemList(itemRes.data)
    } catch (err) {
      setError('Gagal memuat data renovasi')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setForm(emptyForm)
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

    if (!form.item_id) {
      setFormError('Pilih barang terlebih dahulu.')
      setSubmitting(false)
      return
    }

    const payload = {
      item_id: Number(form.item_id),
      tanggal_renovasi: form.tanggal_renovasi,
      biaya_renovasi: Number(form.biaya_renovasi),
      tambah_umur_tahun: Number(form.tambah_umur_tahun || 0),
      kapitalisasi: Boolean(form.kapitalisasi),
      deskripsi: form.deskripsi,
    }

    try {
      await axios.post(RENOVASI_API, payload)
      await fetchAll()
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data renovasi.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus riwayat renovasi ini? Nilai kapitalisasi barang akan dikembalikan.')) {
      return
    }

    try {
      await axios.delete(`${RENOVASI_API}/${id}`)
      await fetchAll()
    } catch (err) {
      alert('Gagal menghapus data renovasi.')
    }
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)
  }

  // Statistik Ringkasan
  const totalBiaya = renovasiList.reduce((acc, curr) => acc + Number(curr.biaya_renovasi || 0), 0)
  const totalKapitalisasi = renovasiList.filter((r) => r.kapitalisasi).length

  return (
    <Layout>
      {/* BREADCRUMB */}
      <p className="text-xs text-ink/40 mb-4">
        Aplikasi Utama <span className="mx-1">›</span>
        <span className="text-navy font-medium">Renovasi & Pemeliharaan</span>
      </p>

      {/* HEADER ROW */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Renovasi & Pemeliharaan BMN</h1>
          <p className="text-sm text-ink/50 mt-1">
            Catat perbaikan aset, kapitalisasi nilai buku, dan perpanjangan masa manfaat
          </p>
        </div>
        {!isPimpinan && (
          <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light flex items-center gap-2">
            <Plus size={16} /> Catat Renovasi Baru
          </Button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
            <Wrench size={18} />
          </div>
          <p className="text-xs text-ink/50 font-medium">Total Catatan Renovasi</p>
          <p className="text-2xl font-semibold text-ink mt-1">{renovasiList.length} Kegiatan</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp size={18} />
          </div>
          <p className="text-xs text-ink/50 font-medium">Total Biaya Renovasi</p>
          <p className="text-2xl font-semibold text-ink mt-1">{formatRupiah(totalBiaya)}</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs text-ink/50 font-medium">Dikapitalisasi ke Aset</p>
          <p className="text-2xl font-semibold text-ink mt-1">{totalKapitalisasi} Unit</p>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Riwayat Pekerjaan Renovasi & Pemeliharaan</h2>
        </div>

        {loading && <p className="p-6 text-sm text-ink/50">Memuat data...</p>}
        {error && <p className="p-6 text-sm text-rust">{error}</p>}

        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-black/5">
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Tanggal</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nama Barang</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Biaya Renovasi</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Tambah Umur</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Status Kapitalisasi</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Keterangan</th>
                {isAdmin && <th className="text-right text-xs font-semibold text-ink/50 px-5 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {renovasiList.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-8 text-center text-sm text-ink/40">
                    Belum ada riwayat renovasi tercatat
                  </td>
                </tr>
              )}
              {renovasiList.map((row) => (
                <tr key={row._id || row.id} className="border-b border-black/5 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm text-ink">{row.tanggal_renovasi}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-ink">
                    {row.item?.itemName || 'Barang tidak ditemukan'}
                    <span className="block text-xs font-normal text-ink/40 font-mono-ledger">
                      {row.item?.itemCode}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                    {formatRupiah(row.biaya_renovasi)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink">
                    {row.tambah_umur_tahun > 0 ? `+${row.tambah_umur_tahun} Tahun` : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {row.kapitalisasi ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={12} /> Kapitalisasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        Beban Rutin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink/70 max-w-xs truncate">
                    {row.deskripsi || '-'}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-sm text-right">
                      <button
                        onClick={() => handleDelete(row._id || row.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Hapus riwayat"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORM TAMBAH RENOVASI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Catat Renovasi & Pemeliharaan BMN</h3>
                  <p className="text-[11px] text-slate-500">Pencatatan pemeliharaan aset, penambahan masa manfaat & kapitalisasi nilai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
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

                {/* Barang yang Direnovasi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="item_id" className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Barang / Aset BMN <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <SearchableSelect
                      id="item_id"
                      value={form.item_id}
                      onChange={(val) => setForm({ ...form, item_id: val })}
                      options={itemList.map((item) => ({
                        value: item._id || item.id,
                        label: `${item.itemName} (${item.itemCode}) - ${formatRupiah(item.nilaiPerolehan)}`,
                      }))}
                      placeholder="Pilih / cari barang yang direnovasi..."
                      required
                    />
                  </div>
                </div>

                {/* Tanggal Renovasi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="tanggal" className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Tanggal Renovasi <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      id="tanggal"
                      type="date"
                      value={form.tanggal_renovasi}
                      onChange={(e) => setForm({ ...form, tanggal_renovasi: e.target.value })}
                      required
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Biaya Renovasi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="biaya" className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Biaya Renovasi (Rp) <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-8">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                      <Input
                        id="biaya"
                        type="number"
                        min="0"
                        placeholder="Contoh: 15000000"
                        value={form.biaya_renovasi}
                        onChange={(e) => setForm({ ...form, biaya_renovasi: e.target.value })}
                        required
                        className="text-xs h-9 pl-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                    {Number(form.biaya_renovasi) > 0 && (
                      <p className="text-[11px] text-emerald-700 font-semibold font-mono mt-1">
                        Format: {formatRupiah(form.biaya_renovasi)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tambah Umur Manfaat */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="tambahUmur" className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                    Perpanjangan Umur (Tahun):
                  </label>
                  <div className="sm:col-span-8">
                    <Input
                      id="tambahUmur"
                      type="number"
                      min="0"
                      placeholder="0 (jika tidak memperpanjang usia pakai)"
                      value={form.tambah_umur_tahun}
                      onChange={(e) => setForm({ ...form, tambah_umur_tahun: e.target.value })}
                      className="text-xs h-9 border-slate-300 focus:border-navy"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Opsional. Diisi jika renovasi memperpanjang masa manfaat aset (misal +2 tahun).
                    </p>
                  </div>
                </div>

                {/* Kapitalisasi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Kebijakan Akuntansi:
                  </label>
                  <div className="sm:col-span-8">
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.kapitalisasi}
                        onChange={(e) => setForm({ ...form, kapitalisasi: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                      />
                      <div>
                        <span className="text-xs font-semibold text-navy block">
                          Kapitalisasi Biaya ke Nilai Perolehan Aset BMN
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                          Menambahkan biaya ini langsung ke nilai buku barang dan memperbarui kondisi fisik menjadi <b>Baik</b>.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Uraian Keterangan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <label htmlFor="deskripsi" className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                    Uraian / Keterangan:
                  </label>
                  <div className="sm:col-span-8">
                    <textarea
                      id="deskripsi"
                      rows={3}
                      placeholder="Contoh: Perbaikan atap bocor, penggantian sparepart, dan pengecatan ulang..."
                      value={form.deskripsi}
                      onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-navy resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} size="sm" className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm">
                  {submitting ? 'Menyimpan...' : 'Simpan Renovasi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Renovasi
