import Layout from '../components/Layout'
import { Archive, Wallet, CheckCircle2, AlertTriangle, AlertOctagon, Download, Plus, MapPin } from 'lucide-react'

const stats = {
  totalAset: 1284,
  nilaiBuku: 'Rp 114 M',
  baik: 872,
  evaluasi: 287,
  perhatian: 125,
}

const asetTerbaru = [
  { no: '001', nama: 'Gedung Kantor Blok A', kategori: 'Bangunan', persenUmur: 37.5, status: 'baik' },
  { no: '002', nama: 'Toyota Innova B 1234 RFS', kategori: 'Kendaraan', persenUmur: 62.5, status: 'evaluasi' },
  { no: '003', nama: 'Laptop Dell Latitude', kategori: 'Komputer', persenUmur: 100, status: 'perhatian' },
  { no: '004', nama: 'Meja Kerja Kayu Jati', kategori: 'Furnitur', persenUmur: 30, status: 'baik' },
]

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage', bar: 'bg-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre', bar: 'bg-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust', bar: 'bg-rust' },
}

const statCards = [
  { label: 'Total aset', value: stats.totalAset.toLocaleString('id-ID'), icon: Archive, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', bar: 'bg-blue-400' },
  { label: 'Nilai buku', value: stats.nilaiBuku, icon: Wallet, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500', bar: 'bg-indigo-400' },
  { label: 'Baik', value: stats.baik, icon: CheckCircle2, iconBg: 'bg-sage-bg', iconColor: 'text-sage', bar: 'bg-sage' },
  { label: 'Evaluasi', value: stats.evaluasi, icon: AlertTriangle, iconBg: 'bg-ochre-bg', iconColor: 'text-ochre', bar: 'bg-ochre' },
  { label: 'Perhatian', value: stats.perhatian, icon: AlertOctagon, iconBg: 'bg-rust-bg', iconColor: 'text-rust', bar: 'bg-rust' },
]

// Dummy distribution data - not a real map, just a styled visual summary
const sebaranAset = [
  { blok: 'Blok A - Ruang Arsip', unit: 612, width: '80%' },
  { blok: 'Blok B - Gudang Pusat', unit: 415, width: '54%' },
]

function Dashboard() {
  return (
    <Layout>
      {/* BREADCRUMB */}
      <p className="text-xs text-ink/40 mb-4">
        Aplikasi Utama <span className="mx-1">›</span>
        <span className="text-navy font-medium">Dashboard Overview</span>
      </p>

      {/* HEADER ROW */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard ringkasan Badan Milik Negara (BMN)</h1>
          <p className="text-sm text-ink/50 mt-1">Monitor aset dan status kondisi berdasarkan kategori</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 border border-black/10 bg-white text-ink/70 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export PDF
          </button>
          <button className="flex items-center gap-2 bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
            <Plus size={15} /> Register Aset Baru
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-black/5 rounded-xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-4`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <div className="text-xs text-ink/45 mb-1">{card.label}</div>
              <div className="text-2xl font-semibold text-ink mb-3">{card.value}</div>
              <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
                <div className={`h-full w-2/3 ${card.bar} rounded-full`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* MAIN GRID: table + side panels */}
      <div className="grid grid-cols-3 gap-5">
        {/* ASSET TABLE */}
        <div className="col-span-2 bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-black/5">
            <div className="text-sm font-semibold text-ink">Aset terbaru</div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-black/5">
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-14">No.</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Nama Barang</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3">Kategori</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-44">% Umur</th>
                <th className="text-left text-xs font-semibold text-ink/50 px-5 py-3 w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {asetTerbaru.map((aset) => {
                const meta = statusMeta[aset.status]
                return (
                  <tr key={aset.no} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-4 text-xs text-ink/40">{aset.no}</td>
                    <td className="px-5 py-4 text-sm text-ink font-medium">{aset.nama}</td>
                    <td className="px-5 py-4 text-sm text-ink/60">{aset.kategori}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meta.bar} rounded-full`}
                            style={{ width: `${Math.min(aset.persenUmur, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink/50 w-9 text-right">{aset.persenUmur}%</span>
                      </div>
                    </td>
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

        {/* SIDE PANELS */}
        <div className="flex flex-col gap-5">
          {/* Decorative distribution panel - not a real map */}
          <div className="bg-gray-100 border border-black/5 rounded-xl p-5 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(circle, #00000022 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-1">
                <MapPin size={14} /> Sebaran Aset
              </div>
              <p className="text-xs text-ink/45 mb-5">Distribusi wilayah kantor pusat</p>
              <div className="space-y-2">
                {sebaranAset.map((s) => (
                  <div key={s.blok} className="bg-white rounded-lg px-3 py-2.5 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-ink/70">{s.blok}</span>
                      <span className="text-[11px] font-semibold text-navy">{s.unit} Unit</span>
                    </div>
                    <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-navy rounded-full" style={{ width: s.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insight panel */}
          <div className="bg-navy rounded-xl p-5 text-white flex-1">
            <p className="text-sm font-semibold mb-2">Insight Efisiensi</p>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              {stats.perhatian} aset ({((stats.perhatian / stats.totalAset) * 100).toFixed(1)}%) telah
              melewati masa umur manfaat teknis. Rekomendasi lelang atau hibah dapat mulai disiapkan.
            </p>
            <button className="text-xs bg-white/10 hover:bg-white/15 transition-colors px-3 py-2 rounded-lg font-medium">
              Review Rekomendasi →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard