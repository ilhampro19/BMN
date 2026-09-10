import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Calculator, ShieldAlert } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const PENYUSUTAN_API = `${API_BASE_URL}/penyusutan`
const ITEM_API = `${API_BASE_URL}/item`

const TAHUN_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust' },
}

function Penyusutan() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [riwayat, setRiwayat] = useState([])
  const [itemList, setItemList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedItem, setSelectedItem] = useState('')
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear())
  const [calculating, setCalculating] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [penyusutanRes, itemRes] = await Promise.all([
        axios.get(PENYUSUTAN_API),
        axios.get(ITEM_API),
      ])
      setRiwayat(penyusutanRes.data)
      setItemList(itemRes.data)
    } catch (err) {
      setError('Gagal memuat data penyusutan')
    } finally {
      setLoading(false)
    }
  }

  async function handleHitung(e) {
    e.preventDefault()
    setFormError('')

    if (!selectedItem) {
      setFormError('Pilih barang terlebih dahulu')
      return
    }

    setCalculating(true)
    try {
      await axios.post(PENYUSUTAN_API, {
        item: selectedItem,
        tahun: Number(selectedTahun),
      })
      await fetchAll()
      setSelectedItem('')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menghitung penyusutan')
    } finally {
      setCalculating(false)
    }
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink">Perhitungan Penyusutan</h1>
        <p className="text-sm text-ink/50 mt-1">
          Hitung nilai buku aset berdasarkan metode garis lurus
        </p>
      </div>

      {/* CALCULATION FORM */}
      {isAdmin ? (
        <div className="bg-white border border-black/5 rounded-xl p-6 shadow-sm mb-8 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={16} className="text-navy" />
            <h2 className="text-sm font-semibold text-ink">Hitung Penyusutan Baru</h2>
          </div>

          <form onSubmit={handleHitung} className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="item">Barang</Label>
              <SearchableSelect
                id="item"
                value={selectedItem}
                onChange={(val) => setSelectedItem(val)}
                options={itemList.map((item) => ({
                  value: item._id || item.id,
                  label: `${item.itemName} (${item.itemCode})`,
                }))}
                placeholder="Pilih barang..."
                required
                className="mt-1"
              />
            </div>

            <div className="w-36">
              <Label htmlFor="tahun">Tahun</Label>
              <SearchableSelect
                id="tahun"
                value={selectedTahun}
                onChange={(val) => setSelectedTahun(Number(val))}
                options={TAHUN_OPTIONS.map((tahun) => ({
                  value: tahun,
                  label: String(tahun),
                }))}
                placeholder="Tahun..."
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={calculating} className="bg-navy hover:bg-navy-light">
              {calculating ? 'Menghitung...' : 'Hitung & Simpan'}
            </Button>
          </form>

          {formError && (
            <p className="text-sm text-rust bg-rust-bg p-2 rounded mt-3">{formError}</p>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-center gap-3 text-blue-900 text-xs">
          <ShieldAlert size={18} className="text-blue-600 shrink-0" />
          <span>
            <b>Mode Peninjauan Laporan:</b> Perhitungan dan penetapan nilai penyusutan BMN dikelola terpusat oleh Pengelola BMN (Subbag Perlengkapan & Rumah Tangga).
          </span>
        </div>
      )}

      {/* HISTORY TABLE */}
      <p className="text-sm font-semibold text-ink mb-3">Riwayat Penyusutan</p>

      {loading && <p className="text-sm text-ink/50">Memuat data...</p>}
      {error && <p className="text-sm text-rust">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-black/5">
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nama Barang</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Tahun</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nilai Awal</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Beban Penyusutan</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nilai Buku Akhir</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">% Umur</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink/40">
                    Belum ada riwayat penyusutan
                  </td>
                </tr>
              )}
              {riwayat.map((r) => {
                const meta = statusMeta[r.status] || statusMeta[r.statusKondisi] || statusMeta.baik
                const nilaiAwal = r.nilaiAwal ?? r.nilaiAwalTahun ?? 0
                const beban = r.bebanPenyusutan ?? 0
                const nilaiBuku = r.nilaiBukuAkhir ?? 0
                const persen = r.persenUmur ?? r.persenUmurTerpakai ?? 0

                return (
                  <tr key={r._id || r.id} className="border-b border-black/5 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="text-sm text-ink font-medium">{r.item?.itemName || '—'}</div>
                      <div className="text-xs text-ink/40 font-mono-ledger">
                        {r.item?.kode_bmn ? `SAKTI: ${r.item.kode_bmn}` : r.item?.itemCode} {r.item?.nup ? `(NUP ${r.item.nup})` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink/70 font-mono">{r.tahun}</td>
                    <td className="px-5 py-4 text-sm text-ink/70">{formatRupiah(nilaiAwal)}</td>
                    <td className="px-5 py-4 text-sm text-rust font-medium">-{formatRupiah(beban)}</td>
                    <td className="px-5 py-4 text-sm text-ink font-semibold">{formatRupiah(nilaiBuku)}</td>
                    <td className="px-5 py-4 text-sm text-ink/70 font-mono">{Math.round(persen)}%</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}

export default Penyusutan