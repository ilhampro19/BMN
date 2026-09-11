import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  Archive,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Download,
  Laptop,
  Building2,
  ShieldCheck,
  Wrench,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ITEM_API = `${API_BASE_URL}/item`

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-500' },
  perhatian: { label: 'Perhatian', badge: 'bg-rose-50 text-rose-800 border-rose-200', bar: 'bg-rose-500' },
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
      return `Rp ${(num / 1_000_000_000).toFixed(2)} Milyar`
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1)} Juta`
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

  const persenBaik = totalAset > 0 ? Math.round((baik / totalAset) * 100) : 0
  const persenEvaluasi = totalAset > 0 ? Math.round((evaluasi / totalAset) * 100) : 0
  const persenPerhatian = totalAset > 0 ? Math.round((perhatian / totalAset) * 100) : 0

  const statCards = [
    {
      label: 'Total Aset BMN Terdaftar',
      value: totalAset.toLocaleString('id-ID') + ' Unit',
      subtext: 'Tercatat di SAKTI Kemendagri',
      icon: Archive,
      iconBg: 'bg-blue-50 text-blue-600',
      accent: 'border-l-4 border-l-blue-600',
    },
    {
      label: 'Nilai Buku Perolehan',
      value: formatRupiah(totalNilaiPerolehan),
      subtext: 'Akumulasi nilai aset negara',
      icon: Wallet,
      iconBg: 'bg-indigo-50 text-indigo-600',
      accent: 'border-l-4 border-l-indigo-600',
    },
    {
      label: 'Kondisi Fisik Baik',
      value: `${baik} Unit (${persenBaik}%)`,
      subtext: 'Siap operasional kantor',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      accent: 'border-l-4 border-l-emerald-600',
    },
    {
      label: 'Penugasan Wasrik (Daerah)',
      value: `${dipinjamWasrik} Unit`,
      subtext: 'Surat Izin Pinjam Barang aktif',
      icon: Laptop,
      iconBg: 'bg-amber-50 text-amber-600',
      accent: 'border-l-4 border-l-amber-600',
    },
    {
      label: 'Perlu Evaluasi & Servis',
      value: `${evaluasi + perhatian} Unit`,
      subtext: 'Prioritas pemeliharaan / renovasi',
      icon: AlertOctagon,
      iconBg: 'bg-rose-50 text-rose-600',
      accent: 'border-l-4 border-l-rose-600',
    },
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
      percent: Math.min(100, Math.round((count / Math.max(1, totalAset)) * 100)),
    }))

  const asetTerbaru = items.slice(0, 6)
  const isPimpinan = user?.role === 'pimpinan'
  const isStaf = user?.role === 'staf'

  // Format tanggal gaya jurnal/majalah
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 print:space-y-4">

        {/* ─── EDITORIAL MAGAZINE MASTHEAD ─── */}
        <div className="border-b border-gray-200/80 pb-6 pt-1">
          {/* Top meta ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy">Kementerian Dalam Negeri</span>
              <span>•</span>
              <span>Inspektorat Jenderal</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-gold font-bold">Satker 010.05</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={13} />
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Main Headline & Action Deck */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-semibold mb-2">
                <Sparkles size={13} className="text-amber-600" />
                {isStaf ? 'Portal Pelayanan Inventaris Staf' : isPimpinan ? 'Executive Summary Aset & BMN' : 'Ikhtisar Tata Kelola Aset Negara'}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-extrabold text-gray-900 font-display tracking-tight leading-tight">
                {isStaf
                  ? 'Katalog Inventaris & Layanan Pemeliharaan'
                  : 'Sistem Manajemen Aset & Kekayaan Negara'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mt-1.5 leading-relaxed">
                Pemantauan real-time kekayaan BMN di lingkungan Sekretariat dan Seluruh Inspektorat Wilayah (Irwil I s.d. Khusus), audit wasrik reguler, alur nota dinas, serta depresiasi nilai buku.
              </p>
            </div>

            {/* Print & Quick Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 print:hidden">
              {!isStaf && (
                <button
                  onClick={() => navigate('/kir')}
                  className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-navy font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Building2 size={15} /> Cetak KIR
                </button>
              )}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Download size={15} /> Unduh Laporan
              </button>
            </div>
          </div>
        </div>

        {/* ─── MAGAZINE STAT BENTO GRID (Responsive: 1-2 col Mobile, 3 col Tablet, 5 col Laptop/TV) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 2xl:gap-6">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 transition-all hover:shadow-md hover:-translate-y-0.5 ${card.accent}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon size={19} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-400">BMN</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 line-clamp-1">{card.label}</p>
                <h3 className="text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-gray-900 mt-1 tracking-tight font-display">
                  {loading ? '...' : card.value}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{card.subtext}</p>
              </div>
            )
          })}
        </div>

        {/* ─── MAGAZINE MULTI-COLUMN CONTENT GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 2xl:gap-8">

          {/* ═══ LEFT FEATURE STORY: ASSET TABLE & HEALTH RATIO (7-8 cols on lg, 8 cols on 2xl) ═══ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* Asset Table Container */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                    <span>Daftar Inventaris Terkini</span>
                    <span className="text-xs font-mono font-normal text-gray-400">({asetTerbaru.length} Item Terbaru)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Monitoring kode aset, NUP, unit kerja, dan sisa umur manfaat BMN.</p>
                </div>
                <button
                  onClick={() => navigate('/barang')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-amber-700 transition-colors cursor-pointer print:hidden"
                >
                  Lihat Semua Aset <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Table with responsive horizontal scroll container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">No</th>
                      <th className="py-3 px-4 min-w-[200px]">Nama Barang &amp; NUP</th>
                      <th className="py-3 px-4 min-w-[160px]">Unit Kerja &amp; Ruangan</th>
                      <th className="py-3 px-4 min-w-[140px]">% Umur Manfaat</th>
                      <th className="py-3 px-4 w-28 text-center">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Memuat data inventaris...
                        </td>
                      </tr>
                    ) : asetTerbaru.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Belum ada data barang tercatat.
                        </td>
                      </tr>
                    ) : (
                      asetTerbaru.map((aset, idx) => {
                        const meta = statusMeta[aset.kondisi] || statusMeta.baik
                        const persen = hitungPersenUmur(aset)

                        return (
                          <tr key={aset._id || aset.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-center text-gray-400 font-mono font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-gray-900 text-sm font-display">{aset.itemName}</div>
                              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                                {aset.itemCode} • NUP: {aset.nup || '0001'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-navy text-xs">{aset.unit_kerja || 'Sekretariat Itjen'}</div>
                              <div className="text-[11px] text-gray-500 truncate max-w-[170px] mt-0.5">
                                {aset.lokasi_ruangan || '-'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                                  <span>Umur Teknis</span>
                                  <span className="font-bold">{persen}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${meta.bar} rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min(persen, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Health Ratio Magazine Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 font-display">Proporsi Kelayakan Fisik BMN</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Evaluasi kesiapan pakai seluruh aset dinas Inspektorat Jenderal</p>
                </div>
                <span className="text-xs font-mono font-bold text-navy">{totalAset} Total Unit</span>
              </div>

              {/* Multi-segment magazine progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                <div style={{ width: `${persenBaik}%` }} className="h-full bg-emerald-500 transition-all" title={`Baik: ${baik}`} />
                <div style={{ width: `${persenEvaluasi}%` }} className="h-full bg-amber-500 transition-all" title={`Evaluasi: ${evaluasi}`} />
                <div style={{ width: `${persenPerhatian}%` }} className="h-full bg-rose-500 transition-all" title={`Perhatian: ${perhatian}`} />
              </div>

              {/* Legend stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-800">Kondisi Baik</span>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">{baik} Unit</p>
                  <span className="text-[10px] text-emerald-700 font-mono">{persenBaik}% dari total</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-800">Evaluasi Fisik</span>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">{evaluasi} Unit</p>
                  <span className="text-[10px] text-amber-700 font-mono">{persenEvaluasi}% dari total</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[11px] font-semibold text-rose-800">Perhatian Khusus</span>
                  <p className="text-lg font-bold text-rose-900 mt-0.5">{perhatian} Unit</p>
                  <span className="text-[10px] text-rose-700 font-mono">{persenPerhatian}% dari total</span>
                </div>
              </div>
            </div>

          </div>

          {/* ═══ RIGHT COLUMN: DISTRIBUTION & QUICK ACTION TILES (4-5 cols on lg, 4 cols on 2xl) ═══ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">

            {/* Distribution Card per Unit Kerja */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 font-display">Sebaran Unit Kerja</h4>
                    <p className="text-[11px] text-gray-500">Distribusi per Irwil / Sekretariat</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/barang')}
                  className="text-xs font-semibold text-navy hover:underline cursor-pointer print:hidden"
                >
                  Detail
                </button>
              </div>

              <div className="space-y-3">
                {sebaranUnit.slice(0, 6).map((s) => (
                  <div key={s.unit} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800 truncate max-w-[190px]">{s.unit}</span>
                      <span className="font-mono text-gray-500">{s.count} Unit</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy rounded-full transition-all duration-500"
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peminjaman Wasrik Card (Dark Magazine Accent) */}
            {!isStaf && (
              <div className="bg-gradient-to-br from-navy via-[#1b2a4e] to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                      <Laptop size={16} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold">
                      Audit Lapangan
                    </span>
                  </div>
                  <h4 className="text-base font-bold font-display">Penugasan Wasrik Daerah</h4>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Saat ini tercatat <strong className="text-white font-bold">{dipinjamWasrik} aset</strong> sedang dibawa auditor untuk pemeriksaan reguler di luar kantor.
                  </p>
                  <button
                    onClick={() => navigate('/peminjaman-wasrik')}
                    className="w-full mt-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer shadow-xs"
                  >
                    Buka Modul Wasrik &amp; SIPB →
                  </button>
                </div>
              </div>
            )}

            {/* Layanan Servis & Pemeliharaan Tile */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Wrench size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 font-display">Layanan Pemeliharaan BMN</h4>
                  <p className="text-[11px] text-gray-500">Usulan Nota Dinas Perbaikan</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ada kerusakan laptop, AC, kendaraan, atau fasilitas gedung? Ajukan nota dinas perbaikan berjenjang secara elektronik.
              </p>
              <button
                onClick={() => navigate('/pengajuan-servis')}
                className="w-full py-2.5 px-4 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-semibold transition-all text-center cursor-pointer shadow-xs"
              >
                Buat Usulan Servis Baru →
              </button>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  )
}

export default Dashboard