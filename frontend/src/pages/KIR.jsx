import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Printer, Building2, MapPin, Search, CheckCircle2, AlertTriangle, AlertOctagon, Download } from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import { UNIT_KERJA_OPTIONS, RUANGAN_GEDUNG_ITJEN } from '../lib/constants'

const ITEM_API = `${API_BASE_URL}/item`

function KIR() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState('Semua Unit Kerja')
  const [selectedRoom, setSelectedRoom] = useState(RUANGAN_GEDUNG_ITJEN[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const res = await axios.get(ITEM_API)
      setItems(res.data)
      // Default pilih ruangan pertama jika ada
      const rooms = [...new Set(res.data.map((i) => i.lokasi_ruangan).filter(Boolean))]
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0])
      }
    } catch (err) {
      console.error('Gagal memuat data KIR', err)
    } finally {
      setLoading(false)
    }
  }

  // Daftar ruangan resmi dan unik dari data
  const availableRooms = [...new Set([...RUANGAN_GEDUNG_ITJEN, ...items.map((i) => i.lokasi_ruangan).filter(Boolean)])]

  // Filter items berdasarkan unit kerja dan ruangan
  const filteredItems = items.filter((item) => {
    const matchUnit = selectedUnit === 'Semua Unit Kerja' || item.unit_kerja === selectedUnit
    const matchRoom = !selectedRoom || item.lokasi_ruangan === selectedRoom
    const matchSearch =
      !search ||
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      (item.merk_tipe && item.merk_tipe.toLowerCase().includes(search.toLowerCase()))
    return matchUnit && matchRoom && matchSearch
  })

  // PJ Ruangan dari barang pertama di ruangan ini
  const pjRuangan = filteredItems[0]?.penanggung_jawab || 'Pegawai Penanggung Jawab Ruangan'

  function handlePrint() {
    window.print()
  }

  function handleExportCSV() {
    const headers = [
      'No',
      'Kode Barang',
      'NUP',
      'Kode Akun SAKTI',
      'Nama Barang',
      'Merk/Tipe',
      'Nomor Seri',
      'Tahun Perolehan',
      'Nilai Perolehan (Rp)',
      'Kondisi',
      'Unit Kerja',
      'Ruangan',
      'Penanggung Jawab',
    ]

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${item.itemCode || ''}"`,
      `"${item.nup || '0001'}"`,
      `"${item.kode_bmn || '3.05.01.04.001'}"`,
      `"${(item.itemName || '').replace(/"/g, '""')}"`,
      `"${(item.merk_tipe || '').replace(/"/g, '""')}"`,
      `"${(item.nomor_seri || '').replace(/"/g, '""')}"`,
      item.tahunPerolehan || '',
      item.nilaiPerolehan || 0,
      `"${item.kondisi || 'baik'}"`,
      `"${item.unit_kerja || 'Sekretariat Itjen'}"`,
      `"${(item.lokasi_ruangan || '').replace(/"/g, '""')}"`,
      `"${(item.penanggung_jawab || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const roomSlug = (selectedRoom || 'Semua_Ruangan').replace(/[^a-zA-Z0-9]/g, '_')
    a.download = `KIR_${roomSlug}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)
  }

  return (
    <Layout>
      {/* BREADCRUMB - HIDDEN IN PRINT */}
      <div className="print:hidden">
        <p className="text-xs text-ink/40 mb-2">
          Aplikasi BMN Itjen <span className="mx-1">›</span>
          <span className="text-navy font-medium">Kartu Inventaris Ruangan (KIR)</span>
        </p>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <Building2 className="text-navy" size={26} />
              Kartu Inventaris Ruangan (KIR)
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              Daftar resmi inventaris BMN per ruangan kerja sesuai tata kelola Itjen Kemendagri
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Unduh daftar inventaris ruangan ke CSV / Excel"
            >
              <Download size={14} /> Export CSV
            </button>
            <Button
              onClick={handlePrint}
              className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 shadow-sm text-xs"
            >
              <Printer size={15} /> Cetak Lembar KIR (A4)
            </Button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-ink/60 block mb-1">Unit Kerja:</label>
            <SearchableSelect
              value={selectedUnit}
              onChange={(val) => setSelectedUnit(val)}
              options={UNIT_KERJA_OPTIONS.map((u) => ({
                value: u,
                label: u,
              }))}
              placeholder="Pilih Unit Kerja..."
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-semibold text-ink/60 block mb-1">Pilih Ruangan:</label>
            <SearchableSelect
              value={selectedRoom}
              onChange={(val) => setSelectedRoom(val)}
              options={[
                { value: '', label: '-- Semua Ruangan --' },
                ...availableRooms.map((r) => ({
                  value: r,
                  label: r,
                })),
              ]}
              placeholder="Pilih Ruangan..."
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-ink/60 block mb-1">Cari Barang:</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Nama / Kode BMN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-black/10 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW (PRINT AREA) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-black/10 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* KOP RESMI DOKUMEN ITJEN KEMENDAGRI */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-6">
          <img src={logoKemendagri} alt="Logo Kemendagri" className="w-20 h-20 object-contain shrink-0" />
          <div className="text-center flex-1 pr-16">
            <p className="text-sm font-bold tracking-widest uppercase">KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA</p>
            <p className="text-lg font-extrabold uppercase tracking-tight text-navy">INSPEKTORAT JENDERAL</p>
            <p className="text-xs text-ink/70">
              Jalan Medan Merdeka Timur No. 8, Jakarta Pusat 10110 | Telp: (021) 3450038
            </p>
            <p className="text-xs text-ink/60 font-medium">Laman: itjen.kemendagri.go.id</p>
          </div>
        </div>

        {/* JUDUL LEMBAR KIR */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase tracking-wider underline">KARTU INVENTARIS RUANGAN (KIR)</h2>
          <p className="text-xs text-ink/60 font-mono mt-0.5">Kode Satker: 010.05.0001 (Inspektorat Jenderal)</p>
        </div>

        {/* META DATA RUANGAN */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-gray-50 p-4 rounded-lg border border-black/10 print:bg-transparent print:border-none print:p-0 print:mb-4">
          <div>
            <div className="flex mb-1">
              <span className="w-36 text-ink/60 font-medium">Unit Kerja Eselon I:</span>
              <span className="font-semibold text-ink">Inspektorat Jenderal</span>
            </div>
            <div className="flex mb-1">
              <span className="w-36 text-ink/60 font-medium">Unit Kerja / Bagian:</span>
              <span className="font-semibold text-navy">{selectedUnit}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-ink/60 font-medium">Nama Ruangan / Lokasi:</span>
              <span className="font-bold text-ink">{selectedRoom || 'Semua Ruangan'}</span>
            </div>
          </div>
          <div>
            <div className="flex mb-1">
              <span className="w-36 text-ink/60 font-medium">Tahun Anggaran:</span>
              <span className="font-semibold text-ink">{new Date().getFullYear()}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-36 text-ink/60 font-medium">Total Item Barang:</span>
              <span className="font-bold text-navy">{filteredItems.length} Unit</span>
            </div>
            <div className="flex">
              <span className="w-36 text-ink/60 font-medium">Total Nilai Perolehan:</span>
              <span className="font-semibold text-ink">
                {formatRupiah(filteredItems.reduce((sum, i) => sum + Number(i.nilaiPerolehan || 0), 0))}
              </span>
            </div>
          </div>
        </div>

        {/* TABEL INVENTARIS BMN */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-black/30 print:text-[10px]">
            <thead>
              <tr className="bg-navy text-white text-center font-semibold uppercase tracking-wider print:bg-gray-200 print:text-black">
                <th className="border border-black/30 p-2 w-8">No</th>
                <th className="border border-black/30 p-2">Kode Barang & NUP</th>
                <th className="border border-black/30 p-2">Nama Barang / Jenis Aset</th>
                <th className="border border-black/30 p-2">Merk / Tipe</th>
                <th className="border border-black/30 p-2">No. Seri (SN)</th>
                <th className="border border-black/30 p-2 w-14">Tahun</th>
                <th className="border border-black/30 p-2 w-20">Kondisi</th>
                <th className="border border-black/30 p-2">Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-6 text-ink/40 border border-black/30">
                    Tidak ada barang inventaris terdaftar pada ruangan ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id || item._id} className="hover:bg-gray-50">
                    <td className="border border-black/30 p-2 text-center font-mono">{index + 1}</td>
                    <td className="border border-black/30 p-2 font-mono font-medium">
                      {item.itemCode}
                      <span className="block text-[10px] text-ink/60">NUP: {item.nup || '0001'}</span>
                    </td>
                    <td className="border border-black/30 p-2 font-semibold text-ink">{item.itemName}</td>
                    <td className="border border-black/30 p-2">{item.merk_tipe || '-'}</td>
                    <td className="border border-black/30 p-2 font-mono">{item.nomor_seri || '-'}</td>
                    <td className="border border-black/30 p-2 text-center">{item.tahunPerolehan}</td>
                    <td className="border border-black/30 p-2 text-center font-semibold capitalize">
                      <span
                        className={
                          item.kondisi === 'baik'
                            ? 'text-emerald-700'
                            : item.kondisi === 'evaluasi'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {item.kondisi}
                      </span>
                    </td>
                    <td className="border border-black/30 p-2 text-ink/80">{item.penanggung_jawab || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TANDA TANGAN LEGALITAS KEMENDAGRI */}
        <div className="mt-12 grid grid-cols-2 text-center text-xs break-inside-avoid">
          <div>
            <p className="text-ink/60 mb-1">Mengetahui,</p>
            <p className="font-semibold text-ink">Kasubbag Pengelolaan BMN & Rumah Tangga</p>
            <p className="text-ink/50 text-[11px] mb-20">Sekretariat Inspektorat Jenderal</p>
            <p className="font-bold underline text-ink">( .................................................... )</p>
            <p className="text-[11px] text-ink/60 font-mono">NIP. .............................................</p>
          </div>
          <div>
            <p className="text-ink/60 mb-1">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-semibold text-ink">Penanggung Jawab Ruangan</p>
            <p className="text-ink/50 text-[11px] mb-20">{selectedRoom || 'Ruangan Terkait'}</p>
            <p className="font-bold underline text-ink">
              ( {pjRuangan.includes('(') ? pjRuangan.split('(')[0].trim() : pjRuangan} )
            </p>
            <p className="text-[11px] text-ink/60 font-mono">NIP. .............................................</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default KIR
