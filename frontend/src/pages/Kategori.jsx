import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Pencil, Trash2, Building2, Car, Laptop, Armchair, Package, X, ShieldAlert, Tag,
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const API_URL = `${API_BASE_URL}/kategori-item`

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
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

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
    setEditingId(kategori.id || kategori._id)
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
        {isAdmin ? (
          <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light">
            <Plus size={15} className="mr-1" /> Tambah Kategori
          </Button>
        ) : (
          <div className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-ink/50 border border-black/5 font-medium flex items-center gap-1.5">
            <ShieldAlert size={14} /> Dikelola oleh Admin BMN
          </div>
        )}
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
                {isAdmin && <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {kategoriList.map((kategori) => {
                const Icon = getIconForKategori(kategori.kategoriItemName)
                return (
                  <tr key={kategori._id || kategori.id} className="border-b border-black/5 last:border-0">
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
                    {isAdmin && (
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
                            onClick={() => handleDelete(kategori._id || kategori.id, kategori.kategoriItemName)}
                            className="p-1.5 rounded hover:bg-rust-bg text-ink/50 hover:text-rust transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM - shown for both Create and Edit (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  <Tag size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editingId ? 'Edit Kategori BMN' : 'Tambah Kategori BMN Baru'}
                  </h2>
                  <p className="text-[11px] text-slate-500">Master tabel kategori untuk masa manfaat & persentase penyusutan aset</p>
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
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs">
                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{formError}</p>
                )}

                {/* Kode Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="kategoriItemCode" className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                    Kode Kategori <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-7">
                    <Input
                      id="kategoriItemCode"
                      value={form.kategoriItemCode}
                      onChange={(e) => setForm({ ...form, kategoriItemCode: e.target.value })}
                      placeholder="Contoh: KMP-001"
                      required
                      className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Nama Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="kategoriItemName" className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                    Nama Kategori <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-7">
                    <Input
                      id="kategoriItemName"
                      value={form.kategoriItemName}
                      onChange={(e) => setForm({ ...form, kategoriItemName: e.target.value })}
                      placeholder="Contoh: Komputer / Laptop"
                      required
                      className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Umur Ekonomis */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="umurEkonomisTahun" className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                    Masa Manfaat (Tahun) <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-7">
                    <Input
                      id="umurEkonomisTahun"
                      type="number"
                      min="1"
                      value={form.umurEkonomisTahun}
                      onChange={(e) => setForm({ ...form, umurEkonomisTahun: e.target.value })}
                      placeholder="Contoh: 4"
                      required
                      className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Tarif Penyusutan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                  <label htmlFor="tarifPenyusutanPersen" className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                    Tarif Penyusutan (%/Tahun) <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <div className="sm:col-span-7">
                    <Input
                      id="tarifPenyusutanPersen"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={form.tarifPenyusutanPersen}
                      onChange={(e) => setForm({ ...form, tarifPenyusutanPersen: e.target.value })}
                      placeholder="Contoh: 25"
                      required
                      className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} size="sm" className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm">
                  {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Kategori')}
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