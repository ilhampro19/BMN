import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  X,
  Search,
  Shield,
  ArrowRight,
  Laptop,
  Car,
  Calendar,
  UserCheck,
  XCircle,
  AlertCircle,
  Download,
  Key,
  FileCheck2,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { showAlert, showToast } from '../lib/alerts'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

const WASRIK_API = `${API_BASE_URL}/peminjaman-wasrik`
const ITEM_API = `${API_BASE_URL}/item`

function angkaKeTerbilang(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  angka = parseInt(angka, 10) || 0
  if (angka < 12) return bilangan[angka]
  if (angka < 20) return angkaKeTerbilang(angka - 10) + ' Belas'
  if (angka < 100) return angkaKeTerbilang(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 !== 0 ? ' ' + angkaKeTerbilang(angka % 10) : '')
  if (angka < 200) return 'Seratus' + (angka % 100 !== 0 ? ' ' + angkaKeTerbilang(angka % 100) : '')
  if (angka < 1000) return angkaKeTerbilang(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 !== 0 ? ' ' + angkaKeTerbilang(angka % 100) : '')
  if (angka < 2000) return 'Seribu' + (angka % 1000 !== 0 ? ' ' + angkaKeTerbilang(angka % 1000) : '')
  if (angka < 1000000) return angkaKeTerbilang(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 !== 0 ? ' ' + angkaKeTerbilang(angka % 1000) : '')
  return String(angka)
}

function formatTanggalTerbilang(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const namaHari = hariNames[d.getDay()]
  const tgl = d.getDate()
  const namaBulan = bulanNames[d.getMonth()]
  const thn = d.getFullYear()

  return `Pada hari ini ${namaHari} Tanggal ${angkaKeTerbilang(tgl)} Bulan ${namaBulan} Tahun ${angkaKeTerbilang(thn)}, yang bertandatangan dibawah ini masing-masing :`
}

const emptyWasrikForm = {
  tipe_peminjaman: 'wasrik',
  item_id: '',
  nama_peminjam: '',
  nip_peminjam: '',
  jabatan_tim: 'Anggota Tim Wasrik',
  no_surat_tugas: '',
  tujuan_wilayah: '',
  tanggal_berangkat: new Date().toISOString().split('T')[0],
  tanggal_kembali: '',
  keterangan: '',
}

const emptyKendaraanForm = {
  tipe_peminjaman: 'kendaraan',
  item_id: '',
  jenis_kendaraan: 'Sepeda Motor',
  merk: '',
  tipe: '',
  warna: 'Hitam',
  nomor_polisi: '',
  no_rangka: '',
  no_mesin: '',
  tahun_pembuatan: String(new Date().getFullYear()),
  kelengkapan: ['Kunci Utama', 'Helm', 'STNK'],
  nama_peminjam: '',
  nip_peminjam: '',
  jabatan_tim: 'PPUPD Ahli Pertama Pada Bagian Umum dan Keuangan',
  no_surat_tugas: '',
  tujuan_wilayah: 'Operasional Kedinasan Itjen Kemendagri',
  tanggal_berangkat: new Date().toISOString().split('T')[0],
  tanggal_kembali: '',
  keterangan: '',
  pihak_pertama_nama: 'Andi Agung Febrianto, S.STP, M.Kessos',
  pihak_pertama_nip: '19900217 201206 1 002',
  pihak_pertama_jabatan: 'Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri',
  mengetahui_nama: 'Dr. Ir. Bachril Bakri, M.App.Sc',
  mengetahui_nip: '19661122 199303 1 001',
  mengetahui_jabatan: 'Sekretaris Inspektorat Jenderal',
}

function PeminjamanWasrik() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isAuditor = user?.role === 'auditor'
  const isOperator = user?.role === 'operator'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabQuery = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabQuery === 'kendaraan' ? 'kendaraan' : 'wasrik')

  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab === 'kendaraan' || currentTab === 'wasrik') {
      setActiveTab(currentTab)
    } else if (!currentTab) {
      setActiveTab('wasrik')
    }
  }, [searchParams])

  function handleTabChange(tabKey) {
    setActiveTab(tabKey)
    setSearchParams({ tab: tabKey })
    setSearch('')
  }
  const [loans, setLoans] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Wasrik
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyWasrikForm)

  // Modal Kendaraan
  const [showKendaraanModal, setShowKendaraanModal] = useState(false)
  const [kendaraanForm, setKendaraanForm] = useState(emptyKendaraanForm)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal Cetak Dokumen SIPB / BAST Kendaraan
  const [printDoc, setPrintDoc] = useState(null)
  // Modal Cetak BAST Pengembalian Barang
  const [printReturnDoc, setPrintReturnDoc] = useState(null)

  // Modal Pengembalian
  const [returnItem, setReturnItem] = useState(null)
  const [kondisiKembali, setKondisiKembali] = useState('baik')
  const [catatanKembali, setCatatanKembali] = useState('')
  const [returnLoading, setReturnLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [wasrikRes, itemRes] = await Promise.all([
        axios.get(WASRIK_API),
        axios.get(ITEM_API),
      ])
      setLoans(wasrikRes.data)
      setItems(itemRes.data)
    } catch (err) {
      console.error('Gagal memuat data peminjaman', err)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    if (activeTab === 'kendaraan') {
      openCreateKendaraanModal()
      return
    }
    setForm({
      ...emptyWasrikForm,
      nama_peminjam: isAuditor ? user.name : '',
      nip_peminjam: isAuditor ? '198204122006042001' : '',
    })
    setFormError('')
    setShowModal(true)
  }

  function openCreateKendaraanModal() {
    setKendaraanForm({
      ...emptyKendaraanForm,
      nama_peminjam: '',
      nip_peminjam: '',
    })
    setFormError('')
    setShowKendaraanModal(true)
  }

  function handleKendaraanItemSelect(itemId) {
    const selected = items.find((i) => String(i.id) === String(itemId) || String(i._id) === String(itemId))
    if (!selected) {
      setKendaraanForm((prev) => ({ ...prev, item_id: itemId }))
      return
    }

    const nameLower = (selected.itemName || '').toLowerCase()
    const isMotor = nameLower.includes('motor') || nameLower.includes('yamaha') || nameLower.includes('honda')
    const jenis = selected.jenis_kendaraan || (isMotor ? 'Sepeda Motor' : 'Mobil Dinas Operasional')
    const defaultKelengkapan = isMotor ? ['Kunci Utama', 'Helm', 'STNK'] : ['Kunci Utama', 'Kunci Cadangan', 'STNK']

    setKendaraanForm((prev) => ({
      ...prev,
      item_id: itemId,
      jenis_kendaraan: jenis,
      merk: selected.itemName?.split(' ')[0] || (isMotor ? 'Yamaha' : 'Toyota'),
      tipe: selected.merk_tipe || (isMotor ? 'B6H AT' : '2.8 VRZ A/T'),
      warna: selected.warna || prev.warna || 'Hitam',
      no_rangka: selected.no_rangka || selected.nomor_seri || prev.no_rangka || 'MH3SG5620MJ401393',
      no_mesin: selected.no_mesin || prev.no_mesin || 'G3L8E0770049',
      tahun_pembuatan: String(selected.tahunPerolehan || new Date().getFullYear()),
      nomor_polisi: selected.nomor_polisi || prev.nomor_polisi || (isMotor ? 'B 3240 PJQ' : 'B 1980 ZQN'),
      kelengkapan: Array.isArray(selected.kelengkapan_standar) && selected.kelengkapan_standar.length > 0
        ? selected.kelengkapan_standar
        : defaultKelengkapan,
    }))
  }

  function handleExportCSV() {
    const headers = [
      'No',
      'Kode Barang',
      'Nama Barang',
      'NUP',
      'Nama Peminjam',
      'NIP',
      'Jabatan / Tim',
      'No. Surat Tugas',
      'Tujuan Wilayah',
      'Tanggal Berangkat',
      'Tanggal Kembali',
      'Status Peminjaman',
      'Kondisi Kembali',
      'Catatan',
    ]

    const rows = filteredLoans.map((l, idx) => [
      idx + 1,
      `"${l.item?.kode_bmn || l.item?.itemCode || ''}"`,
      `"${(l.item?.itemName || '').replace(/"/g, '""')}"`,
      `"${l.item?.nup || '0001'}"`,
      `"${(l.nama_peminjam || '').replace(/"/g, '""')}"`,
      `"${l.nip_peminjam || ''}"`,
      `"${(l.jabatan_tim || '').replace(/"/g, '""')}"`,
      `"${(l.no_surat_tugas || '').replace(/"/g, '""')}"`,
      `"${(l.tujuan_wilayah || '').replace(/"/g, '""')}"`,
      l.tanggal_berangkat || '',
      l.tanggal_kembali || '',
      `"${l.status || 'diajukan'}"`,
      `"${l.kondisi_kembali || ''}"`,
      `"${(l.keterangan || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFFsep=;\r\n' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Log_Peminjaman_Wasrik_Itjen_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const availableItems = items.filter(
    (i) =>
      i.kondisi !== 'rusak berat' &&
      i.status_penggunaan !== 'dipinjam' &&
      !(i.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan')
  )

  const vehicleItems = items.filter(
    (i) =>
      (i.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan') ||
      (i.itemName || '').toLowerCase().includes('motor') ||
      (i.itemName || '').toLowerCase().includes('mobil') ||
      (i.itemName || '').toLowerCase().includes('toyota') ||
      (i.itemName || '').toLowerCase().includes('yamaha') ||
      (i.itemName || '').toLowerCase().includes('honda')
  )

  const filteredLoans = loans.filter((l) => {
    const isKendaraan =
      l.tipe_peminjaman === 'kendaraan' ||
      (l.item?.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan')

    if (activeTab === 'kendaraan' && !isKendaraan) return false
    if (activeTab === 'wasrik' && isKendaraan) return false

    if (!search) return true
    const q = search.toLowerCase()
    return (
      (l.nama_peminjam || '').toLowerCase().includes(q) ||
      (l.nip_peminjam || '').toLowerCase().includes(q) ||
      (l.no_surat_tugas || '').toLowerCase().includes(q) ||
      (l.tujuan_wilayah || '').toLowerCase().includes(q) ||
      (l.nomor_polisi || '').toLowerCase().includes(q) ||
      (l.jenis_kendaraan || '').toLowerCase().includes(q) ||
      (l.item?.itemName || '').toLowerCase().includes(q) ||
      (l.item?.itemCode || '').toLowerCase().includes(q)
    )
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item_id) {
      setFormError('Pilih barang BMN yang akan dipinjam.')
      return
    }
    try {
      setSubmitting(true)
      setFormError('')
      await axios.post(WASRIK_API, form)
      showToast.success('Permohonan peminjaman berhasil diajukan!')
      setShowModal(false)
      setForm(emptyWasrikForm)
      fetchAll()
    } catch (err) {
      console.error(err)
      setFormError(err.response?.data?.message || 'Gagal mengajukan peminjaman.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleKendaraanSubmit(e) {
    e.preventDefault()
    if (!kendaraanForm.item_id) {
      setFormError('Pilih unit kendaraan dinas yang akan dipinjam.')
      return
    }
    try {
      setSubmitting(true)
      setFormError('')
      await axios.post(WASRIK_API, kendaraanForm)
      showToast.success('Pengajuan BAST Kendaraan Dinas berhasil disimpan!')
      setShowKendaraanModal(false)
      setKendaraanForm(emptyKendaraanForm)
      fetchAll()
    } catch (err) {
      console.error(err)
      setFormError(err.response?.data?.message || 'Gagal mengajukan peminjaman kendaraan.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReturnSubmit(e) {
    e.preventDefault()
    if (!returnItem) return
    try {
      setReturnLoading(true)
      await axios.post(`${WASRIK_API}/${returnItem.id || returnItem._id}/kembali`, {
        kondisi_kembali: kondisiKembali,
        catatan: catatanKembali,
      })
      showToast.success('Aset/Kendaraan berhasil dikembalikan!')
      setReturnItem(null)
      fetchAll()
    } catch (err) {
      console.error(err)
      showToast.error('Gagal memproses pengembalian aset.')
    } finally {
      setReturnLoading(false)
    }
  }

  return (
    <Layout>
      <div className={printDoc || printReturnDoc ? 'print:hidden' : ''}>
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              {activeTab === 'kendaraan' ? (
                <>
                  <Car className="text-navy" size={26} />
                  Peminjaman &amp; Operasional Kendaraan Dinas
                </>
              ) : (
                <>
                  <Laptop className="text-navy" size={26} />
                  Peminjaman Barang Tugas Wasrik / Audit Lapangan
                </>
              )}
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              {activeTab === 'kendaraan'
                ? 'Pencatatan penyerahan mobil/motor dinas operasional terikat Surat Tugas disertai penerbitan BAST resmi'
                : 'Pencatatan tertib peminjaman laptop dan perangkat BMN untuk tim pengawasan ke daerah terikat Surat Tugas (ST)'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Unduh log peminjaman ke CSV / Excel"
            >
              <Download size={14} /> Export CSV
            </button>
            <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 shadow-sm text-xs cursor-pointer">
              <Plus size={15} /> {activeTab === 'kendaraan' ? 'Ajukan Pinjam Kendaraan' : 'Ajukan Pinjam Aset'}
            </Button>
          </div>
        </div>



        {/* FILTER SEARCH */}
        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder={
                activeTab === 'kendaraan'
                  ? 'Cari nama peminjam, nomor polisi, no ST, atau kendaraan...'
                  : 'Cari nama peminjam, nomor ST, atau tujuan wilayah...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-black/10 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-navy"
            />
          </div>
          <div className="text-xs text-ink/50 font-mono-ledger">
            Total: <span className="font-bold text-navy">{filteredLoans.length}</span> Pengajuan
          </div>
        </div>

        {/* TABLE DATA */}
        <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 text-ink/60 border-b border-black/10 uppercase tracking-wider font-semibold">
                  <th className="p-4">{activeTab === 'kendaraan' ? 'Kendaraan Dinas & Plat' : 'Barang BMN'}</th>
                  <th className="p-4">{activeTab === 'kendaraan' ? 'Penerima / Pemakai' : 'Peminjam / Auditor'}</th>
                  <th className="p-4">No. Surat Tugas &amp; Keperluan</th>
                  <th className="p-4">Jadwal Tugas</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-ink/40">
                      Memuat data peminjaman...
                    </td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-ink/40">
                      {activeTab === 'kendaraan'
                        ? 'Belum ada riwayat peminjaman kendaraan dinas operasional.'
                        : 'Belum ada riwayat peminjaman aset untuk tugas wasrik.'}
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const isKendaraan = loan.tipe_peminjaman === 'kendaraan' || (loan.item?.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan')
                    return (
                      <tr key={loan.id || loan._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          {isKendaraan ? (
                            <div>
                              <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                                <Car size={15} className="text-navy" />
                                <span>{loan.jenis_kendaraan || 'Kendaraan Dinas'}: {loan.item?.itemName}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">
                                  {loan.nomor_polisi || loan.item?.nomor_seri || 'Plat Dinas'}
                                </span>
                                <span className="text-[11px] text-ink/50 font-mono">
                                  NUP: {loan.item?.nup || '0001'}
                                </span>
                              </div>
                              {loan.no_rangka && (
                                <div className="text-[10px] text-ink/50 font-mono mt-0.5">
                                  Rangka: {loan.no_rangka} • Mesin: {loan.no_mesin || '-'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                                <Laptop size={14} className="text-navy" />
                                <span>{loan.item?.itemName || 'Barang Terkait'}</span>
                              </div>
                              <div className="font-mono text-[11px] text-navy font-medium mt-0.5">
                                {loan.item?.itemCode} • NUP: {loan.item?.nup || '0001'}
                              </div>
                              {loan.item?.nomor_seri && (
                                <div className="text-[10px] text-ink/50 font-mono">SN: {loan.item.nomor_seri}</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-ink">{loan.nama_peminjam}</div>
                          <div className="text-[11px] text-ink/60 font-mono">NIP: {loan.nip_peminjam || '-'}</div>
                          <div className="text-[10px] text-ink/40">{loan.jabatan_tim}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-navy font-mono text-[11px]">{loan.no_surat_tugas}</div>
                          <div className="text-xs text-ink/70 font-medium mt-0.5">{loan.tujuan_wilayah}</div>
                        </td>

                        <td className="p-4 font-mono-ledger">
                          <div className="text-xs text-ink">
                            {new Date(loan.tanggal_berangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -{' '}
                            {new Date(loan.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        <td className="p-4">
                          {loan.status === 'diajukan' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={12} className="animate-pulse" /> Menunggu Persetujuan
                            </span>
                          )}
                          {loan.status === 'dipinjam' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} /> Disetujui / Bertugas
                            </span>
                          )}
                          {loan.status === 'ditolak' && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={12} /> Ditolak Pimpinan
                              </span>
                              {loan.catatan_approval && (
                                <div className="text-[10px] text-red-600 mt-1 max-w-[200px] truncate" title={loan.catatan_approval}>
                                  Ket: {loan.catatan_approval}
                                </div>
                              )}
                            </div>
                          )}
                          {loan.status === 'kembali' && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Selesai / Kembali
                              </span>
                              {loan.kondisi_kembali && (
                                <div className="text-[10px] text-ink/50 mt-1 capitalize">Kondisi: {loan.kondisi_kembali}</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {loan.status === 'diajukan' && (
                              <span className="inline-block text-[11px] text-ink/50 italic py-1">
                                Menunggu Approval
                              </span>
                            )}

                            {loan.status === 'dipinjam' && (
                              <>
                                <button
                                  onClick={() => setPrintDoc(loan)}
                                  className="inline-flex items-center gap-1.5 text-xs border border-navy/30 text-navy hover:bg-navy/5 px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shadow-xs"
                                  title={isKendaraan ? 'Cetak BAST Serah Terima Kendaraan' : 'Cetak Surat Izin Pemegang Barang (SIPB)'}
                                >
                                  <Printer size={13} /> {isKendaraan ? 'BAST Kendaraan' : 'Dokumen SIPB'}
                                </button>
                                <button
                                  onClick={() => {
                                    setReturnItem(loan)
                                    setKondisiKembali(loan.item?.kondisi || 'baik')
                                    setCatatanKembali('')
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-xs cursor-pointer"
                                  title="Proses Pengembalian Aset"
                                >
                                  <CheckCircle2 size={13} /> Kembalikan
                                </button>
                              </>
                            )}

                            {loan.status === 'kembali' && (
                              <button
                                onClick={() => setPrintReturnDoc(loan)}
                                className="inline-flex items-center gap-1.5 text-xs border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer shadow-xs"
                                title="Cetak Berita Acara Serah Terima Pengembalian"
                              >
                                <Printer size={13} /> BAST Pengembalian
                              </button>
                            )}

                            {loan.status === 'ditolak' && (
                              <span className="inline-block text-[11px] text-red-500/70 italic py-1">
                                Ditolak
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL AJUKAN PEMINJAMAN WASRIK (LAPTOP / IT) */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Laptop className="text-navy" size={18} />
                    Permohonan Peminjaman Aset Wasrik
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Penerbitan izin pemegang barang sementara untuk keperluan pengawasan dinas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-xs">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Pilih Barang */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Pilih Barang BMN <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <SearchableSelect
                        value={form.item_id}
                        onChange={(val) => setForm({ ...form, item_id: val })}
                        options={availableItems.map((i) => ({
                          value: i.id || i._id,
                          label: `${i.itemName} (${i.itemCode} • NUP ${i.nup || '0001'}) - ${i.lokasi_ruangan || 'Gedung Itjen'}`,
                        }))}
                        placeholder="Cari nama laptop, kode BMN, atau NUP..."
                        required
                      />
                    </div>
                  </div>

                  {/* Nama Peminjam */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Nama Peminjam <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={form.nama_peminjam}
                        onChange={(e) => setForm({ ...form, nama_peminjam: e.target.value })}
                        required
                        placeholder="Contoh: Rahmat Hidayat, S.E."
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* NIP Peminjam */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      NIP Peminjam:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={form.nip_peminjam}
                        onChange={(e) => setForm({ ...form, nip_peminjam: e.target.value })}
                        placeholder="Contoh: 198204122006042001"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                  </div>

                  {/* Jabatan Tim */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Jabatan dalam Tim:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={form.jabatan_tim}
                        onChange={(e) => setForm({ ...form, jabatan_tim: e.target.value })}
                        placeholder="Contoh: Ketua Tim Wasrik / Anggota Tim"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* No Surat Tugas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      No. Surat Tugas (ST) <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={form.no_surat_tugas}
                        onChange={(e) => setForm({ ...form, no_surat_tugas: e.target.value })}
                        required
                        placeholder="Contoh: ST.090/1422/IJ/2026"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                  </div>

                  {/* Tujuan Wilayah */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Tujuan Wilayah Wasrik <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={form.tujuan_wilayah}
                        onChange={(e) => setForm({ ...form, tujuan_wilayah: e.target.value })}
                        required
                        placeholder="Contoh: Pemkab Banyuwangi / Pemprov Jatim"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* Tanggal Berangkat & Kembali */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Periode Peminjaman <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Tgl Berangkat:</span>
                        <Input
                          type="date"
                          value={form.tanggal_berangkat}
                          onChange={(e) => setForm({ ...form, tanggal_berangkat: e.target.value })}
                          required
                          className="text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Rencana Kembali:</span>
                        <Input
                          type="date"
                          value={form.tanggal_kembali}
                          onChange={(e) => setForm({ ...form, tanggal_kembali: e.target.value })}
                          required
                          className="text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                      Keperluan Khusus:
                    </label>
                    <div className="sm:col-span-8">
                      <textarea
                        value={form.keterangan}
                        onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                        placeholder="Kebutuhan pemeriksaan audit operasional lapangan..."
                        rows={2}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(false)}
                    className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Ajukan Peminjaman'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL AJUKAN PEMINJAMAN KENDARAAN DINAS */}
        {showKendaraanModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Car className="text-navy" size={18} />
                    Peminjaman &amp; Serah Terima Kendaraan Dinas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Form penerbitan Berita Acara Serah Terima (BAST) Kendaraan Dinas Set. Itjen Kemendagri
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKendaraanModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleKendaraanSubmit} className="flex flex-col">
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-xs">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Pilih Kendaraan dari Pool / Master */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Pilih Unit Kendaraan <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <SearchableSelect
                        value={kendaraanForm.item_id}
                        onChange={handleKendaraanItemSelect}
                        options={(vehicleItems.length > 0 ? vehicleItems : availableItems).map((i) => ({
                          value: i.id || i._id,
                          label: `${i.itemName} (${i.itemCode} • NUP ${i.nup || '0001'}) - ${i.lokasi_ruangan || 'Pool Gedung B'}`,
                        }))}
                        placeholder="Pilih armada mobil / motor dinas..."
                        required
                      />
                    </div>
                  </div>

                  {/* Jenis Kendaraan & Nomor Polisi */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Jenis &amp; No. Polisi <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                      <SearchableSelect
                        value={kendaraanForm.jenis_kendaraan}
                        onChange={(val) => setKendaraanForm({ ...kendaraanForm, jenis_kendaraan: val })}
                        options={[
                          { value: 'Sepeda Motor', label: '🛵 Sepeda Motor' },
                          { value: 'Mobil Dinas Operasional', label: '🚗 Mobil Dinas Operasional' },
                          { value: 'Mobil Jabatan', label: '🚙 Mobil Jabatan' },
                          { value: 'Minibus / Bus', label: '🚌 Minibus / Bus' },
                        ]}
                      />
                      <Input
                        value={kendaraanForm.nomor_polisi}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, nomor_polisi: e.target.value })}
                        required
                        placeholder="Contoh: B 3240 PJQ"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Merk / Tipe & Warna */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Merk / Tipe &amp; Warna:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-3 gap-2">
                      <Input
                        value={kendaraanForm.merk}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, merk: e.target.value })}
                        placeholder="Merk (Yamaha)"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                      <Input
                        value={kendaraanForm.tipe}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, tipe: e.target.value })}
                        placeholder="Tipe (B6H AT)"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                      <Input
                        value={kendaraanForm.warna}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, warna: e.target.value })}
                        placeholder="Warna (Hitam)"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* No Rangka & No Mesin */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      No. Rangka &amp; No. Mesin:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                      <Input
                        value={kendaraanForm.no_rangka}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, no_rangka: e.target.value })}
                        placeholder="No Rangka (MH3SG...)"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                      <Input
                        value={kendaraanForm.no_mesin}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, no_mesin: e.target.value })}
                        placeholder="No Mesin (G3L8E...)"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                  </div>

                  {/* Tahun Pembuatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Tahun Pembuatan:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.tahun_pembuatan}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, tahun_pembuatan: e.target.value })}
                        placeholder="Contoh: 2021"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono w-32"
                      />
                    </div>
                  </div>

                  {/* Checklist Kelengkapan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-1">
                      Kelengkapan Dokumen / Fisik:
                    </label>
                    <div className="sm:col-span-8 space-y-1.5">
                      {['Kunci Utama', 'Helm', 'Kunci Cadangan', 'STNK', 'Kartu Tol / BBM'].map((itemText) => {
                        const isChecked = (kendaraanForm.kelengkapan || []).includes(itemText)
                        return (
                          <label key={itemText} className="inline-flex items-center gap-2 mr-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = kendaraanForm.kelengkapan || []
                                if (e.target.checked) {
                                  setKendaraanForm({ ...kendaraanForm, kelengkapan: [...current, itemText] })
                                } else {
                                  setKendaraanForm({ ...kendaraanForm, kelengkapan: current.filter((x) => x !== itemText) })
                                }
                              }}
                              className="rounded border-slate-300 text-navy focus:ring-navy h-3.5 w-3.5"
                            />
                            <span className="text-xs text-slate-700">{itemText}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <hr className="border-slate-200 my-2" />
                  <div className="text-[11px] font-bold text-navy uppercase tracking-wider">Identitas Pihak Kedua (Penerima Kendaraan)</div>

                  {/* Nama Peminjam / Penerima */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Nama Penerima <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.nama_peminjam}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, nama_peminjam: e.target.value })}
                        required
                        placeholder="Contoh: Fallah Aulia, S.Tr.IP"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-medium"
                      />
                    </div>
                  </div>

                  {/* NIP Penerima */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      NIP Penerima:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.nip_peminjam}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, nip_peminjam: e.target.value })}
                        placeholder="Contoh: 19990824 202108 1 002"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                  </div>

                  {/* Jabatan Penerima */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                      Jabatan / Unit Kerja:
                    </label>
                    <div className="sm:col-span-8">
                      <textarea
                        value={kendaraanForm.jabatan_tim}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, jabatan_tim: e.target.value })}
                        placeholder="Contoh: PPUPD Ahli Pertama Pada Subbagian Organisasi Dan Sumber Daya Manusia Pada Bagian Umum Dan Keuangan Sekretariat Inspektorat Jenderal"
                        rows={2}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                      />
                    </div>
                  </div>

                  {/* No Surat Tugas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      No. Surat Tugas / ST <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.no_surat_tugas}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, no_surat_tugas: e.target.value })}
                        required
                        placeholder="Contoh: ST.090/880/IJ/2026"
                        className="text-xs h-9 border-slate-300 focus:border-navy font-mono"
                      />
                    </div>
                  </div>

                  {/* Tujuan Wilayah Dinas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Tujuan Wilayah / Lokasi <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.tujuan_wilayah}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, tujuan_wilayah: e.target.value })}
                        required
                        placeholder="Contoh: Pemprov Jawa Barat / Jabodetabek"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* Keperluan / Agenda Dinas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Keperluan / Agenda Dinas:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        value={kendaraanForm.keterangan}
                        onChange={(e) => setKendaraanForm({ ...kendaraanForm, keterangan: e.target.value })}
                        placeholder="Contoh: Pengawasan Wasrik Reguler / Operasional Kedinasan"
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* Periode Pakai */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Periode Pakai <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Tgl Penyerahan:</span>
                        <Input
                          type="date"
                          value={kendaraanForm.tanggal_berangkat}
                          onChange={(e) => setKendaraanForm({ ...kendaraanForm, tanggal_berangkat: e.target.value })}
                          required
                          className="text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Rencana Kembali:</span>
                        <Input
                          type="date"
                          value={kendaraanForm.tanggal_kembali}
                          onChange={(e) => setKendaraanForm({ ...kendaraanForm, tanggal_kembali: e.target.value })}
                          required
                          className="text-xs h-9 border-slate-300 focus:border-navy"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKendaraanModal(false)}
                    className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Ajukan BAST Kendaraan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PENGEMBALIAN BARANG / KENDARAAN */}
        {returnItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {returnItem.tipe_peminjaman === 'kendaraan' ? 'Konfirmasi Pengembalian Kendaraan Dinas' : 'Konfirmasi Pengembalian BMN'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unit: <span className="font-semibold text-navy">{returnItem.item?.itemName}</span>{' '}
                    {returnItem.nomor_polisi ? `(${returnItem.nomor_polisi})` : `(${returnItem.item?.itemCode})`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReturnItem(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReturnSubmit} className="flex flex-col">
                <div className="p-6 space-y-4 text-xs">
                  {/* Kondisi Fisik Saat Kembali */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right">
                      Kondisi Fisik Saat Kembali <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-7">
                      <SearchableSelect
                        value={kondisiKembali}
                        onChange={(val) => setKondisiKembali(val)}
                        options={[
                          { value: 'baik', label: '🟢 Baik (Lengkap & Berfungsi Normal)' },
                          { value: 'evaluasi', label: '🟡 Evaluasi (Ada Baret/Kerusakan Ringan)' },
                          { value: 'perhatian', label: '🔴 Perhatian (Perlu Servis Berat / Mogok)' },
                        ]}
                        placeholder="Pilih kondisi kembali..."
                        required
                      />
                    </div>
                  </div>

                  {/* Catatan Pengembalian */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-5 text-xs font-medium text-slate-700 sm:text-right pt-2">
                      Catatan Fisik &amp; Surat:
                    </label>
                    <div className="sm:col-span-7">
                      <textarea
                        value={catatanKembali}
                        onChange={(e) => setCatatanKembali(e.target.value)}
                        placeholder="STNK lengkap, kunci utama/cadangan diterima, kondisi bodi mulus, BBM 3/4..."
                        rows={2}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReturnItem(null)}
                    className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer" disabled={returnLoading}>
                    {returnLoading ? 'Memproses...' : 'Konfirmasi Selesai'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PRINT DOKUMEN 1: BAST KENDARAAN (GAMBAR 1) / SIPB WASRIK */}
      {printDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:border-none print:shadow-none">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 sm:p-10 my-4 sm:my-6 border border-black/10 print:static print:my-0 print:p-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
            {/* PRINT TOOLBAR */}
            <div className="sticky -top-6 sm:-top-10 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3.5 bg-white/95 backdrop-blur border-b border-black/10 mb-6 rounded-t-2xl flex items-center justify-between z-20 print:hidden shadow-xs">
              <div>
                <span className="text-xs font-bold text-navy uppercase tracking-wider block">
                  {printDoc.tipe_peminjaman === 'kendaraan' ? 'Preview Berita Acara Serah Terima (BAST) Kendaraan' : 'Preview Surat Izin Pemegang Barang (SIPB)'}
                </span>
                <span className="text-[11px] text-gray-500">Format Resmi Inspektorat Jenderal Kementerian Dalam Negeri</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintDoc(null)}
                  className="px-3 py-1.5 text-xs text-ink/70 hover:bg-gray-100 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-1.5 text-xs h-8 px-3.5 shadow-sm cursor-pointer">
                  <Printer size={14} /> Cetak Dokumen (A4)
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK SESUAI FORMAT RESMI KEMENDAGRI */}
            <div className="doc-print-area font-sans text-black leading-tight">
              {/* KOP SURAT */}
              <div className="flex items-start gap-3 border-b-2 border-black pb-1.5 mb-2">
                <img src={logoKemendagri} alt="Logo Kemendagri" className="w-14 h-16 object-contain shrink-0" />
                <div className="text-center flex-1 pr-4 font-sans">
                  <p className="text-xs font-semibold tracking-wider uppercase text-black">
                    KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                  </p>
                  <p className="text-base font-bold uppercase tracking-tight text-black mt-0.5">
                    INSPEKTORAT JENDERAL
                  </p>
                  <p className="text-[9.5px] text-black leading-tight mt-0.5">
                    Jalan Medan Merdeka Timur Nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                    Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                  </p>
                </div>
              </div>

              {printDoc.tipe_peminjaman === 'kendaraan' ? (
                /* FORMAT 1: BAST KENDARAAN (PERSIS GAMBAR 1) */
                <div>
                  <div className="text-center mb-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                      BERITA ACARA SERAH TERIMA<br />INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                    </h2>
                    <p className="text-[10px] font-mono mt-0.5">
                      Nomor : 000.3.3.2/{printDoc.id ? String(printDoc.id).padStart(3, '0') : '126'}/ITJEN
                    </p>
                  </div>

                  <div className="text-[10px] leading-relaxed space-y-1 text-justify">
                    <p>{formatTanggalTerbilang(printDoc.tanggal_berangkat)}</p>

                    {/* PIHAK 1 & 2 */}
                    <div className="space-y-1 pl-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">1.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: {printDoc.pihak_pertama_nama || 'Andi Agung Febrianto, S.STP, M.Kessos'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {printDoc.pihak_pertama_nip || '19900217 201206 1 002'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          : {printDoc.pihak_pertama_jabatan || 'Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri'}, selanjutnya disebut sebagai <em>Pihak Pertama</em>.
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">2.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: {printDoc.nama_peminjam}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {printDoc.nip_peminjam || '-'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          : {printDoc.jabatan_tim || 'PPUPD Ahli Pertama Pada Subbagian Organisasi Dan Sumber Daya Manusia Pada Bagian Umum Dan Keuangan Sekretariat Inspektorat Jenderal pada Inspektorat Jenderal Kementerian Dalam Negeri'}, selanjutnya disebut sebagai <em>Pihak Kedua</em>.
                        </span>
                      </div>
                    </div>

                    <p className="pt-0.5">
                      Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                    </p>

                    {/* 6 BUTIR RESMI */}
                    <div className="space-y-1 pl-1">
                      <div className="flex items-start gap-1.5">
                        <span>1.</span>
                        <div className="flex-1">
                          <em>Pihak Pertama</em> menyerahkan Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dalam keadaan baik dengan spesifikasi dan kelengkapan sebagai berikut :

                          <table className="w-full text-[9.5px] border-collapse border border-black my-1 font-sans">
                            <thead>
                              <tr className="bg-gray-50 text-center font-bold">
                                <th className="border border-black px-1.5 py-1 w-8">No</th>
                                <th className="border border-black px-1.5 py-1 w-28">Jenis Barang</th>
                                <th className="border border-black px-1.5 py-1">Spesifikasi / Merk</th>
                                <th className="border border-black px-1.5 py-1 w-16">Jumlah</th>
                                <th className="border border-black px-1.5 py-1 w-32">Kelengkapan</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="align-top">
                                <td className="border border-black px-1.5 py-1 text-center font-bold">1</td>
                                <td className="border border-black px-1.5 py-1 font-semibold">
                                  {printDoc.jenis_kendaraan || 'Sepeda Motor'}
                                </td>
                                <td className="border border-black px-1.5 py-1 space-y-0.5">
                                  <p>Merk : {printDoc.item?.itemName?.split(' ')[0] || 'Yamaha'}</p>
                                  <p>Tipe : {printDoc.item?.merk_tipe || 'B6H AT'}</p>
                                  <p>Warna : {printDoc.warna || 'Hitam'}</p>
                                  <p className="font-mono">No. Rangka : {printDoc.no_rangka || printDoc.item?.nomor_seri || 'MH3SG5620MJ401393'}</p>
                                  <p className="font-mono">No. Mesin : {printDoc.no_mesin || 'G3L8E0770049'}</p>
                                  <p>Th. Pembuatan : {printDoc.tahun_pembuatan || printDoc.item?.tahunPerolehan || '2021'}</p>
                                  <p className="font-bold">Nomor Polisi : {printDoc.nomor_polisi || 'B 3240 PJQ'}</p>
                                </td>
                                <td className="border border-black px-1.5 py-1 text-center font-semibold">1 Unit</td>
                                <td className="border border-black px-1.5 py-1">
                                  {Array.isArray(printDoc.kelengkapan) && printDoc.kelengkapan.length > 0 ? (
                                    printDoc.kelengkapan.map((k, idx) => (
                                      <p key={idx}>{idx + 1}. {k}</p>
                                    ))
                                  ) : (
                                    <>
                                      <p>1. Kunci Utama</p>
                                      <p>2. Helm</p>
                                      <p>3. STNK</p>
                                    </>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>2.</span>
                        <p className="flex-1">
                          <em>Pihak Kedua</em> berhak menggunakan barang inventaris tersebut sepanjang untuk kepentingan dinas dalam rangka <strong>{printDoc.keterangan || 'Operasional Kedinasan'}</strong> dengan tujuan wilayah <strong>{printDoc.tujuan_wilayah || 'Operasional Kedinasan'}</strong> berdasarkan <strong>Surat Tugas No. {printDoc.no_surat_tugas || '-'}</strong>.
                        </p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>3.</span>
                        <p className="flex-1"><em>Pihak Kedua</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.</p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>4.</span>
                        <p className="flex-1"><em>Pihak Kedua</em> dilarang merubah bentuk, warna dan ukuran serta dilarang menjual, menggadaikan, pinjam pakai kepada pihak lainnya.</p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>5.</span>
                        <p className="flex-1"><em>Pihak pertama</em> sewaktu-waktu dapat menarik kembali Barang Inventaris dimaksud guna memenuhi kebutuhan organisasi yang bersifat mendesak.</p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>6.</span>
                        <p className="flex-1">Apabila <em>Pihak Kedua</em> pindah/keluar instansi maka barang inventaris tersebut harus diserahkan kepada Pejabat Pengganti atas sepengetahuan <em>Pihak Pertama</em> dan tidak boleh dibawa.</p>
                      </div>
                    </div>

                    <p className="pt-1">
                      Demikian Berita Acara Serah Terima Barang Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.
                    </p>

                    {/* TANDA TANGAN 3 PIHAK (PERSIS GAMBAR 1) */}
                    <div className="pt-3 space-y-2 font-sans break-inside-avoid">
                      <div className="grid grid-cols-2 text-center text-[10.5px]">
                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK PERTAMA</p>
                          <p className="font-bold underline text-black">{printDoc.pihak_pertama_nama || 'Andi Agung Febrianto, S.STP, M.Kessos'}</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. {printDoc.pihak_pertama_nip || '19900217 201206 1 002'}</p>
                        </div>

                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK KEDUA</p>
                          <p className="font-bold underline text-black">{printDoc.nama_peminjam}</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. {printDoc.nip_peminjam || '.............................................'}</p>
                        </div>
                      </div>

                      {/* MENGETAHUI SEKRETARIS */}
                      <div className="text-center text-[10.5px] pt-1">
                        <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                        <p className="text-[10px] mb-7">Sekretaris,</p>
                        <p className="font-bold underline text-black">{printDoc.mengetahui_nama || 'Dr. Ir. Bachril Bakri, M.App.Sc'}</p>
                        <p className="text-[9.5px] font-mono mt-0.5">NIP. {printDoc.mengetahui_nip || '19661122 199303 1 001'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMAT SIPB WASRIK LAPTOP */
                <div>
                  <div className="text-center mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                      SURAT IZIN PEMEGANG BARANG (SIPB) / BERITA ACARA PINJAM PAKAI
                    </h2>
                    <p className="text-[10px] font-mono mt-0.5">Nomor: BAST-WAS/{printDoc.id || 1}/{new Date().getFullYear()}</p>
                  </div>

                  <div className="text-[10.5px] leading-tight space-y-1.5 text-ink">
                    <p>
                      Pada hari ini, tanggal <strong>{new Date(printDoc.tanggal_berangkat).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, bertempat di Kantor Inspektorat Jenderal Kementerian Dalam Negeri, yang bertanda tangan di bawah ini:
                    </p>

                    <div className="pl-3 space-y-0.5 text-[10px]">
                      <p><strong>1. Pengelola BMN (Pihak Pertama):</strong> Subbagian Pengelolaan BMN &amp; Rumah Tangga Itjen Kemendagri</p>
                      <p><strong>2. Penerima / Peminjam (Pihak Kedua):</strong></p>
                      <div className="pl-3 space-y-0.5">
                        <p>• Nama: <strong>{printDoc.nama_peminjam}</strong></p>
                        <p>• NIP: {printDoc.nip_peminjam || '-'}</p>
                        <p>• Jabatan dalam Tim: {printDoc.jabatan_tim}</p>
                        <p>• Dasar Penugasan: <strong>Surat Tugas No. {printDoc.no_surat_tugas}</strong></p>
                        <p>• Wilayah / Lokasi Audit: <strong>{printDoc.tujuan_wilayah}</strong></p>
                      </div>
                    </div>

                    <p className="pt-0.5 text-[10px]">
                      Pihak Pertama menyerahkan kepada Pihak Kedua, dan Pihak Kedua menerima Barang Milik Negara (BMN) untuk keperluan penugasan pengawasan lapangan sebagai berikut:
                    </p>

                    <table className="w-full text-[9.5px] border-collapse border border-black/30 my-1">
                      <thead>
                        <tr className="bg-gray-100 text-center font-bold">
                          <th className="border border-black/30 px-1.5 py-1">Kode BMN</th>
                          <th className="border border-black/30 px-1.5 py-1">NUP</th>
                          <th className="border border-black/30 px-1.5 py-1">Nama Barang &amp; Merk/Tipe</th>
                          <th className="border border-black/30 px-1.5 py-1">No. Seri (SN)</th>
                          <th className="border border-black/30 px-1.5 py-1">Kondisi Awal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black/30 px-1.5 py-1 font-mono font-medium">{printDoc.item?.itemCode}</td>
                          <td className="border border-black/30 px-1.5 py-1 font-mono">{printDoc.item?.nup || '0001'}</td>
                          <td className="border border-black/30 px-1.5 py-1 text-left font-semibold">
                            {printDoc.item?.itemName}
                            {printDoc.item?.merk_tipe && <span className="block text-[9px] text-ink/60">{printDoc.item.merk_tipe}</span>}
                          </td>
                          <td className="border border-black/30 px-1.5 py-1 font-mono">{printDoc.item?.nomor_seri || '-'}</td>
                          <td className="border border-black/30 px-1.5 py-1 capitalize font-semibold text-emerald-700">
                            {printDoc.kondisi_pinjam || printDoc.item?.kondisi || 'Baik'}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-ink/80 text-[10px] italic">
                      Pihak Kedua bertanggung jawab penuh atas keamanan, keutuhan, dan pengoperasian BMN tersebut selama pelaksanaan tugas, dan wajib mengembalikan kepada Pihak Pertama selambat-lambatnya tanggal <strong>{new Date(printDoc.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                    </p>

                    <div className="pt-3 grid grid-cols-2 text-center text-[10.5px] break-inside-avoid">
                      <div>
                        <p className="text-ink/60 mb-0.5">Yang Menyerahkan (Pihak Pertama),</p>
                        <p className="font-semibold text-ink">Pengelola BMN / Rumah Tangga</p>
                        <p className="text-ink/50 text-[10px] mb-8">Sekretariat Itjen Kemendagri</p>
                        <p className="font-bold underline text-ink">( .................................................... )</p>
                        <p className="text-[9.5px] text-ink/60 font-mono">NIP. .............................................</p>
                      </div>
                      <div>
                        <p className="text-ink/60 mb-0.5">Yang Menerima (Pihak Kedua),</p>
                        <p className="font-semibold text-ink">Penerima / Tim Wasrik</p>
                        <p className="text-ink/50 text-[10px] mb-8">{printDoc.jabatan_tim}</p>
                        <p className="font-bold underline text-ink">( {printDoc.nama_peminjam} )</p>
                        <p className="text-[9.5px] text-ink/60 font-mono">NIP. {printDoc.nip_peminjam || '.............................................'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINT DOKUMEN 2: BAST PENGEMBALIAN KENDARAAN (GAMBAR 2) / BAST PENGEMBALIAN WASRIK */}
      {printReturnDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:border-none print:shadow-none">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 sm:p-10 my-4 sm:my-6 border border-black/10 print:static print:my-0 print:p-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
            {/* PRINT TOOLBAR */}
            <div className="sticky -top-6 sm:-top-10 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3.5 bg-white/95 backdrop-blur border-b border-black/10 mb-6 rounded-t-2xl flex items-center justify-between z-20 print:hidden shadow-xs">
              <div>
                <span className="text-xs font-bold text-navy uppercase tracking-wider block">
                  {printReturnDoc.tipe_peminjaman === 'kendaraan'
                    ? 'Preview Berita Acara Serah Terima Pengembalian Kendaraan'
                    : 'Preview Berita Acara Serah Terima Pengembalian'}
                </span>
                <span className="text-[11px] text-gray-500">Format Resmi Pengembalian BMN Set. Itjen Kemendagri</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintReturnDoc(null)}
                  className="px-3 py-1.5 text-xs text-ink/70 hover:bg-gray-100 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-1.5 text-xs h-8 px-3.5 shadow-sm cursor-pointer">
                  <Printer size={14} /> Cetak BAST Pengembalian (A4)
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK BAST PENGEMBALIAN SESUAI DOKUMEN FISIK */}
            <div className="doc-print-area font-sans text-black leading-tight">
              {/* KOP SURAT */}
              <div className="flex items-start gap-3 border-b-2 border-black pb-1.5 mb-2">
                <img src={logoKemendagri} alt="Logo Kemendagri" className="w-14 h-16 object-contain shrink-0" />
                <div className="text-center flex-1 pr-4 font-sans">
                  <p className="text-xs font-semibold tracking-wider uppercase text-black">
                    KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                  </p>
                  <p className="text-base font-bold uppercase tracking-tight text-black mt-0.5">
                    INSPEKTORAT JENDERAL
                  </p>
                  <p className="text-[9.5px] text-black leading-tight mt-0.5">
                    Jalan Medan Merdeka Timur Nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                    Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                  </p>
                </div>
              </div>

              {printReturnDoc.tipe_peminjaman === 'kendaraan' ? (
                /* FORMAT BAST PENGEMBALIAN KENDARAAN (PERSIS GAMBAR 2) */
                <div>
                  <div className="text-center mb-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                      BERITA ACARA SERAH TERIMA PENGEMBALIAN<br />INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                    </h2>
                    <p className="text-[10px] font-mono mt-0.5">
                      Nomor : 000.3.3.2/{printReturnDoc.id ? String(printReturnDoc.id).padStart(3, '0') : '120'}/ITJEN
                    </p>
                  </div>

                  <div className="text-[10px] leading-relaxed space-y-1 text-justify">
                    <p>{formatTanggalTerbilang(new Date())}</p>

                    {/* IDENTITAS PIHAK 1 & 2 */}
                    <div className="space-y-1 pl-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">1.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: {printReturnDoc.pihak_pertama_nama || 'Andi Agung Febrianto, S.STP, M.Kessos'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {printReturnDoc.pihak_pertama_nip || '19900217 201206 1 002'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          : {printReturnDoc.pihak_pertama_jabatan || 'Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri'}, selanjutnya disebut sebagai <em>Pihak Pertama</em>.
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">2.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: {printReturnDoc.nama_peminjam || 'Kukuh Setya Nugraha, S.STP'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {printReturnDoc.nip_peminjam || '19950512 201708 1 003'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          : {printReturnDoc.jabatan_tim || 'Kepala Subbagian Tata Usaha Inspektorat IV pada Inspektorat Jenderal Kementerian Dalam Negeri'}, selanjutnya disebut sebagai <em>Pihak Kedua</em>.
                        </span>
                      </div>
                    </div>

                    <p className="pt-0.5">
                      Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                    </p>

                    {/* BUTIR KETENTUAN PENGEMBALIAN KENDARAAN (GAMBAR 2) */}
                    <div className="space-y-1 pl-1">
                      <div className="flex items-start gap-1.5">
                        <span>1.</span>
                        <div className="flex-1">
                          <em>Pihak Kedua</em> menyerahkan dan mengembalikan Barang Inventaris Inspektorat Jenderal Kemendagri untuk kepentingan dinas dengan spesifikasi dan kelengkapan sebagai berikut :

                          <table className="w-full text-[9.5px] border-collapse border border-black my-1 font-sans">
                            <thead>
                              <tr className="bg-gray-50 text-center font-bold">
                                <th className="border border-black px-1.5 py-1 w-8">No</th>
                                <th className="border border-black px-1.5 py-1 w-28">Jenis Barang</th>
                                <th className="border border-black px-1.5 py-1">Spesifikasi / Merk</th>
                                <th className="border border-black px-1.5 py-1 w-16">Jumlah</th>
                                <th className="border border-black px-1.5 py-1 w-32">Kelengkapan</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="align-top">
                                <td className="border border-black px-1.5 py-1 text-center font-bold">1</td>
                                <td className="border border-black px-1.5 py-1 font-semibold">
                                  {printReturnDoc.jenis_kendaraan || 'Sepeda Motor'}
                                </td>
                                <td className="border border-black px-1.5 py-1 space-y-0.5">
                                  <p>Merk : {printReturnDoc.item?.itemName?.split(' ')[0] || 'Yamaha'}</p>
                                  <p>Tipe : {printReturnDoc.item?.merk_tipe || 'B6H AT'}</p>
                                  <p>Warna : {printReturnDoc.warna || 'Hitam'}</p>
                                  <p className="font-mono">No. Rangka : {printReturnDoc.no_rangka || printReturnDoc.item?.nomor_seri || 'MH3SG5620MJ401393'}</p>
                                  <p className="font-mono">No. Mesin : {printReturnDoc.no_mesin || 'G3L8E0770049'}</p>
                                  <p>Th. Pembuatan : {printReturnDoc.tahun_pembuatan || printReturnDoc.item?.tahunPerolehan || '2021'}</p>
                                  <p className="font-bold">Nomor Polisi : {printReturnDoc.nomor_polisi || 'B 3240 PJQ'}</p>
                                </td>
                                <td className="border border-black px-1.5 py-1 text-center font-semibold">1 Unit</td>
                                <td className="border border-black px-1.5 py-1">
                                  {Array.isArray(printReturnDoc.kelengkapan) && printReturnDoc.kelengkapan.length > 0 ? (
                                    printReturnDoc.kelengkapan.map((k, idx) => (
                                      <p key={idx}>{idx + 1}. {k}</p>
                                    ))
                                  ) : (
                                    <>
                                      <p>1. Kunci Utama</p>
                                      <p>2. Helm</p>
                                      <p>3. STNK</p>
                                    </>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>2.</span>
                        <p className="flex-1"><em>Pihak Pertama</em> berhak menyimpan atau mendistribusikan barang inventaris tersebut untuk kepentingan dinas.</p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>3.</span>
                        <p className="flex-1"><em>Pihak Pertama</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.</p>
                      </div>
                    </div>

                    <p className="pt-1">
                      Demikian Berita Acara Serah Terima Barang Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.
                    </p>

                    {/* TANDA TANGAN 3 PIHAK: PIHAK PERTAMA, PIHAK KEDUA, MENGETAHUI SEKRETARIS */}
                    <div className="pt-3 space-y-2 font-sans break-inside-avoid">
                      <div className="grid grid-cols-2 text-center text-[10.5px]">
                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK PERTAMA</p>
                          <p className="font-bold underline text-black">{printReturnDoc.pihak_pertama_nama || 'Andi Agung Febrianto, S.STP, M.Kessos'}</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. {printReturnDoc.pihak_pertama_nip || '19900217 201206 1 002'}</p>
                        </div>

                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK KEDUA</p>
                          <p className="font-bold underline text-black">{printReturnDoc.nama_peminjam || 'Kukuh Setya Nugraha, S.STP'}</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. {printReturnDoc.nip_peminjam || '19950512 201708 1 003'}</p>
                        </div>
                      </div>

                      {/* MENGETAHUI SEKRETARIS */}
                      <div className="text-center text-[10.5px] pt-1">
                        <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                        <p className="text-[10px] mb-7">Sekretaris,</p>
                        <p className="font-bold underline text-black">{printReturnDoc.mengetahui_nama || 'Dr. Ir. Bachril Bakri, M.App.Sc'}</p>
                        <p className="text-[9.5px] font-mono mt-0.5">NIP. {printReturnDoc.mengetahui_nip || '19661122 199303 1 001'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMAT BAST PENGEMBALIAN WASRIK */
                <div>
                  <div className="text-center mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                      BERITA ACARA SERAH TERIMA PENGEMBALIAN<br />INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                    </h2>
                    <p className="text-[10px] font-mono mt-0.5">Nomor : 000.3.3.2/{printReturnDoc.id ? String(printReturnDoc.id).padStart(3, '0') : '107'}/ITJEN</p>
                  </div>

                  <div className="text-[10.5px] leading-tight space-y-1.5 text-justify">
                    <p>
                      Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, yang bertandatangan dibawah ini masing-masing :
                    </p>

                    <div className="space-y-1 pl-2 text-[10px]">
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
                        <span className="col-span-9 font-bold">: {printReturnDoc.nama_peminjam || 'Ir. Rolekson Simatupang, MM'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {printReturnDoc.nip_peminjam || '19610706 199403 1 001'}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">: {printReturnDoc.jabatan_tim || 'PPUPD Ahli Utama Pada Inspektorat II'} Pada Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Kedua</em>.</span>
                      </div>
                    </div>

                    <p className="pt-0.5 text-[10px]">
                      Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                    </p>

                    <div className="space-y-1 pl-1 text-[10px] leading-tight">
                      <div className="flex items-start gap-1.5">
                        <span>1.</span>
                        <div className="flex-1">
                          <em>Pihak Kedua</em> menyerahkan dan mengembalikan Barang Inventaris Inspektorat Jenderal Kemendagri untuk kepentingan dinas dengan spesifikasi dan kelengkapan sebagai berikut :

                          <table className="w-full text-[9.5px] border-collapse border border-black my-1 font-sans">
                            <thead>
                              <tr className="bg-gray-50 text-center font-bold">
                                <th className="border border-black px-1.5 py-1 w-8">No</th>
                                <th className="border border-black px-1.5 py-1 w-44">Jenis Barang</th>
                                <th className="border border-black px-1.5 py-1">Spesifikasi / Merk</th>
                                <th className="border border-black px-1.5 py-1 w-16">Jumlah</th>
                                <th className="border border-black px-1.5 py-1 w-28">Kelengkapan</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="align-top">
                                <td className="border border-black px-1.5 py-1 text-center font-bold">1</td>
                                <td className="border border-black px-1.5 py-1 font-semibold">
                                  {printReturnDoc.item?.itemName || 'Laptop'}
                                  <span className="block text-[9px] font-mono text-black/70 font-normal">
                                    {printReturnDoc.item?.itemCode || '3.10.01.02.002.95'}
                                  </span>
                                </td>
                                <td className="border border-black px-1.5 py-1">
                                  <p><strong>Merk:</strong> {printReturnDoc.item?.merk_tipe || printReturnDoc.item?.itemName || 'Asus'}</p>
                                  <p><strong>Tipe:</strong> {printReturnDoc.item?.nomor_seri ? `SN: ${printReturnDoc.item.nomor_seri}` : 'Zenbook 14 OLED UX3405CA'}</p>
                                  <p className="text-[9px] text-black/70">Kondisi: {printReturnDoc.kondisi_kembali || 'Baik'}</p>
                                </td>
                                <td className="border border-black px-1.5 py-1 text-center font-semibold">1 Unit</td>
                                <td className="border border-black px-1.5 py-1">
                                  <p>1. Charger</p>
                                  <p>2. Sleeve / Tas</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>2.</span>
                        <p className="flex-1"><em>Pihak Pertama</em> berhak menyimpan atau mendistribusikan barang inventaris tersebut untuk kepentingan dinas.</p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span>3.</span>
                        <p className="flex-1"><em>Pihak Pertama</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.</p>
                      </div>
                    </div>

                    <p className="pt-1 text-[10px]">
                      Demikian Berita Acara Serah Terima Barang Inventaris Inspektorat Jenderal Kemendagri ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.
                    </p>

                    <div className="pt-2 space-y-2 font-sans break-inside-avoid">
                      <div className="grid grid-cols-2 text-center text-[10.5px]">
                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK PERTAMA</p>
                          <p className="font-bold underline text-black">Andi Agung Febrianto, S.STP, M.Kessos</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. 19900217 201206 1 002</p>
                        </div>

                        <div>
                          <p className="font-bold tracking-wide uppercase mb-7">PIHAK KEDUA</p>
                          <p className="font-bold underline text-black">
                            {printReturnDoc.nama_peminjam || 'Ir. Rolekson Simatupang, MM'}
                          </p>
                          <p className="text-[9.5px] font-mono mt-0.5">
                            NIP. {printReturnDoc.nip_peminjam || '19610706 199403 1 001'}
                          </p>
                        </div>
                      </div>

                      <div className="text-center text-[10.5px] pt-1">
                        <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                        <p className="text-[10px] mb-7">Sekretaris,</p>
                        <p className="font-bold underline text-black">Dr. Ir. Bachril Bakri, M.App.Sc</p>
                        <p className="text-[9.5px] font-mono mt-0.5">NIP. 19661122 199303 1 001</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default PeminjamanWasrik
