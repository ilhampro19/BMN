import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Archive, Wallet, CheckCircle2, AlertTriangle, AlertOctagon, Download, MapPin, Laptop, Building2, ShieldCheck, Printer, Wrench } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ITEM_API = `${API_BASE_URL}/item`

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage', bar: 'bg-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre', bar: 'bg-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust', bar: 'bg-rust' },
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const res = await axios.get(ITEM_API)
      setItems(res.data)
    } catch (err) {
      console.error('Gagal mengambil data dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  function formatRupiah(num) {
    if (num >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(1)} M`
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1)} Jt`
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)
  }

  function hitungPersenUmur(item) {
    const umurEkonomis = item.kategoriItem?.umurEkonomisTahun || 5
    const tahunSekarang = new Date().getFullYear()
    const umurAset = Math.max(0, tahunSekarang - item.tahunPerolehan)
    return Math.min(Math.round((umurAset / umurEkonomis) * 100), 100)
  }

  function handleExportPDF() {
    window.print()
  }

  // Statistik Nyata
  const totalAset = items.length
  const totalNilaiPerolehan = items.reduce((acc, curr) => acc + Number(curr.nilaiPerolehan || 0), 0)
  const baik = items.filter((i) => i.kondisi === 'baik').length
  const evaluasi = items.filter((i) => i.kondisi === 'evaluasi').length
  const perhatian = items.filter((i) => i.kondisi === 'perhatian').length
  const dipinjamWasrik = items.filter((i) => i.status_penggunaan === 'dipinjam_wasrik').length

  const statCards = [
    { label: 'Total Aset BMN Terdaftar', value: totalAset.toLocaleString('id-ID'), icon: Archive, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', bar: 'bg-blue-400' },
    { label: 'Total Nilai Perolehan', value: formatRupiah(totalNilaiPerolehan), icon: Wallet, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500', bar: 'bg-indigo-400' },
    { label: 'Kondisi Baik', value: baik, icon: CheckCircle2, iconBg: 'bg-sage-bg', iconColor: 'text-sage', bar: 'bg-sage' },
    { label: 'Sedang Tugas Wasrik', value: dipinjamWasrik, icon: Laptop, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', bar: 'bg-amber-500' },
    { label: 'Perlu Evaluasi / Perhatian', value: evaluasi + perhatian, icon: AlertOctagon, iconBg: 'bg-rust-bg', iconColor: 'text-rust', bar: 'bg-rust' },
  ]

  // Hitung Sebaran Berdasarkan Unit Kerja Itjen
  const unitMap = {}
  items.forEach((item) => {
    const unit = item.unit_kerja?.trim() || 'Sekretariat Itjen'
    unitMap[unit] = (unitMap[unit] || 0) + 1
  })

  const sebaranUnit = Object.entries(unitMap)
    .sort((a, b) => b[1] - a[1])
    .map(([unit, count]) => ({
      unit,
      count,
      width: `${Math.min(100, Math.round((count / Math.max(1, totalAset)) * 100))}%`,
    }))

  const asetTerbaru = items.slice(0, 5)
  const isPimpinan = user?.role === 'pimpinan'
  const isStaf = user?.role === 'staf'

  return (
    <Layout>
      {/* BREADCRUMB */}
      <p className="text-xs text-ink/40 mb-3 print:hidden">
        Sistem BMN <span className="mx-1">›</span>
        <span className="text-navy font-medium">
          {isStaf ? 'Dashboard Layanan Staf' : 'Dashboard Eksekutif Itjen Kemendagri'}
        </span>
      </p>

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              {isStaf ? 'Dashboard Pegawai / Staf Itjen' : 'Dashboard Manajemen BMN Itjen Kemendagri'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-navy/10 text-navy">
              Satker 010.05
            </span>
          </div>
          <p className="text-sm text-ink/50 mt-1">
            {isStaf
              ? 'Layanan monitoring inventaris BMN dan pengajuan servis pemeliharaan barang dinas'
              : 'Monitoring kekayaan negara, distribusi per Inspektorat Wilayah (Irwil), kondisi fisik, dan peminjaman tugas audit'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          {!isStaf && (
            <button
              onClick={() => navigate('/kir')}
              className="flex items-center gap-1.5 border border-black/10 bg-white text-navy font-medium text-xs px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Building2 size={14} /> Cetak KIR Ruangan
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-navy text-white text-xs px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors shadow-sm font-medium"
          >
            <Download size={14} /> Cetak Laporan PDF
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-black/10 rounded-xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-4`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <div className="text-[11px] text-ink/50 font-medium mb-1 truncate">{card.label}</div>
              <div className="text-xl font-bold text-ink mb-3">{loading ? '...' : card.value}</div>
              <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
                <div className={`h-full w-full ${card.bar} rounded-full`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* MAIN GRID: table + side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ASSET TABLE */}
        <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
            <div className="text-sm font-bold text-ink flex items-center gap-2">
              <span>Inventaris BMN Terkini</span>
              <span className="text-[10px] text-ink/40 font-mono font-normal">(5 Item Terbaru)</span>
            </div>
            <button
              onClick={() => navigate('/barang')}
              className="text-xs text-navy font-semibold hover:underline print:hidden"
            >
              Lihat Seluruh Aset →
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-black/10 text-ink/60 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3">Barang & NUP</th>
                <th className="px-4 py-3">Unit Kerja & Lokasi</th>
                <th className="px-4 py-3 w-32">% Umur Manfaat</th>
                <th className="px-4 py-3 w-20">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink/40">
                    Memuat ringkasan aset...
                  </td>
                </tr>
              )}
              {!loading && asetTerbaru.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink/40">
                    Belum ada data barang tercatat.
                  </td>
                </tr>
              )}
              {!loading &&
                asetTerbaru.map((aset, idx) => {
                  const meta = statusMeta[aset.kondisi] || statusMeta.baik
                  const persen = hitungPersenUmur(aset)
                  return (
                    <tr key={aset._id || aset.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3.5 text-center text-ink/40 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink text-sm">{aset.itemName}</div>
                        <div className="text-[10px] text-ink/40 font-mono">
                          {aset.itemCode} • NUP: {aset.nup || '0001'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-navy text-[11px]">{aset.unit_kerja || 'Sekretariat Itjen'}</div>
                        <div className="text-[10px] text-ink/50 truncate max-w-[160px]">{aset.lokasi_ruangan || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${meta.bar} rounded-full`}
                              style={{ width: `${Math.min(persen, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-ink/60 font-mono w-7 text-right">{persen}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* SIDE PANELS */}
        <div className="flex flex-col gap-6">
          {/* Sebaran Unit Kerja Itjen */}
          <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Building2 size={16} className="text-navy" /> Sebaran per Unit Kerja
              </div>
              <button
                onClick={() => navigate('/barang')}
                className="text-[11px] text-navy hover:underline font-medium print:hidden"
              >
                Detail →
              </button>
            </div>
            <p className="text-xs text-ink/50 mb-4">Distribusi BMN di lingkungan Itjen Kemendagri</p>
            <div className="space-y-2.5">
              {sebaranUnit.map((s) => (
                <div key={s.unit} className="bg-gray-50 rounded-lg p-2.5 border border-black/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-ink/80 truncate max-w-[180px]">{s.unit}</span>
                    <span className="text-xs font-bold text-navy">{s.count} Aset</span>
                  </div>
                  <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-navy rounded-full" style={{ width: s.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Pengajuan Servis Panel */}
          <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-navy/10 text-navy flex items-center justify-center font-bold text-xs">
                  <Wrench size={15} />
                </div>
                <p className="text-sm font-bold text-ink">Pengajuan Servis Aset</p>
              </div>
            </div>
            <p className="text-xs text-ink/60 mb-3">
              Ada kendala fisik pada aset BMN? Staf dapat mengajukan usulan perbaikan ke Operator TU.
            </p>
            <button
              onClick={() => navigate('/pengajuan-servis')}
              className="w-full text-xs bg-navy text-white hover:bg-navy-light transition-colors py-2 rounded-lg font-medium text-center print:hidden"
            >
              Buka Layanan Servis BMN →
            </button>
          </div>

          {/* Quick Wasrik Panel (Hanya untuk Operator, Admin & Pimpinan) */}
          {!isStaf && (
            <div className="bg-gradient-to-br from-navy to-slate-900 rounded-xl p-5 text-white flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Laptop size={18} className="text-gold" />
                  <p className="text-sm font-bold">Peminjaman Tugas Wasrik</p>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  Terdapat <strong>{dipinjamWasrik} aset BMN</strong> yang saat ini sedang dibawa untuk penugasan pengawasan reguler di daerah.
                </p>
              </div>
              <button
                onClick={() => navigate('/peminjaman-wasrik')}
                className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 rounded-lg font-medium text-center print:hidden border border-white/10"
              >
                Kelola Peminjaman & Cetak SIPB →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard