import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  Plus,
  Trash2,
  MapPin,
  ArrowRight,
  Search,
  Building2,
  UserCheck,
  Calendar,
  X,
  AlertCircle,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Laptop,
  Car,
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { showAlert, showToast } from '../lib/alerts'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'
import { RUANGAN_GEDUNG_ITJEN } from '../lib/constants'

const MUTASI_API = `${API_BASE_URL}/mutasi-lokasi`
const ITEM_API = `${API_BASE_URL}/item`
const USERS_API = `${API_BASE_URL}/users`
const PEGAWAI_API = `${API_BASE_URL}/pegawai`

/** Helper untuk mengekstrak Kode Ruangan (contoh: L01.08.01) dan Nama Ruangan */
export function parseRoomCodeAndName(roomStr) {
  if (!roomStr) return { code: '-', name: 'Belum Ditentukan' }
  const trimmed = String(roomStr).trim()
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ')
    const code = parts[0].trim()
    const name = parts.slice(1).join(' - ').trim()
    return { code, name }
  }
  const match = trimmed.match(/^([A-Z0-9.]+)\s+(.*)$/)
  if (match && (match[1].startsWith('L01') || match[1].startsWith('01'))) {
    return { code: match[1], name: match[2] }
  }
  return { code: trimmed, name: trimmed }
}

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

/** Helper parsing tag jenis mutasi & kelengkapan dari kolom keterangan DB */
export function parseMutasiKeterangan(rawKeterangan = '') {
  let jenisMutasi = null
  let kelengkapan = null
  let cleanKeterangan = rawKeterangan || ''

  if (cleanKeterangan.includes('[PENGEMBALIAN]')) {
    jenisMutasi = 'pengembalian'
    cleanKeterangan = cleanKeterangan.replace('[PENGEMBALIAN]', '')
  } else if (cleanKeterangan.includes('[PENYERAHAN]')) {
    jenisMutasi = 'penyerahan'
    cleanKeterangan = cleanKeterangan.replace('[PENYERAHAN]', '')
  } else if (cleanKeterangan.includes('[MUTASI_RUANGAN]')) {
    jenisMutasi = 'mutasi_ruangan'
    cleanKeterangan = cleanKeterangan.replace('[MUTASI_RUANGAN]', '')
  }

  const kelengkapanMatch = cleanKeterangan.match(/\[KELENGKAPAN:\s*([^\]]+)\]/)
  if (kelengkapanMatch) {
    kelengkapan = kelengkapanMatch[1].trim()
    cleanKeterangan = cleanKeterangan.replace(kelengkapanMatch[0], '')
  }

  return {
    jenisMutasi,
    kelengkapan,
    cleanKeterangan: cleanKeterangan.trim(),
  }
}

/** Helper menentukan Jenis Mutasi efektif (Penyerahan vs Pengembalian vs Mutasi Ruangan) */
export function getEffectiveJenisMutasi(row) {
  const { jenisMutasi } = parseMutasiKeterangan(row?.keterangan)
  if (jenisMutasi) return jenisMutasi

  const item = row?.item
  const isVehicle =
    item?.kategori_item?.kategoriItemCode === 'KAT-KND' ||
    item?.jenis_kendaraan ||
    item?.nomor_polisi ||
    ['mobil', 'motor', 'kendaraan', 'wheel drive', 'minibus', 'sepeda motor'].some((k) => (item?.itemName || '').toLowerCase().includes(k))

  const isTIKOrMobile =
    item?.sifat_aset === 'bergerak' ||
    item?.kategori_item?.kategoriItemCode === 'KAT-TIK' ||
    ['laptop', 'notebook', 'tablet', 'kamera'].some((k) => (item?.itemName || '').toLowerCase().includes(k))

  const isGudangTujuan =
    (row?.lokasi_tujuan || '').toLowerCase().includes('gudang') ||
    (row?.lokasi_tujuan || '').toLowerCase().includes('subbag umum')

  if (isGudangTujuan) return 'pengembalian'
  if (isVehicle || isTIKOrMobile) return 'penyerahan'
  return 'mutasi_ruangan'
}

/** Helper mengategorikan Jenis Barang: 'kendaraan' | 'laptop_tik' | 'barang_tetap' */
export function getItemTypeCategory(item) {
  if (!item) return 'barang_tetap'

  const isVehicle =
    item.kategori_item?.kategoriItemCode === 'KAT-KND' ||
    item.jenis_kendaraan ||
    item.nomor_polisi ||
    ['mobil', 'motor', 'kendaraan', 'wheel drive', 'minibus', 'sepeda motor', 'fortuner', 'pajero', 'innova', 'pcx', 'nmax'].some((k) =>
      (item.itemName || '').toLowerCase().includes(k)
    )

  if (isVehicle) return 'kendaraan'

  const isNonTetap =
    item.sifat_aset === 'bergerak' ||
    item.kategori_item?.kategoriItemCode === 'KAT-TIK' ||
    ['laptop', 'notebook', 'tablet', 'kamera', 'drone'].some((k) => (item.itemName || '').toLowerCase().includes(k))

  if (isNonTetap) return 'laptop_tik'

  return 'barang_tetap'
}

const emptyForm = {
  item_id: '',
  jenis_mutasi: 'penyerahan', // 'penyerahan' | 'pengembalian' | 'mutasi_ruangan'
  lokasi_tujuan: RUANGAN_GEDUNG_ITJEN[0],
  tanggal_mutasi: new Date().toISOString().split('T')[0],
  penanggung_jawab: '',
  kelengkapan: '1 Unit charger',
  keterangan: '',
}

function Pelacakan() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isPimpinan = user?.role === 'pimpinan'

  const [mutasiList, setMutasiList] = useState([])
  const [itemList, setItemList] = useState([])
  const [userList, setUserList] = useState([])
  const [pegawaiList, setPegawaiList] = useState([]) // Full Pegawai objects for NIP & Jabatan
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // State untuk Cetak Dokumen BAST Resmi
  const [printBast, setPrintBast] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [mutasiRes, itemRes, userRes, pegawaiRes] = await Promise.all([
        axios.get(MUTASI_API),
        axios.get(ITEM_API),
        axios.get(USERS_API).catch(() => ({ data: [] })),
        axios.get(PEGAWAI_API).catch(() => ({ data: [] })),
      ])
      setMutasiList(mutasiRes.data)
      setItemList(itemRes.data)
      setPegawaiList(pegawaiRes.data || [])

      const combinedPeople = []
      const seenNames = new Set()

      // 1. Pegawai Resmi
      ;(pegawaiRes.data || []).forEach((p) => {
        if (p.nama && !seenNames.has(p.nama.toLowerCase())) {
          seenNames.add(p.nama.toLowerCase())
          combinedPeople.push({
            value: p.nama,
            label: `${p.nama} (${p.nip || 'Pegawai'})`,
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
      setError('Gagal memuat data pelacakan & mutasi')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal(defaultItemId = '') {
    const initialItem = itemList.find((i) => String(i.id || i._id) === String(defaultItemId))
    const category = getItemTypeCategory(initialItem)
    const initialJenis = category === 'barang_tetap' ? 'mutasi_ruangan' : 'penyerahan'

    let defaultKelengkapan = '1 Unit charger'
    if (category === 'kendaraan') {
      defaultKelengkapan = '1. Kunci Utama\n2. Helm\n3. STNK'
    } else if (category === 'barang_tetap') {
      defaultKelengkapan = 'KIR Ruangan'
    }

    setForm({
      ...emptyForm,
      item_id: defaultItemId ? String(defaultItemId) : '',
      jenis_mutasi: initialJenis,
      kelengkapan: defaultKelengkapan,
      penanggung_jawab: initialItem?.penanggung_jawab || '',
    })
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function handleOpenBast(row) {
    setPrintBast(row)
  }

  const selectedItem = itemList.find((item) => String(item._id || item.id) === String(form.item_id))

  // Handler saat memilih barang di Modal Form
  function handleItemChange(val) {
    const item = itemList.find((i) => String(i.id || i._id) === String(val))
    const category = getItemTypeCategory(item)
    const newJenis = category === 'barang_tetap' ? 'mutasi_ruangan' : form.jenis_mutasi

    let defaultKelengkapan = form.kelengkapan
    if (category === 'kendaraan') {
      defaultKelengkapan = newJenis === 'pengembalian' ? '1. Kunci Utama\n2. Helm\n3. STNK' : '1. Kunci Utama\n2. Helm\n3. STNK'
    } else if (category === 'laptop_tik') {
      defaultKelengkapan = newJenis === 'pengembalian' ? '1. Charger\n2. Sleeve / Tas' : '1 Unit charger'
    } else {
      defaultKelengkapan = 'KIR Ruangan'
    }

    let nextLokasi = form.lokasi_tujuan
    if (newJenis === 'pengembalian') {
      const gudangOpt = RUANGAN_GEDUNG_ITJEN.find((r) => r.toLowerCase().includes('gudang'))
      nextLokasi = gudangOpt || RUANGAN_GEDUNG_ITJEN[0]
    }

    setForm({
      ...form,
      item_id: val,
      jenis_mutasi: newJenis,
      lokasi_tujuan: nextLokasi,
      penanggung_jawab: item?.penanggung_jawab || form.penanggung_jawab,
      kelengkapan: defaultKelengkapan,
    })
  }

  // Handler saat mengubah Jenis Mutasi (Penyerahan vs Pengembalian vs Mutasi Ruangan)
  function handleJenisMutasiChange(jenis) {
    const category = getItemTypeCategory(selectedItem)
    let nextLokasi = form.lokasi_tujuan
    let nextKelengkapan = form.kelengkapan

    if (jenis === 'pengembalian') {
      const gudangOpt = RUANGAN_GEDUNG_ITJEN.find((r) => r.toLowerCase().includes('gudang'))
      nextLokasi = gudangOpt || RUANGAN_GEDUNG_ITJEN[0]
      if (category === 'kendaraan') {
        nextKelengkapan = '1. Kunci Utama\n2. Helm\n3. STNK'
      } else if (category === 'laptop_tik') {
        nextKelengkapan = '1. Charger\n2. Sleeve / Tas'
      } else {
        nextKelengkapan = 'KIR Ruangan'
      }
    } else if (jenis === 'penyerahan') {
      if (category === 'kendaraan') {
        nextKelengkapan = '1. Kunci Utama\n2. Helm\n3. STNK'
      } else if (category === 'laptop_tik') {
        nextKelengkapan = '1 Unit charger'
      } else {
        nextKelengkapan = 'KIR Ruangan'
      }
    } else {
      nextKelengkapan = 'KIR Ruangan'
    }

    setForm({
      ...form,
      jenis_mutasi: jenis,
      lokasi_tujuan: nextLokasi,
      kelengkapan: nextKelengkapan,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    if (!form.item_id) {
      setFormError('Pilih barang yang akan dipindahkan.')
      setSubmitting(false)
      return
    }

    if (!form.lokasi_tujuan.trim()) {
      setFormError('Lokasi tujuan wajib diisi.')
      setSubmitting(false)
      return
    }

    const tagJenis = `[${form.jenis_mutasi.toUpperCase()}]`
    const kelengkapanStr = form.kelengkapan ? `[KELENGKAPAN: ${form.kelengkapan.replace(/\n/g, '; ')}]` : ''
    const fullKeterangan = `${tagJenis}${kelengkapanStr} ${form.keterangan}`.trim()

    const payload = {
      item_id: Number(form.item_id),
      lokasi_tujuan: form.lokasi_tujuan.trim(),
      tanggal_mutasi: form.tanggal_mutasi,
      penanggung_jawab: form.penanggung_jawab.trim(),
      keterangan: fullKeterangan,
      status_approval: 'menunggu',
    }

    try {
      await axios.post(MUTASI_API, payload)
      await fetchAll()
      setShowModal(false)
      showToast.success('Usulan Mutasi Dikirim', 'Perpindahan lokasi aset sedang menunggu persetujuan Admin/Pimpinan.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan mutasi.'
      setFormError(msg)
      showToast.error('Gagal Mengajukan Mutasi', msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const confirmed = await showAlert.confirm({
      title: 'Hapus Log Mutasi?',
      text: 'Riwayat perpindahan lokasi aset ini akan dihapus secara permanen.',
      confirmText: 'Ya, Hapus Log',
      cancelText: 'Batal',
      isDestructive: true,
    })
    if (!confirmed) return

    try {
      await axios.delete(`${MUTASI_API}/${id}`)
      await fetchAll()
      showToast.success('Log Mutasi Dihapus', 'Riwayat perpindahan lokasi berhasil dihapus.')
    } catch (err) {
      showAlert.error('Gagal Menghapus', err.response?.data?.message || 'Terjadi kesalahan saat menghapus log mutasi.')
    }
  }

  const filteredMutasi = mutasiList.filter((m) => {
    const term = search.toLowerCase()
    return (
      m.item?.itemName?.toLowerCase().includes(term) ||
      m.item?.itemCode?.toLowerCase().includes(term) ||
      m.lokasi_tujuan?.toLowerCase().includes(term) ||
      m.lokasi_asal?.toLowerCase().includes(term) ||
      m.penanggung_jawab?.toLowerCase().includes(term) ||
      m.keterangan?.toLowerCase().includes(term)
    )
  })

  function handleExportCSV() {
    const headers = [
      'No',
      'Tanggal Mutasi',
      'Kode Barang',
      'Nama Barang',
      'Jenis Transaksi',
      'Lokasi Asal',
      'Lokasi Tujuan',
      'Penanggung Jawab',
      'Status Approval',
      'Catatan Approval',
      'Disetujui Oleh',
      'Keterangan / Alasan',
    ]

    const rows = filteredMutasi.map((m, idx) => {
      const jn = getEffectiveJenisMutasi(m)
      const { cleanKeterangan } = parseMutasiKeterangan(m.keterangan)
      return [
        idx + 1,
        m.tanggal_mutasi || '',
        `"${m.item?.kode_bmn || m.item?.itemCode || ''}"`,
        `"${(m.item?.itemName || '').replace(/"/g, '""')}"`,
        `"${jn === 'penyerahan' ? 'Penyerahan' : jn === 'pengembalian' ? 'Pengembalian' : 'Mutasi Ruangan'}"`,
        `"${(m.lokasi_asal || '').replace(/"/g, '""')}"`,
        `"${(m.lokasi_tujuan || '').replace(/"/g, '""')}"`,
        `"${(m.penanggung_jawab || '').replace(/"/g, '""')}"`,
        `"${m.status_approval || 'menunggu'}"`,
        `"${(m.catatan_approval || '').replace(/"/g, '""')}"`,
        `"${(m.approved_by || '').replace(/"/g, '""')}"`,
        `"${cleanKeterangan.replace(/"/g, '""')}"`,
      ]
    })

    const csvContent = '\uFEFFsep=;\r\n' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Riwayat_Mutasi_BMN_Itjen_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className={printBast ? 'print:hidden' : ''}>
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <MapPin className="text-navy" size={26} />
              Pelacakan Lokasi & Berita Acara Serah Terima (BAST)
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              Audit trail perpindahan fisik aset antar ruangan & penerbitan BAST resmi (Penyerahan TIK, Pengembalian, Kendaraan Dinas, & KIR Ruangan)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-black/10 bg-white hover:bg-gray-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Unduh riwayat mutasi ke CSV / Excel"
            >
              <Download size={14} /> Export CSV
            </button>

            {!isPimpinan && (
              <Button onClick={() => openCreateModal()} className="bg-navy hover:bg-navy-light text-white shadow-sm flex items-center gap-2 text-xs">
                <Plus size={15} /> Catat Mutasi Baru
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Cari kode barang, nama, ruangan tujuan, atau penanggung jawab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-black/10 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-navy"
            />
          </div>
          <div className="text-xs text-ink/50 font-mono-ledger">
            Total: <span className="font-bold text-navy">{filteredMutasi.length}</span> Mutasi Tercatat
          </div>
        </div>

        {/* TABLE DATA */}
        <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-black/10 text-ink/60 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3 w-28">Tanggal</th>
                  <th className="px-4 py-3">Jenis Transaksi</th>
                  <th className="px-4 py-3">Nama & Kode BMN</th>
                  <th className="px-4 py-3">Rute Perpindahan Ruangan</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                  <th className="px-4 py-3">Keterangan / Alasan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center p-8 text-ink/40">
                      Memuat data log mutasi...
                    </td>
                  </tr>
                ) : filteredMutasi.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-8 text-ink/40">
                      Belum ada riwayat mutasi perpindahan aset.
                    </td>
                  </tr>
                ) : (
                  filteredMutasi.map((row) => {
                    const jenis = getEffectiveJenisMutasi(row)
                    const { cleanKeterangan } = parseMutasiKeterangan(row.keterangan)
                    const itemCat = getItemTypeCategory(row.item)

                    return (
                      <tr key={row._id || row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-ink/70">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-ink/40" />
                            {new Date(row.tanggal_mutasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        {/* BADGE JENIS TRANSAKSI */}
                        <td className="px-4 py-3.5">
                          {jenis === 'pengembalian' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              📥 Pengembalian
                            </span>
                          ) : jenis === 'penyerahan' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              📄 Penyerahan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              🏛️ Mutasi Ruangan
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                            {itemCat === 'kendaraan' ? (
                              <Car size={14} className="text-amber-600 shrink-0" />
                            ) : itemCat === 'laptop_tik' ? (
                              <Laptop size={14} className="text-navy shrink-0" />
                            ) : (
                              <Building2 size={14} className="text-slate-500 shrink-0" />
                            )}
                            <span>{row.item?.itemName || 'Barang tidak ditemukan'}</span>
                          </div>
                          <div className="font-mono text-[11px] text-navy font-bold">
                            {row.item?.itemCode} • NUP: {row.item?.nup || '0001'}
                            {row.item?.nomor_polisi && <span className="ml-1 text-slate-600">({row.item.nomor_polisi})</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {(() => {
                            const asal = parseRoomCodeAndName(row.lokasi_asal)
                            const tujuan = parseRoomCodeAndName(row.lokasi_tujuan)
                            return (
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block w-fit">
                                    {asal.code}
                                  </span>
                                  <span className="text-[10px] text-slate-500 max-w-[120px] truncate" title={row.lokasi_asal || asal.name}>
                                    {asal.name}
                                  </span>
                                </div>

                                <div className="flex flex-col items-center shrink-0 px-0.5">
                                  <ArrowRight size={13} className="text-navy" />
                                  <span className="text-[8px] font-mono text-navy/60 font-semibold uppercase">Rute</span>
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span className="font-mono text-[10px] font-bold text-navy bg-navy/10 px-1.5 py-0.5 rounded border border-navy/20 inline-block w-fit">
                                    {tujuan.code}
                                  </span>
                                  <span className="font-semibold text-navy text-[10px] max-w-[120px] truncate" title={row.lokasi_tujuan || tujuan.name}>
                                    {tujuan.name}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-ink text-xs">{row.penanggung_jawab || '—'}</div>
                          <div className="text-[10px] text-ink/40">
                            {jenis === 'pengembalian' ? 'Pengembali Barang' : 'Penanggung Jawab / Penerima'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-ink/70 max-w-xs truncate">{cleanKeterangan || '—'}</td>

                        <td className="px-4 py-3.5">
                          {row.status_approval === 'menunggu' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} className="animate-pulse" /> Menunggu Persetujuan
                            </span>
                          )}
                          {row.status_approval === 'disetujui' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> Disetujui
                            </span>
                          )}
                          {row.status_approval === 'ditolak' && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={12} /> Ditolak
                              </span>
                              {row.catatan_approval && (
                                <div className="text-[10px] text-red-600 mt-0.5 max-w-[150px] truncate" title={row.catatan_approval}>
                                  {row.catatan_approval}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          {/* TOMBOL CETAK BAST TUNGGAL SESUAI JENIS TRANSAKSI */}
                          {row.status_approval === 'disetujui' ? (
                            <button
                              onClick={() => handleOpenBast(row)}
                              className="inline-flex items-center gap-1.5 text-xs border border-navy/30 text-navy hover:bg-navy/5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                              title="Cetak Dokumen BAST Resmi Kemendagri"
                            >
                              <Printer size={13} />
                              {jenis === 'pengembalian'
                                ? 'Cetak BAST Pengembalian'
                                : jenis === 'penyerahan'
                                ? 'Cetak BAST Penyerahan'
                                : 'Cetak BAST Mutasi Ruangan'}
                            </button>
                          ) : (
                            <span className="inline-block text-[11px] text-ink/40 italic py-1.5">Menunggu Approval</span>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(row._id || row.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Hapus riwayat"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM CATAT MUTASI */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
              {/* MODAL HEADER */}
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center font-bold">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 tracking-tight">Pencatatan Mutasi Lokasi & Terbitkan BAST</h3>
                    <p className="text-[11px] text-slate-500">Form Transaksi Perpindahan / Serah Terima / Pengembalian BMN Kemendagri</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
                      <AlertCircle size={15} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* SEGMENTED CONTROL: JENIS TRANSAKSI MUTASI */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right">
                      Jenis Transaksi BAST <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleJenisMutasiChange('penyerahan')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          form.jenis_mutasi === 'penyerahan' ? 'bg-navy text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        <FileText size={14} />
                        <span>Penyerahan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleJenisMutasiChange('pengembalian')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          form.jenis_mutasi === 'pengembalian' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        <Clock size={14} />
                        <span>Pengembalian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleJenisMutasiChange('mutasi_ruangan')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          form.jenis_mutasi === 'mutasi_ruangan' ? 'bg-slate-800 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        <Building2 size={14} />
                        <span>Mutasi Ruangan</span>
                      </button>
                    </div>
                  </div>

                  {/* Pilih Barang BMN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Barang BMN <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <SearchableSelect
                        value={form.item_id}
                        onChange={handleItemChange}
                        options={itemList.map((i) => ({
                          value: i.id || i._id,
                          label: `${i.itemName} (${i.itemCode} • NUP: ${i.nup || '0001'}) - Saat ini: ${i.lokasi_ruangan || '-'}`,
                        }))}
                        placeholder="Pilih / cari barang BMN..."
                        required
                      />
                    </div>
                  </div>

                  {selectedItem && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                      <div className="sm:col-span-4 sm:text-right text-[11px] text-slate-400">Informasi Barang:</div>
                      <div className="sm:col-span-8 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>
                            Lokasi Saat Ini: <strong className="text-navy">{selectedItem.lokasi_ruangan || 'Belum Ditentukan'}</strong>
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              getItemTypeCategory(selectedItem) === 'kendaraan'
                                ? 'bg-amber-100 text-amber-800'
                                : getItemTypeCategory(selectedItem) === 'laptop_tik'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {getItemTypeCategory(selectedItem) === 'kendaraan'
                              ? '🚗 Kendaraan Dinas'
                              : getItemTypeCategory(selectedItem) === 'laptop_tik'
                              ? '💻 Laptop / TIK'
                              : '🏢 Barang Tetap Ruangan'}
                          </span>
                        </div>
                        <div>
                          PJ Terakhir: <strong>{selectedItem.penanggung_jawab || 'Belum Ditentukan'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lokasi Ruangan Tujuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Ruangan Tujuan <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <SearchableSelect
                        value={form.lokasi_tujuan}
                        onChange={(val) => setForm({ ...form, lokasi_tujuan: val })}
                        options={RUANGAN_GEDUNG_ITJEN.map((r) => ({
                          value: r,
                          label: r,
                        }))}
                        placeholder="Pilih / cari ruangan tujuan..."
                        required
                      />
                    </div>
                  </div>

                  {/* Tanggal Mutasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      Tanggal Mutasi <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="sm:col-span-8">
                      <Input
                        type="date"
                        value={form.tanggal_mutasi}
                        onChange={(e) => setForm({ ...form, tanggal_mutasi: e.target.value })}
                        required
                        className="text-xs h-9 border-slate-300 focus:border-navy"
                      />
                    </div>
                  </div>

                  {/* Penanggung Jawab */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right">
                      {form.jenis_mutasi === 'pengembalian' ? 'Pegawai Pengembali:' : 'Penanggung Jawab / Penerima:'}
                    </label>
                    <div className="sm:col-span-8">
                      <SearchableSelect
                        value={form.penanggung_jawab}
                        onChange={(val) => setForm({ ...form, penanggung_jawab: val })}
                        options={userList}
                        placeholder="Pilih pegawai terdaftar atau ketik nama langsung..."
                        isCreatable={true}
                        formatCreateLabel={(inputValue) => `Gunakan nama manual: "${inputValue}"`}
                      />
                    </div>
                  </div>

                  {/* Kelengkapan Barang / Kendaraan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">Kelengkapan Barang:</label>
                    <div className="sm:col-span-8">
                      <textarea
                        value={form.kelengkapan}
                        onChange={(e) => setForm({ ...form, kelengkapan: e.target.value })}
                        placeholder="Detail kelengkapan (Charger, Helm, STNK, Kunci, dll)..."
                        rows={2}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                      />
                    </div>
                  </div>

                  {/* Alasan Pemindahan */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                    <label className="sm:col-span-4 text-xs font-medium text-slate-700 sm:text-right pt-2">Catatan / Alasan:</label>
                    <div className="sm:col-span-8">
                      <textarea
                        value={form.keterangan}
                        onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                        placeholder="Alasan mutasi / fasilitas kerja dinas..."
                        rows={2}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-navy resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                  <Button type="button" variant="outline" onClick={closeModal} className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg">
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm">
                    {submitting ? 'Menyimpan...' : 'Simpan & Update Lokasi'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CETAK BAST RESMI DOKUMEN CETAK PERSIS GAMBAR 1, 2, 3, 4 & KIR */}
      {printBast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:border-none print:shadow-none">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 sm:p-10 my-4 sm:my-6 border border-black/10 print:static print:my-0 print:p-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
            {/* TOOLBAR MODAL CETAK */}
            <div className="sticky -top-6 sm:-top-10 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3.5 bg-white/95 backdrop-blur border-b border-black/10 mb-6 rounded-t-2xl flex items-center justify-between gap-3 z-20 print:hidden shadow-xs">
              <div>
                <span className="text-xs font-bold text-navy uppercase tracking-wider block">Preview Dokumen BAST Resmi</span>
                <span className="text-[11px] text-gray-500">Terdeteksi Otomatis Format Resmi Kemendagri</span>
              </div>

              {/* INDIKATOR TEMPLATE OTOMATIS TANPA TOGGLE */}
              <div className="flex items-center gap-2">
                {(() => {
                  const jn = getEffectiveJenisMutasi(printBast)
                  const cat = getItemTypeCategory(printBast.item)

                  if (cat === 'kendaraan') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        <Car size={14} /> BAST {jn === 'pengembalian' ? 'Pengembalian' : 'Penyerahan'} Kendaraan Dinas
                      </span>
                    )
                  }
                  if (cat === 'laptop_tik') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy bg-navy/10 px-3 py-1.5 rounded-lg border border-navy/20">
                        <Laptop size={14} /> BAST {jn === 'pengembalian' ? 'Pengembalian' : 'Penyerahan'} TIK / Laptop
                      </span>
                    )
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Building2 size={14} /> BAST Mutasi Ruangan (KIR)
                    </span>
                  )
                })()}

                <button
                  onClick={() => setPrintBast(null)}
                  className="px-3 py-1.5 text-xs text-ink/70 hover:bg-gray-100 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <Button onClick={() => window.print()} className="bg-navy hover:bg-navy-light text-white flex items-center gap-1.5 text-xs h-8 px-3.5 shadow-sm cursor-pointer">
                  <Printer size={14} /> Cetak (A4)
                </Button>
              </div>
            </div>

            {/* RENDERING DOKUMEN CETAK SESUAI 5 FORMAT RESMI */}
            {(() => {
              const jenisMutasi = getEffectiveJenisMutasi(printBast)
              const itemCat = getItemTypeCategory(printBast.item)
              const { kelengkapan: customKelengkapan } = parseMutasiKeterangan(printBast.keterangan)

              const asal = parseRoomCodeAndName(printBast.lokasi_asal)
              const tujuan = parseRoomCodeAndName(printBast.lokasi_tujuan)

              // Lookup data pegawai penerima / pengembali dari master data pegawai
              const targetPegawai = pegawaiList.find(
                (p) => p.nama && p.nama.toLowerCase().trim() === (printBast.penanggung_jawab || '').toLowerCase().trim()
              )
              const namaPihakKedua = targetPegawai?.nama || printBast.penanggung_jawab || '.............................................................'
              const nipPihakKedua = targetPegawai?.nip || '.............................................................'
              const jabatanPihakKedua = targetPegawai?.jabatan
                ? `${targetPegawai.jabatan} Pada Inspektorat Jenderal Kementerian Dalam Negeri`
                : targetPegawai?.unit_kerja
                ? `Pegawai pada ${targetPegawai.unit_kerja} Kementerian Dalam Negeri`
                : 'Kementerian Dalam Negeri'

              // Atur No Surat BAST Resmi
              const docIdPad = String(printBast.id || 1).padStart(3, '0')
              let docNo = `000.3.3.2/${docIdPad}/ITJEN`
              if (itemCat === 'kendaraan') {
                docNo = jenisMutasi === 'pengembalian' ? `000.3.3.2/${docIdPad}/ITJEN` : `000.3.3.2/${docIdPad}/ITJEN`
              }

              // --- FORMAT 1 & 2: KENDARAAN DINAS (GAMBAR 3 PENYERAHAN & GAMBAR 4 PENGEMBALIAN) ---
              if (itemCat === 'kendaraan') {
                const item = printBast.item || {}
                const jenisKendaraanDisplay = item.jenis_kendaraan || (item.itemName?.toLowerCase().includes('motor') ? 'Sepeda Motor' : 'Kendaraan Dinas Wheel Drive')
                const merkStr = item.merk_tipe?.split(' ')[0] || item.itemName?.split(' ')[0] || 'Toyota'
                const tipeStr = item.merk_tipe || item.itemName || 'Fortuner 2.8 VRZ'
                const warnaStr = item.warna || 'Hitam Metalik'
                const nopolStr = item.nomor_polisi || 'B 1042 RFN'
                const noRangkaStr = item.no_rangka || 'MHFXW83G47812930'
                const noMesinStr = item.no_mesin || '1GD0982341'
                const thBuatStr = item.tahunPerolehan || '2022'

                return (
                  <div className="doc-print-area font-sans text-black leading-tight">
                    {/* KOP SURAT */}
                    <div className="border-b-4 border-double border-black pb-2 mb-3">
                      <div className="flex items-center gap-3">
                        <img src={logoKemendagri} alt="Logo Kemendagri" className="w-14 h-16 object-contain shrink-0" />
                        <div className="text-center flex-1 pr-6 font-sans">
                          <p className="text-xs font-semibold tracking-wider uppercase text-black">
                            KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                          </p>
                          <p className="text-base font-bold uppercase tracking-tight text-black mt-0.5">INSPEKTORAT JENDERAL</p>
                          <p className="text-[9.5px] text-black leading-tight mt-0.5">
                            Jalan Medan Merdeka Timur nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                            Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* JUDUL BAST KENDARAAN */}
                    <div className="text-center mb-3">
                      <h2 className="text-xs font-bold uppercase tracking-wide">
                        {jenisMutasi === 'pengembalian'
                          ? 'BERITA ACARA SERAH TERIMA PENGEMBALIAN KENDARAAN DINAS'
                          : 'BERITA ACARA SERAH TERIMA KENDARAAN DINAS'}
                      </h2>
                      <h3 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                        INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                      </h3>
                      <p className="text-[10px] font-mono mt-0.5">Nomor : {docNo}</p>
                    </div>

                    {/* ISI DOKUMEN */}
                    <div className="text-[10.5px] leading-tight space-y-2 text-justify">
                      <p>{formatTanggalTerbilang(printBast.tanggal_mutasi)}</p>

                      {/* PIHAK PERTAMA & KEDUA */}
                      <div className="space-y-1.5 pl-2 text-[10px]">
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">1.</span>
                          <span className="col-span-2">Nama</span>
                          <span className="col-span-9 font-bold">: Andi Agung Febrianto, S.STP, M.Kessos</span>

                          <span className="col-span-1"></span>
                          <span className="col-span-2">NIP</span>
                          <span className="col-span-9 font-mono">: 19900217 201206 1 002</span>

                          <span className="col-span-1"></span>
                          <span className="col-span-2">Jabatan</span>
                          <span className="col-span-9">
                            : Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Pertama</em>.
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">2.</span>
                          <span className="col-span-2">Nama</span>
                          <span className="col-span-9 font-bold">: {namaPihakKedua}</span>

                          <span className="col-span-1"></span>
                          <span className="col-span-2">NIP</span>
                          <span className="col-span-9 font-mono">: {nipPihakKedua}</span>

                          <span className="col-span-1"></span>
                          <span className="col-span-2">Jabatan</span>
                          <span className="col-span-9">: {jabatanPihakKedua}, selanjutnya disebut sebagai <em>Pihak Kedua</em>.</span>
                        </div>
                      </div>

                      <p className="pt-0.5 text-[10px]">
                        Dengan ini kedua belah pihak sepakat melakukan Serah Terima Kendaraan Dinas Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                      </p>

                      {/* BUTIR 1: PENYERAHAN / PENGEMBALIAN KENDARAAN */}
                      <div className="space-y-1.5 pl-1 text-[10px] leading-tight">
                        <div className="flex items-start gap-1.5">
                          <span>1.</span>
                          <div className="flex-1">
                            {jenisMutasi === 'pengembalian' ? (
                              <>
                                <em>Pihak Kedua</em> menyerahkan dan mengembalikan Kendaraan Dinas Inventaris Inspektorat Jenderal Kemendagri untuk kepentingan dinas dengan spesifikasi dan kelengkapan sebagai berikut :
                              </>
                            ) : (
                              <>
                                <em>Pihak Pertama</em> menyerahkan Kendaraan Dinas Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dalam keadaan baik dengan spesifikasi dan kelengkapan sebagai berikut :
                              </>
                            )}

                            {/* TABEL SPESIFIKASI KENDARAAN DINAS (PERSIS GAMBAR 3 & GAMBAR 4) */}
                            <table className="w-full text-[9.5px] border-collapse border border-black my-1.5 font-sans">
                              <thead>
                                <tr className="bg-gray-50 text-center font-bold">
                                  <th className="border border-black px-1.5 py-1 w-8">No.</th>
                                  <th className="border border-black px-1.5 py-1 w-36">Jenis Barang</th>
                                  <th className="border border-black px-1.5 py-1">Spesifikasi / Merk</th>
                                  <th className="border border-black px-1.5 py-1 w-16">Jumlah</th>
                                  <th className="border border-black px-1.5 py-1 w-32">Kelengkapan</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="align-top">
                                  <td className="border border-black px-1.5 py-1 text-center font-bold">1.</td>
                                  <td className="border border-black px-1.5 py-1 font-semibold">
                                    {jenisKendaraanDisplay}
                                    <span className="block text-[8.5px] font-mono text-black/80 font-normal">
                                      {item.kode_bmn || item.itemCode || '3.02.01.01.002'}
                                    </span>
                                  </td>
                                  <td className="border border-black px-1.5 py-1 space-y-0.5">
                                    <p><strong>Merk :</strong> {merkStr}</p>
                                    <p><strong>Tipe :</strong> {tipeStr}</p>
                                    <p><strong>Warna :</strong> {warnaStr}</p>
                                    <p><strong>No. Rangka :</strong> {noRangkaStr}</p>
                                    <p><strong>No. Mesin :</strong> {noMesinStr}</p>
                                    <p><strong>Th. Buat :</strong> {thBuatStr}</p>
                                    <p><strong>Nopol :</strong> {nopolStr}</p>
                                  </td>
                                  <td className="border border-black px-1.5 py-1 text-center font-semibold">1 Unit</td>
                                  <td className="border border-black px-1.5 py-1">
                                    {customKelengkapan ? (
                                      <div>{customKelengkapan.split('; ').map((k, idx) => <p key={idx}>{k}</p>)}</div>
                                    ) : (
                                      <div>
                                        <p>1. Kunci Utama</p>
                                        <p>2. {item.itemName?.toLowerCase().includes('motor') ? 'Helm' : 'STNK'}</p>
                                        <p>3. STNK</p>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* POIN-POIN KETENTUAN KENDARAAN */}
                        {jenisMutasi === 'pengembalian' ? (
                          <>
                            {/* GAMBAR 4: KETENTUAN PENGEMBALIAN KENDARAAN DINAS */}
                            <div className="flex items-start gap-1.5">
                              <span>2.</span>
                              <p className="flex-1">
                                <em>Pihak Pertama</em> berhak menyimpan atau mendistribusikan Kendaraan Dinas Inventaris tersebut untuk kepentingan dinas.
                              </p>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <span>3.</span>
                              <p className="flex-1">
                                <em>Pihak Pertama</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* GAMBAR 3: KETENTUAN PENYERAHAN KENDARAAN DINAS */}
                            <div className="flex items-start gap-1.5">
                              <span>2.</span>
                              <p className="flex-1">
                                <em>Pihak Kedua</em> berhak menggunakan Kendaraan Dinas Inventaris dimaksud sepanjang untuk kepentingan dinas.
                              </p>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <span>3.</span>
                              <p className="flex-1">
                                <em>Pihak Kedua</em> bertanggungjawab atas pengoperasian, perawatan, pemeliharaan dan pengamanan.
                              </p>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <span>4.</span>
                              <p className="flex-1">
                                <em>Pihak Kedua</em> dilarang mengubah bentuk, warna dan ukuran serta dilarang merubah status kepemilikan.
                              </p>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <span>5.</span>
                              <p className="flex-1">
                                Apabila Kendaraan Dinas Inventaris dimaksud hilang ataupun mengalami kerusakan karena kelalaian <em>Pihak Kedua</em>, maka <em>Pihak Kedua</em> memiliki kewajiban untuk mengganti dan memperbaiki Kendaraan Dinas Inventaris tersebut.
                              </p>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <span>6.</span>
                              <p className="flex-1">
                                <em>Pihak Pertama</em> sewaktu-waktu dapat menarik kembali Kendaraan Dinas Inventaris dimaksud guna memenuhi kebutuhan organisasi yang bersifat mendesak.
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <p className="pt-1 text-[10px]">
                        {jenisMutasi === 'pengembalian'
                          ? 'Demikian Berita Acara Serah Terima Pengembalian Kendaraan Dinas Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.'
                          : 'Demikian Berita Acara Serah Terima Kendaraan Dinas Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.'}
                      </p>

                      {/* TANDA TANGAN */}
                      <div className="pt-3 space-y-3 font-sans break-inside-avoid">
                        <div className="grid grid-cols-2 text-center text-[10.5px]">
                          <div>
                            <p className="font-bold tracking-wide uppercase mb-8">PIHAK PERTAMA</p>
                            <p className="font-bold underline text-black">Andi Agung Febrianto, S.STP, M.Kessos</p>
                            <p className="text-[9.5px] font-mono mt-0.5">NIP. 19900217 201206 1 002</p>
                          </div>

                          <div>
                            <p className="font-bold tracking-wide uppercase mb-8">PIHAK KEDUA</p>
                            <p className="font-bold underline text-black">{namaPihakKedua}</p>
                            <p className="text-[9.5px] font-mono mt-0.5">NIP. {nipPihakKedua}</p>
                          </div>
                        </div>

                        <div className="text-center text-[10.5px] pt-1">
                          <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                          <p className="text-[10px] mb-8">Sekretaris,</p>
                          <p className="font-bold underline text-black">Dr. Ir. Bachril Bakri, M.App.Sc</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. 19661122 199303 1 001</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              // --- FORMAT 3 & 4 & 5: TIK / LAPTOP / BARANG TETAP (GAMBAR 1, 2, & KIR) ---
              const item = printBast.item || {}
              const rawMerkTipe = item.merk_tipe || ''
              let merkDisplay = rawMerkTipe.split(' ')[0] || item.itemName || 'Notebook HP'
              let tipeDisplay = rawMerkTipe || (item.nomor_seri ? `SN: ${item.nomor_seri}` : '240 G6 Intel Core i5-7200U')
              if (rawMerkTipe.toLowerCase().startsWith('asus')) {
                merkDisplay = 'Asus'
                tipeDisplay = rawMerkTipe.replace(/^asus\s*/i, '') || 'Zenbook 14 OLED UX3405CA'
              } else if (rawMerkTipe.toLowerCase().startsWith('lenovo')) {
                merkDisplay = 'Lenovo'
                tipeDisplay = rawMerkTipe.replace(/^lenovo\s*/i, '') || 'ThinkPad T14s'
              } else if (rawMerkTipe.toLowerCase().startsWith('hp')) {
                merkDisplay = 'Notebook HP'
                tipeDisplay = rawMerkTipe.replace(/^hp\s*/i, '') || '240 G6 Intel Core i5-7200U'
              }

              return (
                <div className="doc-print-area font-sans text-black leading-tight">
                  {/* KOP SURAT */}
                  <div className="border-b-4 border-double border-black pb-2 mb-3">
                    <div className="flex items-center gap-3">
                      <img src={logoKemendagri} alt="Logo Kemendagri" className="w-14 h-16 object-contain shrink-0" />
                      <div className="text-center flex-1 pr-6 font-sans">
                        <p className="text-xs font-semibold tracking-wider uppercase text-black">
                          KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                        </p>
                        <p className="text-base font-bold uppercase tracking-tight text-black mt-0.5">INSPEKTORAT JENDERAL</p>
                        <p className="text-[9.5px] text-black leading-tight mt-0.5">
                          Jalan Medan Merdeka Timur nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                          Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* JUDUL BAST */}
                  <div className="text-center mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wide">
                      {jenisMutasi === 'pengembalian'
                        ? 'BERITA ACARA SERAH TERIMA PENGEMBALIAN'
                        : jenisMutasi === 'mutasi_ruangan'
                        ? 'BERITA ACARA SERAH TERIMA MUTASI RUANGAN'
                        : 'BERITA ACARA SERAH TERIMA'}
                    </h2>
                    <h3 className="text-xs font-bold uppercase tracking-wide border-b border-black inline-block pb-0.5">
                      INVENTARIS INSPEKTORAT JENDERAL KEMENTERIAN DALAM NEGERI
                    </h3>
                    <p className="text-[10px] font-mono mt-0.5">Nomor : {docNo}</p>
                  </div>

                  {/* ISI DOKUMEN */}
                  <div className="text-[10.5px] leading-tight space-y-2 text-justify">
                    <p>{formatTanggalTerbilang(printBast.tanggal_mutasi)}</p>

                    {/* IDENTITAS PIHAK PERTAMA & KEDUA */}
                    <div className="space-y-1.5 pl-2 text-[10px]">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">1.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: Andi Agung Febrianto, S.STP, M.Kessos</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: 19900217 201206 1 002</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          : Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Pertama</em>.
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">2.</span>
                        <span className="col-span-2">Nama</span>
                        <span className="col-span-9 font-bold">: {namaPihakKedua}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">NIP</span>
                        <span className="col-span-9 font-mono">: {nipPihakKedua}</span>

                        <span className="col-span-1"></span>
                        <span className="col-span-2">Jabatan</span>
                        <span className="col-span-9">
                          {jenisMutasi === 'mutasi_ruangan' ? (
                            <>
                              : Penanggung Jawab Ruangan <strong>[{tujuan.code}] {tujuan.name}</strong> Inspektorat Jenderal Kementerian Dalam Negeri, selanjutnya disebut sebagai <em>Pihak Kedua</em>.
                            </>
                          ) : (
                            <>
                              : {jabatanPihakKedua}, selanjutnya disebut sebagai <em>Pihak Kedua</em>.
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="pt-0.5 text-[10px]">
                      Dengan ini kedua belah pihak sepakat melakukan Serah Terima Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dengan ketentuan sebagai berikut :
                    </p>

                    {/* BUTIR 1 */}
                    <div className="space-y-1.5 pl-1 text-[10px] leading-tight">
                      <div className="flex items-start gap-1.5">
                        <span>1.</span>
                        <div className="flex-1">
                          {jenisMutasi === 'pengembalian' ? (
                            <>
                              <em>Pihak Kedua</em> menyerahkan dan mengembalikan Barang Inventaris Inspektorat Jenderal Kemendagri untuk kepentingan dinas dengan spesifikasi dan kelengkapan sebagai berikut :
                            </>
                          ) : jenisMutasi === 'mutasi_ruangan' ? (
                            <>
                              <em>Pihak Pertama</em> menyerahkan Barang Inventaris Tetap Inspektorat Jenderal Kementerian Dalam Negeri untuk ditempatkan pada ruangan <strong>[{tujuan.code}] {tujuan.name}</strong> dalam keadaan baik dengan spesifikasi sebagai berikut :
                            </>
                          ) : (
                            <>
                              <em>Pihak Pertama</em> menyerahkan Barang Inventaris Inspektorat Jenderal Kementerian Dalam Negeri dalam keadaan baik dengan spesifikasi dan kelengkapan sebagai berikut :
                            </>
                          )}

                          {/* TABEL BARANG (GAMBAR 1 & GAMBAR 2 & KIR) */}
                          <table className="w-full text-[9.5px] border-collapse border border-black my-1.5 font-sans">
                            <thead>
                              <tr className="bg-gray-50 text-center font-bold">
                                <th className="border border-black px-1.5 py-1 w-8">
                                  {jenisMutasi === 'pengembalian' ? 'No' : 'No.'}
                                </th>
                                <th className="border border-black px-1.5 py-1 w-44">Jenis Barang</th>
                                <th className="border border-black px-1.5 py-1">
                                  {jenisMutasi === 'pengembalian' ? 'Spesifikasi / Merk' : 'Spesifikasi/Merk'}
                                </th>
                                <th className="border border-black px-1.5 py-1 w-16">Jumlah</th>
                                <th className="border border-black px-1.5 py-1 w-36">Kelengkapan</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="align-top">
                                <td className="border border-black px-1.5 py-1 text-center font-bold">1.</td>
                                <td className="border border-black px-1.5 py-1 font-semibold">
                                  {item.itemName || 'Notebook'}
                                  <span className="block text-[8.5px] font-mono text-black/80 font-normal">
                                    {item.kode_bmn || item.itemCode || '3.10.01.02.003.224'}
                                  </span>
                                </td>
                                <td className="border border-black px-1.5 py-1">
                                  <p><strong>Merk:</strong> {merkDisplay}</p>
                                  <p><strong>Tipe:</strong> {tipeDisplay}</p>
                                  {item.nomor_seri && <p className="text-[8.5px] text-black/70">SN: {item.nomor_seri}</p>}
                                </td>
                                <td className="border border-black px-1.5 py-1 text-center font-semibold">1 Unit</td>
                                <td className="border border-black px-1.5 py-1">
                                  {customKelengkapan ? (
                                    <div>{customKelengkapan.split('; ').map((k, idx) => <p key={idx}>{k}</p>)}</div>
                                  ) : jenisMutasi === 'pengembalian' ? (
                                    <div>
                                      <p>1. Charger</p>
                                      <p>2. Sleeve / Tas</p>
                                    </div>
                                  ) : jenisMutasi === 'mutasi_ruangan' ? (
                                    <div>
                                      <p>KIR Ruangan</p>
                                      <p className="text-[8.5px] text-black/70">
                                        Rute: [{asal.code}] ➔ [{tujuan.code}]
                                      </p>
                                    </div>
                                  ) : (
                                    <p>1 Unit charger</p>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* KETENTUAN SPESIFIK */}
                      {jenisMutasi === 'pengembalian' ? (
                        <>
                          {/* GAMBAR 2: PENGEMBALIAN LAPTOP/TIK */}
                          <div className="flex items-start gap-1.5">
                            <span>2.</span>
                            <p className="flex-1">
                              <em>Pihak Pertama</em> berhak menyimpan atau mendistribusikan barang inventaris tersebut untuk kepentingan dinas.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>3.</span>
                            <p className="flex-1">
                              <em>Pihak Pertama</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.
                            </p>
                          </div>
                        </>
                      ) : jenisMutasi === 'mutasi_ruangan' ? (
                        <>
                          {/* BARANG TETAP RUANGAN (KIR) */}
                          <div className="flex items-start gap-1.5">
                            <span>2.</span>
                            <p className="flex-1">
                              Barang inventaris tetap tersebut wajib dicatat dan diinventarisasi pada <strong>Kartu Inventaris Ruangan (KIR)</strong> ruangan tujuan <strong>[{tujuan.code}] {tujuan.name}</strong>.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>3.</span>
                            <p className="flex-1">
                              <em>Pihak Kedua</em> bertanggung jawab penuh atas keutuhan fisik, keamanan, dan pemeliharaan barang inventaris di dalam ruangan tersebut untuk kepentingan dinas.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>4.</span>
                            <p className="flex-1">
                              Barang inventaris tetap <strong>dilarang dipindahkan keluar dari ruangan</strong> tanpa koordinasi dan persetujuan tertulis dari Pengelola BMN (Bagian Umum dan Keuangan).
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>5.</span>
                            <p className="flex-1">
                              Apabila terjadi kerusakan atau kebutuhan pemeliharaan, <em>Pihak Kedua</em> segera mengajukan usulan perbaikan melalui sistem pengajuan servis BMN Itjen Kemendagri.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>6.</span>
                            <p className="flex-1">
                              Apabila terjadi renovasi atau perubahan tata letak ruangan kantor, pemindahan barang wajib dituangkan kembali dalam Berita Acara Serah Terima Mutasi Ruangan yang baru.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* GAMBAR 1: PENYERAHAN LAPTOP/TIK */}
                          <div className="flex items-start gap-1.5">
                            <span>2.</span>
                            <p className="flex-1">
                              <em>Pihak Kedua</em> berhak menggunakan barang inventaris tersebut sepanjang untuk kepentingan dinas.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>3.</span>
                            <p className="flex-1">
                              <em>Pihak Kedua</em> bertanggungjawab atas perawatan, pemeliharaan dan pengamanan.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>4.</span>
                            <p className="flex-1">
                              <em>Pihak Kedua</em> dilarang merubah bentuk, warna dan ukuran serta dilarang menjual, menggadaikan dan pinjam pakai kepada pihak lainnya.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>5.</span>
                            <p className="flex-1">
                              Apabila barang inventaris tersebut hilang ataupun mengalami kerusakan karena kelalaian <em>Pihak Kedua</em>, maka <em>Pihak Kedua</em> memiliki kewajiban untuk mengganti dan memperbaiki barang inventaris tersebut.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>6.</span>
                            <p className="flex-1">
                              <em>Pihak pertama</em> sewaktu-waktu dapat menarik kembali barang inventaris dimaksud guna memenuhi kebutuhan organisasi yang bersifat mendesak.
                            </p>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span>7.</span>
                            <p className="flex-1">
                              Apabila <em>Pihak Kedua</em> pindah/keluar instansi maka barang inventaris tersebut harus diserahkan kepada Pejabat Pengganti atas sepengetahuan <em>Pihak Pertama</em> dan tidak boleh dibawa.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="pt-1 text-[10px]">
                      {jenisMutasi === 'pengembalian'
                        ? 'Demikian Berita Acara Serah Terima Barang Inventaris Inspektorat Jenderal Kemendagri ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.'
                        : 'Demikian Berita Acara Serah Terima Barang Inventaris ini dibuat 2 (dua) rangkap dan ditandatangani oleh kedua belah pihak untuk dapat dipergunakan sebagaimana mestinya.'}
                    </p>

                    {/* TANDA TANGAN */}
                    <div className="pt-3 space-y-3 font-sans break-inside-avoid">
                      <div className="grid grid-cols-2 text-center text-[10.5px]">
                        <div>
                          <p className="font-bold tracking-wide uppercase mb-8">PIHAK PERTAMA</p>
                          <p className="font-bold underline text-black">Andi Agung Febrianto, S.STP, M.Kessos</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. 19900217 201206 1 002</p>
                        </div>

                        <div>
                          <p className="font-bold tracking-wide uppercase mb-8">PIHAK KEDUA</p>
                          <p className="font-bold underline text-black">{namaPihakKedua}</p>
                          <p className="text-[9.5px] font-mono mt-0.5">NIP. {nipPihakKedua}</p>
                        </div>
                      </div>

                      <div className="text-center text-[10.5px] pt-1">
                        <p className="font-bold tracking-wide uppercase">MENGETAHUI</p>
                        <p className="text-[10px] mb-8">Sekretaris,</p>
                        <p className="font-bold underline text-black">Dr. Ir. Bachril Bakri, M.App.Sc</p>
                        <p className="text-[9.5px] font-mono mt-0.5">NIP. 19661122 199303 1 001</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Pelacakan
