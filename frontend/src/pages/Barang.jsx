import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import QRCodeModal from '../components/QRCodeModal'
import QRScannerModal from '../components/QRScannerModal'
import ImportExcelModal from '../components/ImportExcelModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MapPin,
  QrCode as QrIcon,
  Building2,
  UserCheck,
  Laptop,
  Car,
  Clock,
  Camera,
  FileSpreadsheet,
  Download,
  Wrench,
  X,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  ShieldCheck,
  Tag
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UNIT_KERJA_OPTIONS, RUANGAN_GEDUNG_ITJEN } from '../lib/constants'
import { showAlert, showToast } from '../lib/alerts'

const ITEM_API = `${API_BASE_URL}/item`
const KATEGORI_API = `${API_BASE_URL}/kategori-item`
const USERS_API = `${API_BASE_URL}/users`
const PEGAWAI_API = `${API_BASE_URL}/pegawai`

const statusMeta = {
  baik: { label: 'Baik', badge: 'bg-sage-bg text-sage', bar: 'bg-sage' },
  evaluasi: { label: 'Evaluasi', badge: 'bg-ochre-bg text-ochre', bar: 'bg-ochre' },
  perhatian: { label: 'Perhatian', badge: 'bg-rust-bg text-rust', bar: 'bg-rust' },
}

const emptyForm = {
  kategoriItem: '',
  itemCode: '',
  nup: '0001',
  kode_bmn: '3.05.01.04.001',
  itemName: '',
  sifat_aset: 'terikat_ruangan',
  jenis_kendaraan: '',
  merk_tipe: '',
  nomor_seri: '',
  nomor_polisi: '',
  no_rangka: '',
  no_mesin: '',
  warna: '',
  kelengkapan_standar: [],
  tahunPerolehan: new Date().getFullYear(),
  nilaiPerolehan: '',
  kondisi: 'baik',
  status_penggunaan: 'digunakan',
  unit_kerja: 'Sekretariat Itjen',
  lokasi_ruangan: RUANGAN_GEDUNG_ITJEN[0],
  penanggung_jawab: '',
}

const emptyKendaraanForm = {
  kategoriItem: '',
  itemCode: '',
  nup: '0001',
  kode_bmn: '3.02.01.01.002',
  itemName: '',
  sifat_aset: 'bergerak',
  jenis_kendaraan: 'Sepeda Motor',
  merk_tipe: '',
  nomor_seri: '',
  nomor_polisi: '',
  no_rangka: '',
  no_mesin: '',
  warna: 'Hitam',
  kelengkapan_standar: ['STNK', 'Kunci Utama', 'Helm'],
  tahunPerolehan: new Date().getFullYear(),
  nilaiPerolehan: '',
  kondisi: 'baik',
  status_penggunaan: 'tersedia',
  unit_kerja: 'Sekretariat Itjen',
  lokasi_ruangan: 'Pool Kendaraan Dinas Gedung B',
  penanggung_jawab: '',
}

function Barang() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isOperator = user?.role === 'operator'
  const isStaf = user?.role === 'staf'
  const isPimpinan = user?.role === 'pimpinan'

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabQuery = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabQuery === 'kendaraan' ? 'kendaraan' : 'umum')

  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab === 'kendaraan' || currentTab === 'umum') {
      setActiveTab(currentTab)
    } else if (!currentTab) {
      setActiveTab('umum')
    }
  }, [searchParams])

  function handleTabChange(tabKey) {
    setActiveTab(tabKey)
    setSearchParams({ tab: tabKey })
    setSearch('')
  }
  const [itemList, setItemList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterUnit, setFilterUnit] = useState(isOperator && user?.unit_kerja ? user.unit_kerja : 'Semua Unit Kerja')
  const [filterSifat, setFilterSifat] = useState('Semua Sifat Aset')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal QR Code Label & Scanner
  const [selectedQrItem, setSelectedQrItem] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  // Modal Import Excel SAKTI
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [itemRes, kategoriRes, userRes, pegawaiRes] = await Promise.all([
        axios.get(ITEM_API),
        axios.get(KATEGORI_API),
        axios.get(USERS_API).catch(() => ({ data: [] })),
        axios.get(PEGAWAI_API).catch(() => ({ data: [] })),
      ])
      setItemList(itemRes.data)
      setKategoriList(kategoriRes.data)

      const combinedPeople = []
      const seenNames = new Set()

      // 1. Pegawai Resmi
      ;(pegawaiRes.data || []).forEach((p) => {
        if (p.nama && !seenNames.has(p.nama.toLowerCase())) {
          seenNames.add(p.nama.toLowerCase())
          combinedPeople.push({
            value: p.nama,
            label: p.nama,
          })
        }
      })

      // 2. Users Akun
      ;(userRes.data || []).forEach((u) => {
        if (u.name && !seenNames.has(u.name.toLowerCase())) {
          seenNames.add(u.name.toLowerCase())
          combinedPeople.push({
            value: u.name,
            label: u.name,
          })
        }
      })

      setUserList(combinedPeople)
    } catch (err) {
      setError('Gagal memuat data barang')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    if (activeTab === 'kendaraan') {
      const kndKategori = kategoriList.find(
        (k) =>
          k.kategoriItemCode === 'KAT-KND' ||
          (k.kategoriItemName || '').toLowerCase().includes('kendaraan')
      )
      setForm({
        ...emptyKendaraanForm,
        sifat_aset: 'bergerak',
        kategoriItem: kndKategori?._id || kndKategori?.id || '',
        unit_kerja: user?.unit_kerja || 'Sekretariat Itjen',
        lokasi_ruangan: 'Pool Kendaraan Dinas Gedung B',
      })
    } else {
      const tikKategori = kategoriList.find(
        (k) =>
          k.kategoriItemCode !== 'KAT-KND' &&
          !(k.kategoriItemName || '').toLowerCase().includes('kendaraan')
      )
      setForm({
        ...emptyForm,
        sifat_aset: 'terikat_ruangan',
        kategoriItem: tikKategori?._id || tikKategori?.id || '',
        unit_kerja: user?.unit_kerja || 'Sekretariat Itjen',
        lokasi_ruangan: RUANGAN_GEDUNG_ITJEN[0],
      })
    }
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(item) {
    setEditingId(item._id || item.id)
    const isKendaraanItem =
      item.jenis_kendaraan ||
      item.nomor_polisi ||
      item.no_rangka ||
      (item.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan') ||
      item.kategoriItem?.kategoriItemCode === 'KAT-KND'

    setForm({
      kategoriItem: item.kategoriItem?._id || item.kategori_item_id || '',
      itemCode: item.itemCode,
      nup: item.nup || '0001',
      kode_bmn: item.kode_bmn || (isKendaraanItem ? '3.02.01.01.002' : '3.05.01.04.001'),
      itemName: item.itemName,
      sifat_aset: item.sifat_aset || (isKendaraanItem ? 'bergerak' : 'terikat_ruangan'),
      jenis_kendaraan: item.jenis_kendaraan || (isKendaraanItem ? 'Sepeda Motor' : ''),
      merk_tipe: item.merk_tipe || '',
      nomor_seri: item.nomor_seri || '',
      nomor_polisi: item.nomor_polisi || '',
      no_rangka: item.no_rangka || '',
      no_mesin: item.no_mesin || '',
      warna: item.warna || (isKendaraanItem ? 'Hitam' : ''),
      kelengkapan_standar: Array.isArray(item.kelengkapan_standar)
        ? item.kelengkapan_standar
        : ['STNK', 'Kunci Utama', 'Helm'],
      tahunPerolehan: item.tahunPerolehan,
      nilaiPerolehan: item.nilaiPerolehan,
      kondisi: item.kondisi || 'baik',
      status_penggunaan: item.status_penggunaan || 'digunakan',
      unit_kerja: item.unit_kerja || 'Sekretariat Itjen',
      lokasi_ruangan: item.lokasi_ruangan || (isKendaraanItem ? 'Pool Kendaraan Dinas Gedung B' : RUANGAN_GEDUNG_ITJEN[0]),
      penanggung_jawab: item.penanggung_jawab || '',
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

    const isKendaraanForm =
      activeTab === 'kendaraan' ||
      Boolean(form.jenis_kendaraan) ||
      Boolean(form.nomor_polisi)

    const sifatAset = isKendaraanForm ? 'bergerak' : (form.sifat_aset || 'terikat_ruangan')
    const lokasiRuangan =
      sifatAset === 'bergerak' && (!form.lokasi_ruangan || form.lokasi_ruangan.trim() === '')
        ? 'Dibawa Pegawai (Mobile)'
        : form.lokasi_ruangan

    const payload = {
      kategoriItem: form.kategoriItem,
      itemCode: form.itemCode,
      nup: form.nup,
      kode_bmn: form.kode_bmn,
      sifat_aset: sifatAset,
      itemName: form.itemName,
      jenis_kendaraan: isKendaraanForm ? form.jenis_kendaraan || 'Sepeda Motor' : null,
      merk_tipe: form.merk_tipe,
      nomor_seri: form.nomor_seri,
      nomor_polisi: isKendaraanForm ? form.nomor_polisi : null,
      no_rangka: isKendaraanForm ? form.no_rangka : null,
      no_mesin: isKendaraanForm ? form.no_mesin : null,
      warna: isKendaraanForm ? form.warna : null,
      kelengkapan_standar: isKendaraanForm ? form.kelengkapan_standar : null,
      tahunPerolehan: Number(form.tahunPerolehan),
      nilaiPerolehan: Number(form.nilaiPerolehan),
      kondisi: form.kondisi,
      status_penggunaan: form.status_penggunaan,
      unit_kerja: form.unit_kerja,
      lokasi_ruangan: lokasiRuangan,
      penanggung_jawab: form.penanggung_jawab,
    }

    try {
      if (editingId) {
        await axios.put(`${ITEM_API}/${editingId}`, payload)
        showToast.success('Data BMN Berhasil Diperbarui', `${form.itemName} telah diperbarui di database.`)
      } else {
        await axios.post(ITEM_API, payload)
        showToast.success('Aset BMN Berhasil Ditambahkan', `${form.itemName} telah dicatat ke inventaris.`)
      }
      await fetchAll()
      setShowModal(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan data barang.'
      setFormError(msg)
      showToast.error('Gagal Menyimpan Barang', msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, nama) {
    const confirmed = await showAlert.confirm({
      title: 'Hapus Aset BMN?',
      text: `Apakah Anda yakin ingin menghapus "${nama}"? Data dan riwayat mutasi aset ini tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus Aset',
      cancelText: 'Batal',
      isDestructive: true,
    })
    if (!confirmed) return

    try {
      await axios.delete(`${ITEM_API}/${id}`)
      await fetchAll()
      showToast.success('Aset BMN Berhasil Dihapus', `Barang "${nama}" telah dihapus.`)
    } catch (err) {
      showAlert.error('Gagal Menghapus Barang', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data barang.')
    }
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)
  }

  function hitungPersenUmur(item) {
    const umurEkonomis = item.kategoriItem?.umurEkonomisTahun
    if (!umurEkonomis) return 0
    const tahunSekarang = new Date().getFullYear()
    const umurAset = Math.max(0, tahunSekarang - item.tahunPerolehan)
    return Math.min(Math.round((umurAset / umurEkonomis) * 100), 100)
  }

  // Export Data ke Format CSV / Excel (Disesuaikan untuk Umum vs Kendaraan)
  function handleExportExcel() {
    if (activeTab === 'kendaraan') {
      const headers = [
        'No',
        'Nomor Polisi (Plat)',
        'Jenis Kendaraan',
        'Nama Armada BMN',
        'Merk/Tipe',
        'Kode Akun SAKTI',
        'NUP',
        'Kode Barang Internal',
        'No. Rangka (VIN)',
        'No. Mesin',
        'Warna',
        'Kelengkapan Standar',
        'Tahun Perolehan',
        'Nilai Perolehan (Rp)',
        'Kondisi',
        'Status Operasional',
        'Unit Kerja',
        'Lokasi Pool Parkir',
        'Penanggung Jawab / Driver',
      ]

      const rows = filteredItems.map((item, idx) => [
        idx + 1,
        `"${item.nomor_polisi || ''}"`,
        `"${item.jenis_kendaraan || 'Sepeda Motor'}"`,
        `"${(item.itemName || '').replace(/"/g, '""')}"`,
        `"${(item.merk_tipe || '').replace(/"/g, '""')}"`,
        `"${item.kode_bmn || '3.02.01.01.002'}"`,
        `"${item.nup || '0001'}"`,
        `"${item.itemCode || ''}"`,
        `"${item.no_rangka || ''}"`,
        `"${item.no_mesin || ''}"`,
        `"${item.warna || ''}"`,
        `"${Array.isArray(item.kelengkapan_standar) ? item.kelengkapan_standar.join(', ') : item.kelengkapan_standar || ''}"`,
        item.tahunPerolehan || '',
        item.nilaiPerolehan || 0,
        `"${item.kondisi || 'baik'}"`,
        `"${item.status_penggunaan || 'tersedia'}"`,
        `"${item.unit_kerja || 'Sekretariat Itjen'}"`,
        `"${(item.lokasi_ruangan || '').replace(/"/g, '""')}"`,
        `"${(item.penanggung_jawab || '').replace(/"/g, '""')}"`,
      ])

      const csvContent = '\uFEFFsep=;\r\n' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Kendaraan_Dinas_Itjen_Kemendagri_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    // Default: Export Aset Umum (TIK, Mebel, Peralatan)
    const headers = [
      'No',
      'Kode Barang',
      'NUP',
      'Kode Akun SAKTI',
      'Nama Barang',
      'Sifat Aset',
      'Merk/Tipe',
      'Nomor Seri (SN)',
      'Tahun Perolehan',
      'Nilai Perolehan (Rp)',
      'Kondisi',
      'Status Penggunaan',
      'Unit Kerja',
      'Lokasi Ruangan',
      'Penanggung Jawab',
    ]

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${item.itemCode || ''}"`,
      `"${item.nup || '0001'}"`,
      `"${item.kode_bmn || '3.05.01.04.001'}"`,
      `"${(item.itemName || '').replace(/"/g, '""')}"`,
      `"${item.sifat_aset === 'bergerak' ? 'Aset Bergerak (Mobile)' : 'Terikat Ruangan'}"`,
      `"${(item.merk_tipe || '').replace(/"/g, '""')}"`,
      `"${(item.nomor_seri || '').replace(/"/g, '""')}"`,
      item.tahunPerolehan || '',
      item.nilaiPerolehan || 0,
      `"${item.kondisi || 'baik'}"`,
      `"${item.status_penggunaan || 'digunakan'}"`,
      `"${item.unit_kerja || 'Sekretariat Itjen'}"`,
      `"${(item.lokasi_ruangan || '').replace(/"/g, '""')}"`,
      `"${(item.penanggung_jawab || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFFsep=;\r\n' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Aset_BMN_Itjen_Kemendagri_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleScanFound(detectedCode) {
    setSearch(detectedCode)
    setShowScanner(false)
  }

  const isVehicleItem = (item) =>
    Boolean(item.jenis_kendaraan) ||
    Boolean(item.nomor_polisi) ||
    Boolean(item.no_rangka) ||
    (item.kategoriItem?.kategoriItemName || '').toLowerCase().includes('kendaraan') ||
    item.kategoriItem?.kategoriItemCode === 'KAT-KND'

  // Filter Items
  const filteredItems = itemList.filter((item) => {
    // Filter Tab: Umum vs Kendaraan
    const isVeh = isVehicleItem(item)
    if (activeTab === 'kendaraan' && !isVeh) return false
    if (activeTab === 'umum' && isVeh) return false

    // Filter Sifat Aset (Umum)
    if (activeTab === 'umum' && filterSifat !== 'Semua Sifat Aset') {
      const sifat = item.sifat_aset || 'terikat_ruangan'
      if (sifat !== filterSifat) return false
    }

    // Filter Unit Kerja
    if (filterUnit !== 'Semua Unit Kerja' && item.unit_kerja !== filterUnit) {
      return false
    }

    // Filter Pencarian
    const term = search.toLowerCase().trim()
    const cleanTerm = term.replace(/\./g, '')
    const rawKode = item.kode_bmn ? item.kode_bmn.replace(/\./g, '').toLowerCase() : ''
    const rawNup = item.nup ? String(item.nup).replace(/^0+/, '') : ''
    const termNup = term.replace(/^0+/, '')

    return (
      item.itemName?.toLowerCase().includes(term) ||
      item.itemCode?.toLowerCase().includes(term) ||
      item.nup?.toLowerCase().includes(term) ||
      (termNup && rawNup === termNup) ||
      item.kode_bmn?.toLowerCase().includes(term) ||
      (cleanTerm && rawKode.includes(cleanTerm)) ||
      item.merk_tipe?.toLowerCase().includes(term) ||
      item.nomor_seri?.toLowerCase().includes(term) ||
      item.nomor_polisi?.toLowerCase().includes(term) ||
      item.no_rangka?.toLowerCase().includes(term) ||
      item.no_mesin?.toLowerCase().includes(term) ||
      item.warna?.toLowerCase().includes(term) ||
      item.jenis_kendaraan?.toLowerCase().includes(term) ||
      item.lokasi_ruangan?.toLowerCase().includes(term) ||
      item.penanggung_jawab?.toLowerCase().includes(term)
    )
  })

  const totalBaik = filteredItems.filter((i) => i.kondisi === 'baik').length
  const totalEvaluasi = filteredItems.filter((i) => i.kondisi === 'evaluasi').length
  const totalPerhatian = filteredItems.filter((i) => i.kondisi === 'perhatian').length

  return (
    <Layout>
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            {activeTab === 'kendaraan' ? (
              <>
                <Car className="text-navy" size={26} />
                Master Data Kendaraan Dinas Operasional
              </>
            ) : (
              <>
                <Building2 className="text-navy" size={26} />
                {isStaf ? 'Daftar Aset BMN Itjen' : isPimpinan ? 'Daftar Aset BMN Itjen Kemendagri' : 'Master Barang Milik Negara'}
              </>
            )}
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            {activeTab === 'kendaraan'
              ? 'Pencatatan inventaris motor dan mobil dinas operasional lengkap dengan Nomor Polisi, Rangka, Mesin, dan Kelengkapan BAST'
              : 'Pengelolaan aset BMN resmi Itjen Kemendagri sesuai standar kodefikasi SAKTI Kemenkeu'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Tombol Ajukan Servis Cepat untuk Staf */}
          {isStaf && (
            <button
              onClick={() => navigate('/pengajuan-servis')}
              className="flex items-center gap-1.5 bg-navy hover:bg-navy-light text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Wrench size={14} /> Ajukan Servis BMN
            </button>
          )}

          {/* Tombol Scanner Kamera */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-ink text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Scan QR Code fisik menggunakan kamera"
          >
            <Camera size={14} className="text-navy" /> Scan QR Kamera
          </button>

          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            title={activeTab === 'kendaraan' ? 'Unduh Daftar Inventarisasi Kendaraan Dinas (DIKD) ke Excel/CSV' : 'Unduh Laporan Inventaris BMN ke file Excel/CSV'}
          >
            <Download size={14} /> {activeTab === 'kendaraan' ? 'Export Kendaraan' : 'Export Excel'}
          </button>

          {/* Tombol Import SAKTI Massal */}
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 border border-navy/20 bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              title={activeTab === 'kendaraan' ? 'Unggah massal data SAKTI Alat Angkutan Bermotor' : 'Unggah massal data SAKTI Peralatan & Mebel BMN'}
            >
              <FileSpreadsheet size={14} /> {activeTab === 'kendaraan' ? 'Import SAKTI Kendaraan' : 'Import SAKTI'}
            </button>
          )}

          {!isPimpinan && !isStaf && (
            <Button onClick={openCreateModal} className="bg-navy hover:bg-navy-light text-white shadow-sm flex items-center gap-1.5 text-xs cursor-pointer">
              <Plus size={15} /> {activeTab === 'kendaraan' ? 'Tambah Kendaraan Baru' : 'Tambah BMN Baru'}
            </Button>
          )}
        </div>
      </div>


      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'kendaraan'
                ? 'Cari plat nomor, nama motor/mobil, nomor rangka, nomor mesin, atau penanggung jawab...'
                : 'Cari kode, NUP, nama barang, merk, nomor seri...'
            }
            className="w-full bg-gray-50 border border-black/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:bg-white focus:border-navy"
          />
        </div>

        <div className="w-64">
          <SearchableSelect
            value={filterUnit}
            onChange={(val) => setFilterUnit(val)}
            options={UNIT_KERJA_OPTIONS.map((u) => ({
              value: u,
              label: u,
            }))}
            placeholder="Filter Unit Kerja..."
          />
        </div>

        {activeTab === 'umum' && (
          <div className="w-56">
            <SearchableSelect
              value={filterSifat}
              onChange={(val) => setFilterSifat(val)}
              options={[
                { value: 'Semua Sifat Aset', label: 'Semua Sifat Aset' },
                { value: 'terikat_ruangan', label: '🏢 Terikat Ruangan' },
                { value: 'bergerak', label: '💻 Aset Bergerak (Mobile)' },
              ]}
              placeholder="Filter Sifat Aset..."
            />
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-ink/50">Memuat data inventaris BMN...</p>}
      {error && <p className="text-sm text-rust">{error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="overflow-x-auto">
              {activeTab === 'kendaraan' ? (
                /* TABEL KHUSUS KENDARAAN DINAS */
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3 w-10 text-center">No</th>
                      <th className="px-4 py-3">Plat Nomor &amp; Jenis</th>
                      <th className="px-4 py-3">Nama Armada &amp; Merk/Tipe</th>
                      <th className="px-4 py-3">No. Rangka &amp; No. Mesin</th>
                      <th className="px-4 py-3 text-center">Warna &amp; Thn</th>
                      <th className="px-4 py-3">Pool / Penanggung Jawab</th>
                      <th className="px-4 py-3">Kondisi</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8 text-ink/40">
                          Belum ada kendaraan dinas operasional terdaftar. Silakan klik <strong>Tambah Kendaraan Baru</strong>.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, index) => {
                        const meta = statusMeta[item.kondisi] || statusMeta.baik
                        const isMotor = (item.jenis_kendaraan || item.itemName || '').toLowerCase().includes('motor')
                        return (
                          <tr key={item._id || item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3.5 text-center text-ink/40 font-mono">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="inline-block bg-navy text-white font-mono font-bold text-xs px-2.5 py-1 rounded shadow-xs tracking-wider">
                                {item.nomor_polisi || item.nomor_seri || 'PLAT DINAS'}
                              </div>
                              <div className="text-[10px] text-ink/60 font-medium mt-1 flex items-center gap-1">
                                {isMotor ? '🛵' : '🚗'} {item.jenis_kendaraan || (isMotor ? 'Sepeda Motor' : 'Mobil Dinas')}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-ink text-sm">{item.itemName}</div>
                              <div className="text-xs text-ink/70 mt-0.5">{item.merk_tipe || '-'}</div>
                              <div className="text-[10px] text-ink/40 font-mono mt-0.5">
                                {item.itemCode} • NUP: {item.nup || '0001'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px]">
                              <div><span className="text-ink/40">Rangka:</span> <strong className="text-ink/80">{item.no_rangka || '-'}</strong></div>
                              <div className="mt-0.5"><span className="text-ink/40">Mesin:</span> <strong className="text-ink/80">{item.no_mesin || '-'}</strong></div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono">
                              <div className="text-xs font-semibold text-ink capitalize">{item.warna || 'Hitam'}</div>
                              <div className="text-[11px] text-ink/50">{item.tahunPerolehan}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1 text-[11px] text-navy font-semibold">
                                <MapPin size={12} className="text-navy shrink-0" />
                                <span>{item.lokasi_ruangan || 'Pool Gedung B'}</span>
                              </div>
                              <div className="text-[11px] text-ink/70 mt-0.5">{item.penanggung_jawab || 'Pengemudi Subbag RT'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {item.status_penggunaan === 'dipinjam' || item.status_penggunaan === 'dipinjam_wasrik' || item.status_penggunaan === 'dipinjam_kendaraan' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                                  <Clock size={11} /> Dipinjam Wasrik
                                </span>
                              ) : item.status_penggunaan === 'dalam_pemeliharaan' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  <Wrench size={11} /> Sedang Servis
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  ✓ Siap / Tersedia
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedQrItem(item)}
                                className="p-1.5 rounded hover:bg-navy/10 text-navy transition-colors cursor-pointer"
                                title="Cetak Label QR Code Stiker BMN"
                              >
                                <QrIcon size={15} />
                              </button>
                              {!isPimpinan && !isStaf && (
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors cursor-pointer"
                                  title="Edit Kendaraan"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(item._id || item.id, item.itemName)}
                                  className="p-1.5 rounded hover:bg-red-50 text-ink/50 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Hapus Kendaraan"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* TABEL ASET UMUM / IT / MEBEL */
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3 w-10 text-center">No</th>
                      <th className="px-4 py-3">Kode BMN &amp; NUP</th>
                      <th className="px-4 py-3">Nama Barang &amp; Merk/Tipe</th>
                      <th className="px-4 py-3">Unit Kerja &amp; Lokasi</th>
                      <th className="px-4 py-3">Penanggung Jawab</th>
                      <th className="px-4 py-3 w-16 text-center">Tahun</th>
                      <th className="px-4 py-3">Kondisi</th>
                      <th className="px-4 py-3">Status Penggunaan</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8 text-ink/40">
                          Tidak ada barang ditemukan sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, index) => {
                        const meta = statusMeta[item.kondisi] || statusMeta.baik
                        return (
                          <tr key={item._id || item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3.5 text-center text-ink/40 font-mono">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="font-mono font-bold text-navy text-xs">{item.itemCode}</div>
                              <div className="text-[10px] text-ink/50 font-mono">
                                NUP: <span className="font-bold text-ink">{item.nup || '0001'}</span>
                              </div>
                              {item.kode_bmn && (
                                <div className="text-[9px] text-ink/40 font-mono">SAKTI: {item.kode_bmn}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-ink text-sm">{item.itemName}</div>
                              {item.merk_tipe && (
                                <div className="text-xs text-ink/70 mt-0.5">{item.merk_tipe}</div>
                              )}
                              {item.nomor_seri && (
                                <div className="text-[10px] text-ink/50 font-mono">SN: {item.nomor_seri}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-navy text-[11px]">{item.unit_kerja || 'Sekretariat Itjen'}</span>
                                {item.sifat_aset === 'bergerak' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    💻 Bergerak
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    🏢 Terikat Ruang
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-ink/60 mt-0.5">
                                <MapPin size={11} className="text-ink/40 shrink-0" />
                                <span className={item.sifat_aset === 'bergerak' && (!item.lokasi_ruangan || item.lokasi_ruangan.includes('Mobile')) ? 'text-amber-800 font-medium' : ''}>
                                  {item.lokasi_ruangan || (item.sifat_aset === 'bergerak' ? 'Dibawa Pegawai (Mobile)' : 'Belum Ditentukan')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs text-ink/90 font-semibold">{item.penanggung_jawab || '—'}</div>
                              {item.sifat_aset === 'bergerak' && item.penanggung_jawab && (
                                <div className="text-[10px] text-slate-400">Pegawai Pemegang</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-ink/70">{item.tahunPerolehan}</td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {item.status_penggunaan === 'dipinjam' || item.status_penggunaan === 'dipinjam_wasrik' || item.status_penggunaan === 'dipinjam_kendaraan' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                                  <Clock size={11} /> Dipinjam Wasrik
                                </span>
                              ) : item.status_penggunaan === 'dalam_pemeliharaan' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  <Wrench size={11} /> Sedang Servis/Renovasi
                                </span>
                              ) : item.status_penggunaan === 'rusak_berat' ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                  Usul Hapus
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Digunakan
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedQrItem(item)}
                                className="p-1.5 rounded hover:bg-navy/10 text-navy transition-colors cursor-pointer"
                                title="Cetak Label QR Code Stiker BMN"
                              >
                                <QrIcon size={15} />
                              </button>

                              {isStaf && (
                                <button
                                  onClick={() => navigate('/pengajuan-servis')}
                                  className="p-1.5 rounded hover:bg-amber-50 text-ink/50 hover:text-amber-700 transition-colors cursor-pointer"
                                  title="Ajukan Servis / Perbaikan Barang Ini"
                                >
                                  <Wrench size={15} />
                                </button>
                              )}

                              {!isStaf && (
                                <button
                                  onClick={() => navigate('/pelacakan')}
                                  className="p-1.5 rounded hover:bg-blue-50 text-ink/50 hover:text-navy transition-colors cursor-pointer"
                                  title="Lacak & Mutasi Lokasi"
                                >
                                  <MapPin size={15} />
                                </button>
                              )}

                              {!isPimpinan && !isStaf && (
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded hover:bg-gray-100 text-ink/50 hover:text-ink transition-colors cursor-pointer"
                                  title="Edit Data BMN"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}

                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(item._id || item.id, item.itemName)}
                                  className="p-1.5 rounded hover:bg-red-50 text-ink/50 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Hapus Barang"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 text-xs text-ink/40 border-t border-black/5 bg-gray-50/50 flex justify-between items-center">
              <span>Menampilkan {filteredItems.length} dari {itemList.length} aset terdaftar</span>
              <span className="font-mono">Satker: Inspektorat Jenderal Kemendagri</span>
            </div>
          </div>

          {/* STATUS SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-sage-bg flex items-center justify-center shrink-0 text-sage font-bold">
                ✓
              </div>
              <div>
                <div className="text-xs text-ink/50">Aset Kondisi Baik</div>
                <div className="text-lg font-bold text-ink">{totalBaik}</div>
              </div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-ochre-bg flex items-center justify-center shrink-0 text-ochre font-bold">
                !
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Evaluasi</div>
                <div className="text-lg font-bold text-ink">{totalEvaluasi}</div>
              </div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rust-bg flex items-center justify-center shrink-0 text-rust font-bold">
                ✕
              </div>
              <div>
                <div className="text-xs text-ink/50">Perlu Perhatian / Rusak</div>
                <div className="text-lg font-bold text-ink">{totalPerhatian}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM TAMBAH / EDIT BARANG (GOOGLE ADVANCED SEARCH STYLE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto transform transition-all">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                  {activeTab === 'kendaraan' || form.jenis_kendaraan ? <Car size={20} /> : <PackagePlus size={20} />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">
                    {editingId
                      ? activeTab === 'kendaraan' || form.jenis_kendaraan
                        ? 'Edit Data Kendaraan Dinas'
                        : 'Edit Data Barang Milik Negara'
                      : activeTab === 'kendaraan'
                      ? 'Pendaftaran Kendaraan Dinas Baru'
                      : 'Pendaftaran Aset BMN Baru'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Inspektorat Jenderal Kementerian Dalam Negeri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl shadow-xs">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {activeTab === 'kendaraan' || form.jenis_kendaraan ? (
                  /* ================= FORM KHUSUS KENDARAAN DINAS ================= */
                  <>
                    <div>
                      <div className="pb-2 mb-4 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Car size={14} className="text-navy" />
                          Spesifikasi Kendaraan Dinas
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Jenis Kendaraan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Jenis Kendaraan <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.jenis_kendaraan || 'Sepeda Motor'}
                              onChange={(val) => {
                                const isMotor = val === 'Sepeda Motor'
                                const isJabatan = val === 'Mobil Jabatan'
                                const isBus = val === 'Minibus / Bus'
                                let defaultKode = '3.01.01.01.002'
                                if (isMotor) defaultKode = '3.02.01.01.002'
                                else if (isJabatan) defaultKode = '3.01.01.01.001'
                                else if (isBus) defaultKode = '3.01.01.02.001'

                                setForm({
                                  ...form,
                                  jenis_kendaraan: val,
                                  kode_bmn: defaultKode,
                                  kelengkapan_standar: isMotor
                                    ? ['STNK', 'Kunci Utama', 'Helm']
                                    : ['STNK', 'Kunci Utama', 'Kunci Cadangan', 'Ban Cadangan', 'Dongkrak', 'Tool Kit'],
                                })
                              }}
                              options={[
                                { value: 'Sepeda Motor', label: '🛵 Sepeda Motor' },
                                { value: 'Mobil Dinas Operasional', label: '🚗 Mobil Dinas Operasional' },
                                { value: 'Mobil Jabatan', label: '🚙 Mobil Jabatan' },
                                { value: 'Minibus / Bus', label: '🚌 Minibus / Bus' },
                              ]}
                              required
                            />
                          </div>
                        </div>

                        {/* Nomor Polisi (Plat) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nomor Polisi (Plat) <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.nomor_polisi}
                              onChange={(e) => setForm({ ...form, nomor_polisi: e.target.value.toUpperCase() })}
                              placeholder="Contoh: B 3240 PJQ"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy font-bold uppercase tracking-wider"
                            />
                          </div>
                        </div>

                        {/* Merk & Tipe */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Merk &amp; Tipe <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.merk_tipe}
                              onChange={(e) => {
                                const val = e.target.value
                                setForm({
                                  ...form,
                                  merk_tipe: val,
                                  itemName: form.itemName || `${form.jenis_kendaraan || 'Kendaraan'} ${val}`,
                                })
                              }}
                              placeholder="Contoh: Yamaha All New NMAX 155 B6H AT / Toyota Fortuner 2.8 VRZ"
                              required
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy font-medium"
                            />
                          </div>
                        </div>

                        {/* Nama Armada BMN */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nama Armada BMN <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.itemName}
                              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                              placeholder="Contoh: Sepeda Motor Yamaha NMAX 155 (Operasional)"
                              required
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy font-medium"
                            />
                          </div>
                        </div>

                        {/* Warna & Tahun Pembuatan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Warna &amp; Tahun Buat <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                            <Input
                              value={form.warna}
                              onChange={(e) => setForm({ ...form, warna: e.target.value })}
                              placeholder="Contoh: Hitam Metalik"
                              required
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                            />
                            <Input
                              type="number"
                              min="1995"
                              max="2099"
                              value={form.tahunPerolehan}
                              onChange={(e) => setForm({ ...form, tahunPerolehan: e.target.value })}
                              required
                              placeholder="Tahun"
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy font-mono"
                            />
                          </div>
                        </div>

                        {/* Nomor Rangka & Nomor Mesin */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            No. Rangka &amp; Mesin:
                          </label>
                          <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                            <Input
                              value={form.no_rangka}
                              onChange={(e) => setForm({ ...form, no_rangka: e.target.value.toUpperCase(), nomor_seri: e.target.value.toUpperCase() })}
                              placeholder="No Rangka (VIN)"
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy uppercase"
                            />
                            <Input
                              value={form.no_mesin}
                              onChange={(e) => setForm({ ...form, no_mesin: e.target.value.toUpperCase() })}
                              placeholder="No Mesin"
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy uppercase"
                            />
                          </div>
                        </div>

                        {/* Kelengkapan Standar */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-1">
                            Kelengkapan Standar:
                          </label>
                          <div className="sm:col-span-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              {[
                                'STNK',
                                'Kunci Utama',
                                'Kunci Cadangan',
                                'Helm',
                                'Ban Cadangan',
                                'Dongkrak',
                                'Tool Kit',
                                'Kartu BBM / e-Toll',
                              ].map((itemKel) => {
                                const current = Array.isArray(form.kelengkapan_standar) ? form.kelengkapan_standar : []
                                const checked = current.includes(itemKel)
                                return (
                                  <label key={itemKel} className="flex items-center gap-1.5 text-[11px] cursor-pointer text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setForm({ ...form, kelengkapan_standar: [...current, itemKel] })
                                        } else {
                                          setForm({ ...form, kelengkapan_standar: current.filter((x) => x !== itemKel) })
                                        }
                                      }}
                                      className="rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
                                    />
                                    <span>{itemKel}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BAGIAN 2: KODE SAKTI & LOKASI POOL */}
                    <div>
                      <div className="pb-2 mb-4 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 size={14} className="text-navy" />
                          Kodefikasi SAKTI, Nilai &amp; Pool Parkir
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Kode Akun SAKTI & NUP */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kode SAKTI &amp; NUP <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                            <Input
                              value={form.kode_bmn}
                              onChange={(e) => setForm({ ...form, kode_bmn: e.target.value })}
                              placeholder="3.02.01.01.002"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                              title="Kode Akun Standar SAKTI Kemenkeu"
                            />
                            <Input
                              value={form.nup}
                              onChange={(e) => setForm({ ...form, nup: e.target.value })}
                              placeholder="0001"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                              title="Nomor Urut Pendaftaran (NUP)"
                            />
                          </div>
                        </div>

                        {/* Kodefikasi Internal */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kode Internal BMN <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.itemCode}
                              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                              placeholder="BMN-ITJ-2024-MTR01"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Nilai Perolehan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nilai Perolehan (Rp) <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={form.nilaiPerolehan}
                                onChange={(e) => setForm({ ...form, nilaiPerolehan: e.target.value })}
                                required
                                className="bg-white text-xs h-9 pl-9 border-slate-300 focus:border-navy font-mono"
                              />
                            </div>
                            {Number(form.nilaiPerolehan) > 0 && (
                              <p className="text-[11px] text-emerald-700 font-semibold font-mono mt-1">
                                {formatRupiah(form.nilaiPerolehan)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Unit Kerja Pengguna */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Unit Kerja Pengampu <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.unit_kerja}
                              onChange={(val) => setForm({ ...form, unit_kerja: val })}
                              options={UNIT_KERJA_OPTIONS.filter((u) => u !== 'Semua Unit Kerja').map((u) => ({
                                value: u,
                                label: u,
                              }))}
                              placeholder="Pilih Unit Kerja Pengampu..."
                              required
                            />
                          </div>
                        </div>

                        {/* Lokasi Pool Kendaraan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Lokasi Pool Parkir <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.lokasi_ruangan}
                              onChange={(val) => setForm({ ...form, lokasi_ruangan: val })}
                              options={[
                                { value: 'Pool Kendaraan Dinas Gedung B', label: '🚗 Pool Kendaraan Dinas Gedung B' },
                                { value: 'Garasi Subbag Rumah Tangga', label: '🏢 Garasi Subbag Rumah Tangga' },
                                { value: 'Parkir Khusus Pimpinan Lt. 1', label: '🅿️ Parkir Khusus Pimpinan Lt. 1' },
                                { value: 'Pool Kendaraan Inspektorat Wilayah', label: '🚗 Pool Kendaraan Inspektorat Wilayah' },
                                { value: 'Area Parkir Luar Barat', label: '🅿️ Area Parkir Luar Barat' },
                              ]}
                              placeholder="Pilih Lokasi Pool..."
                              required
                            />
                          </div>
                        </div>

                        {/* Penanggung Jawab / Pengemudi */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Penanggung Jawab / Driver:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.penanggung_jawab}
                              onChange={(val) => setForm({ ...form, penanggung_jawab: val })}
                              options={userList}
                              placeholder="Pilih pegawai atau ketik nama driver..."
                              isCreatable={true}
                              formatCreateLabel={(inputValue) => `Gunakan nama manual: "${inputValue}"`}
                            />
                          </div>
                        </div>

                        {/* Kondisi Kendaraan & Status Operasional */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kondisi &amp; Status:
                          </label>
                          <div className="sm:col-span-8 grid grid-cols-2 gap-2">
                            <SearchableSelect
                              value={form.kondisi}
                              onChange={(val) => setForm({ ...form, kondisi: val })}
                              options={[
                                { value: 'baik', label: '🟢 Baik (Siap Operasional)' },
                                { value: 'evaluasi', label: '🟡 Evaluasi (Perlu Servis)' },
                                { value: 'perhatian', label: '🔴 Perhatian (Rusak Berat)' },
                              ]}
                              placeholder="Kondisi Fisik"
                            />
                            <SearchableSelect
                              value={form.status_penggunaan}
                              onChange={(val) => setForm({ ...form, status_penggunaan: val })}
                              options={[
                                { value: 'tersedia', label: 'Tersedia di Pool' },
                                { value: 'digunakan', label: 'Digunakan Operasional' },
                                { value: 'dalam_pemeliharaan', label: 'Dalam Pemeliharaan / Servis' },
                                { value: 'dipinjam_wasrik', label: 'Dipinjam Wasrik' },
                              ]}
                              placeholder="Status Operasional"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ================= FORM STANDAR ASET UMUM / IT / MEBEL ================= */
                  <>
                    <div>
                      <div className="pb-2 mb-4 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Identitas &amp; Spesifikasi Barang
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Kodefikasi Internal */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kodefikasi Internal <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.itemCode}
                              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                              placeholder="BMN-ITJ-2024-LTP01"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* NUP */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            NUP (No Urut Pendaftaran) <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.nup}
                              onChange={(e) => setForm({ ...form, nup: e.target.value })}
                              placeholder="0001"
                              required
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Kode Akun SAKTI */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kode Akun SAKTI:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.kode_bmn}
                              onChange={(e) => setForm({ ...form, kode_bmn: e.target.value })}
                              placeholder="3.05.01.04.001"
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Nama Barang */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nama Barang / Jenis Aset <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.itemName}
                              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                              placeholder="Contoh: Laptop Auditor Lenovo ThinkPad T14s"
                              required
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy font-medium"
                            />
                          </div>
                        </div>

                        {/* Merk / Tipe */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Merk / Spesifikasi Tipe:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.merk_tipe}
                              onChange={(e) => setForm({ ...form, merk_tipe: e.target.value })}
                              placeholder="Contoh: ThinkPad T14s Gen 3 Core i7-1260P"
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Nomor Seri */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nomor Seri (Serial Number - SN):
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              value={form.nomor_seri}
                              onChange={(e) => setForm({ ...form, nomor_seri: e.target.value })}
                              placeholder="Contoh: PF48291X"
                              className="bg-white font-mono text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Kategori BMN */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kategori BMN <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.kategoriItem}
                              onChange={(val) => setForm({ ...form, kategoriItem: val })}
                              options={kategoriList.map((k) => ({
                                value: k._id || k.id,
                                label: k.kategoriItemName,
                              }))}
                              placeholder="Pilih kategori BMN..."
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BAGIAN 2: PENEMPATAN, NILAI & STATUS */}
                    <div>
                      <div className="pb-2 mb-4 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Lokasi Penempatan, Nilai &amp; Kondisi Aset
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Tahun Perolehan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Tahun Perolehan <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <Input
                              type="number"
                              min="1990"
                              max="2099"
                              value={form.tahunPerolehan}
                              onChange={(e) => setForm({ ...form, tahunPerolehan: e.target.value })}
                              required
                              className="bg-white text-xs h-9 border-slate-300 focus:border-navy"
                            />
                          </div>
                        </div>

                        {/* Nilai Perolehan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Nilai Perolehan (Rp) <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={form.nilaiPerolehan}
                                onChange={(e) => setForm({ ...form, nilaiPerolehan: e.target.value })}
                                required
                                className="bg-white text-xs h-9 pl-9 border-slate-300 focus:border-navy font-mono"
                              />
                            </div>
                            {Number(form.nilaiPerolehan) > 0 && (
                              <p className="text-[11px] text-emerald-700 font-semibold font-mono mt-1">
                                {formatRupiah(form.nilaiPerolehan)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Unit Kerja */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Unit Kerja Itjen <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.unit_kerja}
                              onChange={(val) => setForm({ ...form, unit_kerja: val })}
                              options={UNIT_KERJA_OPTIONS.filter((u) => u !== 'Semua Unit Kerja').map((u) => ({
                                value: u,
                                label: u,
                              }))}
                              placeholder="Pilih Unit Kerja..."
                              required
                            />
                          </div>
                        </div>

                        {/* Sifat Karakteristik Aset */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">
                            Sifat / Penempatan Aset <span className="text-red-500 font-bold">*</span>:
                          </label>
                          <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  sifat_aset: 'terikat_ruangan',
                                  lokasi_ruangan: form.lokasi_ruangan === 'Dibawa Pegawai (Mobile)' ? RUANGAN_GEDUNG_ITJEN[0] : form.lokasi_ruangan,
                                })
                              }}
                              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                form.sifat_aset !== 'bergerak'
                                  ? 'border-navy bg-navy/5 ring-1 ring-navy'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs text-navy">
                                <span>🏢</span> Terikat Ruangan (Stasioner)
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Aset tetap di ruangan (Mebel, AC, Meja, Lemari). Masuk lembar KIR ruangan.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  sifat_aset: 'bergerak',
                                  lokasi_ruangan: form.lokasi_ruangan && form.lokasi_ruangan !== RUANGAN_GEDUNG_ITJEN[0] ? form.lokasi_ruangan : 'Dibawa Pegawai (Mobile)',
                                })
                              }}
                              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                form.sifat_aset === 'bergerak'
                                  ? 'border-navy bg-navy/5 ring-1 ring-navy'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs text-navy">
                                <span>💻</span> Aset Bergerak (Mobile Pegawai)
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Aset dibawa pegawai (Laptop, Tablet, Kamera). Tidak terikat satu ruangan fisik.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* Pilihan Ruangan / Status Penempatan */}
                        {form.sifat_aset === 'bergerak' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                            <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                              Status Lokasi / Basecamp:
                            </label>
                            <div className="sm:col-span-8">
                              <SearchableSelect
                                value={form.lokasi_ruangan}
                                onChange={(val) => setForm({ ...form, lokasi_ruangan: val })}
                                options={[
                                  { value: 'Dibawa Pegawai (Mobile)', label: '🏃 Dibawa Pegawai (Mobile / WFH / Dinas Luar)' },
                                  ...RUANGAN_GEDUNG_ITJEN.map((r) => ({
                                    value: r,
                                    label: `🏢 ${r} (Disimpan di Kantor)`,
                                  })),
                                ]}
                                placeholder="Pilih lokasi atau Dibawa Pegawai..."
                                isCreatable={true}
                                formatCreateLabel={(v) => `Gunakan lokasi: "${v}"`}
                              />
                              <p className="text-[10px] text-slate-400 mt-1">
                                Default: <em>Dibawa Pegawai (Mobile)</em>, atau tentukan ruangan jika disimpan di loker/ruangan kerja.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                            <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                              Pilihan Ruangan Gedung <span className="text-red-500 font-bold">*</span>:
                            </label>
                            <div className="sm:col-span-8">
                              <SearchableSelect
                                value={form.lokasi_ruangan}
                                onChange={(val) => setForm({ ...form, lokasi_ruangan: val })}
                                options={RUANGAN_GEDUNG_ITJEN.map((r) => ({
                                  value: r,
                                  label: r,
                                }))}
                                placeholder="Pilih Ruangan..."
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* Kondisi Fisik */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Kondisi Fisik:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.kondisi}
                              onChange={(val) => setForm({ ...form, kondisi: val })}
                              options={[
                                { value: 'baik', label: '🟢 Baik (Siap Operasional)' },
                                { value: 'evaluasi', label: '🟡 Evaluasi (Perlu Servis)' },
                                { value: 'perhatian', label: '🔴 Perhatian (Kritis)' },
                              ]}
                              placeholder="Pilih Kondisi..."
                            />
                          </div>
                        </div>

                        {/* Status Penggunaan */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            Status Penggunaan:
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.status_penggunaan}
                              onChange={(val) => setForm({ ...form, status_penggunaan: val })}
                              options={[
                                { value: 'digunakan', label: 'Digunakan' },
                                { value: 'dalam_pemeliharaan', label: 'Dalam Pemeliharaan / Servis' },
                                { value: 'dipinjam_wasrik', label: 'Dipinjam Wasrik' },
                                { value: 'rusak_berat', label: 'Rusak Berat (Usul Hapus)' },
                              ]}
                              placeholder="Pilih Status Penggunaan..."
                            />
                          </div>
                        </div>

                        {/* Penanggung Jawab / Pegawai Pemegang */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                          <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                            {form.sifat_aset === 'bergerak' ? (
                              <span>Pegawai Pemegang Aset <span className="text-red-500 font-bold">*</span>:</span>
                            ) : (
                              <span>Penanggung Jawab (PJ) Ruangan:</span>
                            )}
                          </label>
                          <div className="sm:col-span-8">
                            <SearchableSelect
                              value={form.penanggung_jawab}
                              onChange={(val) => setForm({ ...form, penanggung_jawab: val })}
                              options={userList}
                              placeholder={
                                form.sifat_aset === 'bergerak'
                                  ? 'Pilih pegawai pemegang laptop atau ketik nama...'
                                  : 'Pilih PJ ruangan atau ketik nama...'
                              }
                              isCreatable={true}
                              formatCreateLabel={(inputValue) => `Gunakan nama manual: "${inputValue}"`}
                              required={form.sifat_aset === 'bergerak'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Kolom bertanda bintang wajib diisi</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-6 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>{editingId ? 'Simpan Perubahan' : activeTab === 'kendaraan' ? 'Simpan Kendaraan' : 'Simpan Aset'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE LABEL PRINT */}
      {selectedQrItem && (
        <QRCodeModal item={selectedQrItem} onClose={() => setSelectedQrItem(null)} />
      )}

      {/* MODAL SCANNER KAMERA QR CODE */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanFound}
      />

      {/* MODAL IMPORT EXCEL / SAKTI */}
      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchAll}
        activeTab={activeTab}
        kategoriList={kategoriList}
      />
    </Layout>
  )
}

export default Barang