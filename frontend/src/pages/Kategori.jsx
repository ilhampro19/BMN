import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Pencil, Trash2, Building2, Car, Laptop, Armchair, Package, X,
} from 'lucide-react'

const API_URL = 'http://localhost:5000/api/kategori-item'

// Pick an icon based on keywords in the category name - purely visual, no data meaning
function getIconForKategori(name) {
  const lower = name.toLowerCase()
  if (lower.includes('bangunan')) return Building2
  if (lower.includes('kendaraan')) return Car
  if (lower.includes('komputer') || lower.includes('laptop')) return Laptop
  if (lower.includes('furnitur') || lower.includes('meja') || lower.includes('kursi')) return Armchair
  return Package
}

const emptyForm = {
  kategoriItemCode: '',
  kategoriItemName: '',
  umurEkonomisTahun: '',
  tarifPenyusutanPersen: '',
}

function Kategori() {
  const [kategoriList, setKategoriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null) // null = create mode, otherwise = edit mode
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchKategori()
  }, [])

  async function fetchKategori() {
    try {
      setLoading(true)
      const response = await axios.get(API_URL)
      setKategoriList(response.data)
    } catch (err) {
      setError('Gagal memuat data kategori')
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

  function openEditModal(kategori) {
    setEditingId(kategori._id)
    setForm({
      kategoriItemCode: kategori.kategoriItemCode,
      kategoriItemName: kategori.kategoriItemName,
      umurEkonomisTahun: kategori.umurEkonomisTahun,
      tarifPenyusutanPersen: kategori.tarifPenyusutanPersen,
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

    // Convert numeric fields from string (form input) to actual numbers
    const payload = {
      kategoriItemCode: form.kategoriItemCode,
      kategoriItemName: form.kategoriItemName,
      umurEkonomisTahun: Number(form.umurEkonomisTahun),
      tarifPenyusutanPersen: Number(form.tarifPenyusutanPersen),
    }

    try {
      if (editingId) {
        // Edit mode - update existing category
        await axios.put(`${API_URL}/${editingId}`, payload)
      } else {
        // Create mode - add new category
        await axios.post(API_URL, payload)
      }
      await fetchKategori()
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, nama) {
    const confirmed = window.confirm(`Hapus kategori "${nama}"? Tindakan ini tidak bisa dibatalkan.`)
    if (!confirmed) return

    try {
      await axios.delete(`${API_URL}/${id}`)
      await fetchKategori()
    } catch (err) {
      alert('Gagal menghapus kategori')
    }
  }

  return (
    <Layout>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Kategori Barang</h1>
          <p className="text-sm text-ink/50 mt-1">
            Kelola klasifikasi aset Barang Milik Negara (BMN) dan parameter penyusutan
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light">
          <Plus size={15} className="mr-1" /> Tambah Kategori
        </Button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-ink/45 mb-1">Total Kategori</div>
          <div className="text-2xl font-semibold text-ink">{kategoriList.length}</div>
        </div>
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-ink/45 mb-1">Metode Aktif</div>
          <div className="text-lg font-semibold text-ink">Garis Lurus</div>
        </div>
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-ink/45 mb-1">Regulasi Terkini</div>
          <div className="text-lg font-semibold text-ink">PMK 247</div>
        </div>
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-ink/45 mb-1">Status Validasi</div>
          <div className="text-lg font-semibold text-sage flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sage inline-block" /> Sinkron
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-ink/50">Memuat data...</p>}
      {error && <p className="text-sm text-rust">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-black/5">
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nama Kategori</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Kode</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Umur Ekonomis</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Tarif</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Metode</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kategoriList.map((kategori) => {
                const Icon = getIconForKategori(kategori.kategoriItemName)
                return (
                  <tr key={kategori._id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-blue-500" />
                        </div>
                        <span className="text-sm text-ink font-medium">{kategori.kategoriItemName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-ink/50 font-mono-ledger">{kategori.kategoriItemCode}</td>
                    <td className="px-5 py-4 text-sm text-ink/70">{kategori.umurEkonomisTahun} tahun</td>
                    <td className="px-5 py-4 text-sm text-ink/70">{kategori.tarifPenyusutanPersen}%</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        Garis Lurus
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(kategori)}
                          className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(kategori._id, kategori.kategoriItemName)}
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
        </div>
      )}

      {/* MODAL FORM - shown for both Create and Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
                <Label htmlFor="kategoriItemCode">Kode Kategori</Label>
                <Input
                  id="kategoriItemCode"
                  value={form.kategoriItemCode}
                  onChange={(e) => setForm({ ...form, kategoriItemCode: e.target.value })}
                  placeholder="Contoh: KMP-001"
                  required
                  className="mt-1"
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="kategoriItemName">Nama Kategori</Label>
                <Input
                  id="kategoriItemName"
                  value={form.kategoriItemName}
                  onChange={(e) => setForm({ ...form, kategoriItemName: e.target.value })}
                  placeholder="Contoh: Komputer / Laptop"
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <Label htmlFor="umurEkonomisTahun">Umur Ekonomis (tahun)</Label>
                  <Input
                    id="umurEkonomisTahun"
                    type="number"
                    value={form.umurEkonomisTahun}
                    onChange={(e) => setForm({ ...form, umurEkonomisTahun: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tarifPenyusutanPersen">Tarif (%/tahun)</Label>
                  <Input
                    id="tarifPenyusutanPersen"
                    type="number"
                    step="0.1"
                    value={form.tarifPenyusutanPersen}
                    onChange={(e) => setForm({ ...form, tarifPenyusutanPersen: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
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

export default Kategori