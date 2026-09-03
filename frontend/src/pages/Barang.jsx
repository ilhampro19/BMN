import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Eye, X, Search } from 'lucide-react'

const ITEM_API = 'http://localhost:5000/api/item'
const KATEGORI_API = 'http://localhost:5000/api/kategori-item'

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage', bar: 'bg-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre', bar: 'bg-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust', bar: 'bg-rust' },
}

const emptyForm = {
  kategoriItem: '',
  itemCode: '',
  itemName: '',
  tahunPerolehan: '',
  nilaiPerolehan: '',
  kondisi: 'baik',
}

function Barang() {
  const [itemList, setItemList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

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
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(item) {
    setEditingId(item._id)
    setForm({
      kategoriItem: item.kategoriItem?._id || '',
      itemCode: item.itemCode,
      itemName: item.itemName,
      tahunPerolehan: item.tahunPerolehan,
      nilaiPerolehan: item.nilaiPerolehan,
      kondisi: item.kondisi,
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
      itemName: form.itemName,
      tahunPerolehan: Number(form.tahunPerolehan),
      nilaiPerolehan: Number(form.nilaiPerolehan),
      kondisi: form.kondisi,
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  // Calculates how much of the asset's economic life has been used,
  // based on the category's umurEkonomisTahun
  function hitungPersenUmur(item) {
    const umurEkonomis = item.kategoriItem?.umurEkonomisTahun
    if (!umurEkonomis) return 0
    const tahunSekarang = new Date().getFullYear()
    const umurAset = tahunSekarang - item.tahunPerolehan
    return Math.min(Math.round((umurAset / umurEkonomis) * 100), 100)
  }

  const filteredItems = itemList.filter((item) =>
    item.itemName.toLowerCase().includes(search.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(search.toLowerCase())
  )

  const totalBaik = itemList.filter((i) => i.kondisi === 'baik').length
  const totalEvaluasi = itemList.filter((i) => i.kondisi === 'evaluasi').length
  const totalPerhatian = itemList.filter((i) => i.kondisi === 'perhatian').length

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Daftar Barang Milik Negara</h1>
          <p className="text-sm text-ink/50 mt-1">
            Kelola seluruh aset BMN Kementerian Dalam Negeri dengan transparansi penuh
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light">
          <Plus size={15} className="mr-1" /> Tambah Barang
        </Button>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama barang atau kode..."
          className="w-full bg-white border border-black/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-navy/30"
        />
      </div>

      {loading && <p className="text-sm text-ink/50">Memuat data...</p>}
      {error && <p className="text-sm text-rust">{error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm mb-5">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-black/5">
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-12">No</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nama Barang</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Thn Perolehan</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-40">% Umur</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const meta = statusMeta[item.kondisi] || statusMeta.baik
                  const persenUmur = hitungPersenUmur(item)
                  return (
                    <tr key={item._id} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-4 text-xs text-ink/40">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-ink font-medium">{item.itemName}</div>
                        <div className="text-xs text-ink/40 font-mono-ledger">{item.itemCode}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink/60">
                        {item.kategoriItem?.kategoriItemName || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink/70">{item.tahunPerolehan}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                            <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${persenUmur}%` }} />
                          </div>
                          <span className="text-xs text-ink/50 w-9 text-right">{persenUmur}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.itemName)}
                            className="p-1.5 rounded hover:bg-rust-bg text-ink/50 hover:text-rust transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 text-xs text-ink/40 border-t border-black/5">
              Menampilkan {filteredItems.length} dari {itemList.length} entri
            </div>
          </div>

          {/* STATUS SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-black/5 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-sage-bg flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-sage" />
              </div>
              <div>
                <div className="text-xs text-ink/50">Aset Kondisi Baik</div>
                <div className="text-lg font-semibold text-ink">{totalBaik}</div>
              </div>
            </div>
            <div className="bg-white border border-black/5 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-ochre-bg flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-ochre" />
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Evaluasi</div>
                <div className="text-lg font-semibold text-ink">{totalEvaluasi}</div>
              </div>
            </div>
            <div className="bg-white border border-black/5 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-rust-bg flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rust" />
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Perhatian</div>
                <div className="text-lg font-semibold text-ink">{totalPerhatian}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">
                {editingId ? 'Edit Barang' : 'Tambah Barang Baru'}
              </h2>
              <button onClick={closeModal} className="text-ink/40 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <p className="text-sm text-rust bg-rust-bg p-2 rounded mb-4">{formError}</p>
              )}

              <div className="mb-4">
                <Label htmlFor="kategoriItem">Kategori</Label>
                <select
                  id="kategoriItem"
                  value={form.kategoriItem}
                  onChange={(e) => setForm({ ...form, kategoriItem: e.target.value })}
                  required
                  className="mt-1 w-full h-9 border border-input rounded-md px-3 text-sm bg-transparent outline-none"
                >
                  <option value="" disabled>Pilih kategori...</option>
                  {kategoriList.map((k) => (
                    <option key={k._id} value={k._id}>{k.kategoriItemName}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <Label htmlFor="itemCode">Kode Barang</Label>
                <Input
                  id="itemCode"
                  value={form.itemCode}
                  onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                  placeholder="Contoh: KMD-LTP-001-2024"
                  required
                  className="mt-1"
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="itemName">Nama Barang</Label>
                <Input
                  id="itemName"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="Contoh: Laptop Dell Latitude 5420"
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="tahunPerolehan">Tahun Perolehan</Label>
                  <Input
                    id="tahunPerolehan"
                    type="number"
                    value={form.tahunPerolehan}
                    onChange={(e) => setForm({ ...form, tahunPerolehan: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nilaiPerolehan">Nilai (Rp)</Label>
                  <Input
                    id="nilaiPerolehan"
                    type="number"
                    value={form.nilaiPerolehan}
                    onChange={(e) => setForm({ ...form, nilaiPerolehan: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="kondisi">Kondisi</Label>
                <select
                  id="kondisi"
                  value={form.kondisi}
                  onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                  className="mt-1 w-full h-9 border border-input rounded-md px-3 text-sm bg-transparent outline-none"
                >
                  <option value="baik">Baik</option>
                  <option value="evaluasi">Evaluasi</option>
                  <option value="perhatian">Perhatian</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-navy hover:bg-navy-light">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Barang