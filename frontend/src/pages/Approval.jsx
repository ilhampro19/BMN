import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Clock,
  Laptop,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertCircle,
  FileText,
  Check,
  X,
  Wrench,
  User,
  DollarSign,
  Info,
  Car,
  Printer,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { showAlert, showToast } from '../lib/alerts'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

function getUnitDetails(unitName = '') {
  const u = (unitName || '').toLowerCase()
  if (u.includes('wilayah 1') || u.includes('wilayah i') || u.includes('inspektorat 1') || u.includes('inspektorat i')) {
    return {
      code: 'Insp.I',
      jabatan: 'Inspektur Wilayah I',
      nama: 'Dr. Drs. Teguh Narutomo, M.M.',
      pangkat: 'Pembina Utama Madya (IV/d)',
      nip: '196708151993031001',
    }
  }
  if (u.includes('wilayah 2') || u.includes('wilayah ii') || u.includes('inspektorat 2') || u.includes('inspektorat ii')) {
    return {
      code: 'Insp.II',
      jabatan: 'Inspektur Wilayah II',
      nama: 'Dedi Winarwan, S.STP, M.Si',
      pangkat: 'Pembina Utama Muda (IV/c)',
      nip: '197711201997111001',
    }
  }
  if (u.includes('wilayah 3') || u.includes('wilayah iii') || u.includes('inspektorat 3') || u.includes('inspektorat iii')) {
    return {
      code: 'Insp.III',
      jabatan: 'Inspektur III',
      nama: 'Dr. Drs. Andi Muhammad Yusuf, M.Si',
      pangkat: 'Pembina Utama Madya (IV/d)',
      nip: '197306091993111002',
    }
  }
  if (u.includes('wilayah 4') || u.includes('wilayah iv') || u.includes('inspektorat 4') || u.includes('inspektorat iv')) {
    return {
      code: 'Insp.IV',
      jabatan: 'Inspektur Wilayah IV',
      nama: 'Dr. Arsan Latif, M.Si',
      pangkat: 'Pembina Utama Madya (IV/d)',
      nip: '196909051992031003',
    }
  }
  if (u.includes('khusus')) {
    return {
      code: 'Insp.Khusus',
      jabatan: 'Inspektur Khusus',
      nama: 'Teguh Hariono, S.T., M.Si',
      pangkat: 'Pembina Utama Muda (IV/c)',
      nip: '197204121998031002',
    }
  }
  return {
    code: 'Set.Itjen',
    jabatan: 'Sekretaris Inspektorat Jenderal',
    nama: 'Ahmad Husin Tambunan, S.STP, M.Si',
    pangkat: 'Pembina Utama Madya (IV/d)',
    nip: '197605151995111001',
  }
}

const WASRIK_API = `${API_BASE_URL}/peminjaman-wasrik`
const MUTASI_API = `${API_BASE_URL}/mutasi-lokasi`
const SERVIS_API = `${API_BASE_URL}/pengajuan-servis`

function Approval() {
  const { user } = useAuth()
  const isOperator = user?.role === 'operator'
  const isPimpinan = user?.role === 'pimpinan'
  const isAdmin = user?.role === 'admin'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabQuery = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    tabQuery === 'mutasi' || tabQuery === 'wasrik' ? tabQuery : 'servis'
  )

  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab === 'servis' || currentTab === 'mutasi' || currentTab === 'wasrik') {
      setActiveTab(currentTab)
    } else if (!currentTab) {
      setActiveTab('servis')
    }
  }, [searchParams])

  function handleTabChange(tabKey) {
    setActiveTab(tabKey)
    setSearchParams({ tab: tabKey })
  }
  const [servisList, setServisList] = useState([])
  const [mutasiList, setMutasiList] = useState([])
  const [wasrikList, setWasrikList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal Approval / Rejection
  // selectedAction: { type: 'approve' | 'reject', item: obj, category: 'servis_operator' | 'servis_pimpinan' | 'mutasi' | 'wasrik' }
  const [selectedAction, setSelectedAction] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [estimasiBiaya, setEstimasiBiaya] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Selesai Servis Modal State
  const [selesaiTarget, setSelesaiTarget] = useState(null)
  const [selesaiForm, setSelesaiForm] = useState({ biaya_aktual: '', kapitalisasi: false, tambah_umur_tahun: 0, deskripsi_tambahan: '' })
  const [selesaiSubmitting, setSelesaiSubmitting] = useState(false)

  // State Cetak Surat Nota Dinas Resmi
  const [printNotaDinas, setPrintNotaDinas] = useState(null)
  const [signatory, setSignatory] = useState({
    jabatan: '',
    nama: '',
    pangkat: '',
    nip: '',
  })

  function openPrintNotaDinas(item) {
    const defaults = getUnitDetails(item.unit_kerja)
    setSignatory({
      jabatan: defaults.jabatan,
      nama: item.nama_pemohon && item.nama_pemohon !== 'Staf Pegawai' ? item.nama_pemohon : defaults.nama,
      pangkat: defaults.pangkat,
      nip: item.nip_pemohon || defaults.nip,
    })
    setPrintNotaDinas(item)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [servisRes, mutasiRes, wasrikRes] = await Promise.all([
        axios.get(SERVIS_API),
        axios.get(MUTASI_API),
        axios.get(WASRIK_API),
      ])
      setServisList(Array.isArray(servisRes.data) ? servisRes.data : (servisRes.data?.data || []))
      setMutasiList(Array.isArray(mutasiRes.data) ? mutasiRes.data : (mutasiRes.data?.data || []))
      setWasrikList(Array.isArray(wasrikRes.data) ? wasrikRes.data : (wasrikRes.data?.data || []))
    } catch (err) {
      console.error('Gagal memuat data approval', err)
    } finally {
      setLoading(false)
    }
  }

  // Pending counts
  const safeServisList = Array.isArray(servisList) ? servisList : []
  const safeMutasiList = Array.isArray(mutasiList) ? mutasiList : []
  const safeWasrikList = Array.isArray(wasrikList) ? wasrikList : []

  const pendingServisOperator = safeServisList.filter((s) => s.status === 'diajukan')
  const pendingServisPimpinan = safeServisList.filter((s) => s.status === 'diverifikasi_operator')
  const pendingServis = isOperator
    ? pendingServisOperator
    : isPimpinan
    ? pendingServisPimpinan
    : safeServisList.filter((s) => s.status === 'diajukan' || s.status === 'diverifikasi_operator')

  const pendingMutasi = safeMutasiList.filter((m) => m.status_approval === 'menunggu')
  const pendingWasrik = safeWasrikList.filter((w) => w.status === 'diajukan')

  async function handleConfirmAction(e) {
    e.preventDefault()
    if (!selectedAction) return
    setSubmitting(true)

    const { type, item, category } = selectedAction
    let url = ''
    let payload = {}

    if (category === 'servis_operator') {
      url =
        type === 'approve'
          ? `${SERVIS_API}/${item.id || item._id}/verify`
          : `${SERVIS_API}/${item.id || item._id}/reject-operator`
      payload = {
        catatan_operator: catatan || 'Telah diverifikasi fisik dan diteruskan ke Pimpinan.',
        verified_by_operator: user?.name || 'Operator TU Irwil I',
        estimasi_biaya: estimasiBiaya ? Number(estimasiBiaya) : item.estimasi_biaya,
      }
    } else if (category === 'servis_pimpinan') {
      url =
        type === 'approve'
          ? `${SERVIS_API}/${item.id || item._id}/approve`
          : `${SERVIS_API}/${item.id || item._id}/reject`
      payload = {
        catatan_pimpinan: catatan || 'Disetujui untuk pelaksanaan servis BMN.',
        approved_by_pimpinan: user?.name || 'Inspektur Jenderal Kemendagri',
      }
    } else if (category === 'wasrik') {
      url = `${WASRIK_API}/${item.id || item._id}/${type}`
      payload = {
        catatan_approval: catatan || 'Disetujui untuk tugas wasrik.',
        approved_by: user?.name || 'Inspektur Jenderal Kemendagri',
      }
    } else if (category === 'mutasi') {
      url = `${MUTASI_API}/${item.id || item._id}/${type}`
      payload = {
        catatan_approval: catatan || 'Disetujui.',
        approved_by: user?.name || 'Inspektur Jenderal Kemendagri',
      }
    }

    try {
      await axios.post(url, payload)
      await fetchAll()
      setSelectedAction(null)
      setCatatan('')
      setEstimasiBiaya('')
      const actionLabel = type === 'approve' ? 'disetujui' : 'ditolak'
      showToast.success('Tindakan Berhasil', `Pengajuan berhasil ${actionLabel}.`)
    } catch (err) {
      showAlert.error('Gagal Memproses', err.response?.data?.message || 'Terjadi kesalahan saat memproses tindakan approval.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSelesaiServis(item) {
    setSelesaiForm({
      biaya_aktual: item.estimasi_biaya || '',
      kapitalisasi: false,
      tambah_umur_tahun: 0,
      deskripsi_tambahan: '',
    })
    setSelesaiTarget(item)
  }

  async function handleSelesaiSubmit(e) {
    e.preventDefault()
    if (!selesaiTarget) return
    setSelesaiSubmitting(true)

    const id = selesaiTarget.id || selesaiTarget._id
    const catataRenovasi = Number(selesaiForm.biaya_aktual) > 0

    try {
      await axios.post(`${SERVIS_API}/${id}/selesai`, {
        catat_ke_renovasi: catataRenovasi,
        biaya_aktual: selesaiForm.biaya_aktual ? Number(selesaiForm.biaya_aktual) : null,
        kapitalisasi: selesaiForm.kapitalisasi,
        tambah_umur_tahun: Number(selesaiForm.tambah_umur_tahun) || 0,
        deskripsi_tambahan: selesaiForm.deskripsi_tambahan,
      })
      await fetchAll()
      setSelesaiTarget(null)
      showToast.success(
        'Servis Selesai',
        catataRenovasi
          ? (selesaiForm.kapitalisasi
              ? 'Servis selesai. Renovasi dicatat dan dikapitalisasi ke nilai buku aset.'
              : 'Servis selesai. Riwayat renovasi telah dicatat.')
          : 'Servis selesai. Barang siap digunakan kembali.'
      )
    } catch (err) {
      showAlert.error('Gagal Memperbarui', err.response?.data?.message || 'Gagal memperbarui status servis.')
    } finally {
      setSelesaiSubmitting(false)
    }
  }

  function formatRupiah(num) {
    if (!num) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <Layout>
      <div className={printNotaDinas ? "print:hidden" : ""}>
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="text-navy" size={26} />
              {isOperator ? 'Verifikasi Usulan (TU)' : 'Persetujuan (Approval) Usulan BMN'}
            </h1>
            <p className="text-sm text-ink/50 mt-1">
              {activeTab === 'servis'
                ? 'Validasi usulan perbaikan/servis oleh Staf (Operator ➔ Pimpinan Itjen)'
                : activeTab === 'mutasi'
                ? 'Validasi pemindahan/mutasi lokasi ruangan barang inventaris'
                : 'Persetujuan izin peminjaman perangkat BMN untuk tim tugas wasrik/audit'}
            </p>
          </div>
        </div>



      {/* TAB 1: PENGAJUAN SERVIS BMN (ALUR STAF -> OPERATOR -> PIMPINAN) */}
      {activeTab === 'servis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 bg-gray-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  Daftar Usulan Servis Aset BMN (Alur Bertingkat)
                </h2>
                <p className="text-[11px] text-ink/50 mt-0.5">
                  {isOperator
                    ? 'Tahap 1: Verifikasi usulan dari Staf sebelum diteruskan ke Pimpinan'
                    : isPimpinan
                    ? 'Tahap 2: Persetujuan akhir usulan servis yang telah diverifikasi Operator'
                    : 'Monitoring seluruh proses verifikasi dan persetujuan servis'}
                </p>
              </div>
              <span className="text-xs text-ink/50 font-mono font-bold">
                {pendingServis.length} Antrean
              </span>
            </div>

            <div className="divide-y divide-black/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-ink/40">Memuat data pengajuan servis...</div>
              ) : servisList.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/40">Belum ada pengajuan servis.</div>
              ) : (
                servisList.map((item) => {
                  const isKendaraan = Boolean(item.item?.nomor_polisi || item.item?.kategori_item?.kodeKategori === 'KAT-KND')
                  const namaBarang = item.item?.itemName || item.nama_barang_custom || 'Barang Inventaris'
                  const isPendingOperator = item.status === 'diajukan'
                  const isPendingPimpinan = item.status === 'diverifikasi_operator'

                  return (
                    <div
                      key={item.id || item._id}
                      className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink">{namaBarang}</span>
                          {isKendaraan && (
                            <span className="text-[10px] font-mono font-bold bg-navy text-white px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                              <Car size={11} /> {item.item.nomor_polisi || 'Plat Dinas'}
                            </span>
                          )}
                          {item.item?.itemCode && (
                            <span className="text-xs font-mono text-navy font-semibold px-2 py-0.5 rounded bg-navy/5">
                              {item.item.itemCode} (NUP: {item.item.nup || '0001'})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-ink/60 font-medium">
                            Kategori: {item.kategori_servis}
                          </span>
                          {item.nomor_nota_dinas && (
                            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                              <FileText size={11} className="text-amber-600" /> ND: {item.nomor_nota_dinas}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-ink/70 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-ink/40" /> Pemohon: <strong>{item.nama_pemohon}</strong> ({item.unit_kerja})
                          </span>
                          <span className="flex items-center gap-1 text-ink/60">
                            <MapPin size={12} className="text-ink/40" /> {item.lokasi_barang}
                          </span>
                          <span className="font-mono-ledger text-ink/50">Tgl: {item.tanggal_pengajuan}</span>
                          {item.estimasi_biaya && (
                            <span className="text-emerald-700 font-semibold font-mono-ledger">
                              Est: {formatRupiah(item.estimasi_biaya)}
                            </span>
                          )}
                        </div>

                        <div className="p-2 rounded bg-paper/60 border border-black/5 text-xs text-ink/70">
                          <strong>Uraian Kerusakan:</strong> "{item.deskripsi_kerusakan}"
                        </div>

                        {/* CATATAN HISTORI */}
                        {item.catatan_operator && (
                          <div className="text-[11px] bg-blue-50/70 border border-blue-200 p-2 rounded text-blue-900 mt-1">
                            <strong>Verifikasi Operator ({item.verified_by_operator}):</strong> {item.catatan_operator}
                          </div>
                        )}
                        {item.catatan_pimpinan && (
                          <div className="text-[11px] bg-emerald-50/70 border border-emerald-200 p-2 rounded text-emerald-900 mt-1">
                            <strong>Arahan Pimpinan ({item.approved_by_pimpinan}):</strong> {item.catatan_pimpinan}
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS BERDASARKAN ROLE & STATUS */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* 1. TAHAP OPERATOR */}
                        {isPendingOperator && (isOperator || isAdmin) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAction({
                                  type: 'approve',
                                  item,
                                  category: 'servis_operator',
                                })
                                setCatatan('Telah diverifikasi fisik dan diteruskan ke Pimpinan.')
                                setEstimasiBiaya(item.estimasi_biaya || '')
                              }}
                              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              <Check size={14} /> Verifikasi & Teruskan
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAction({
                                  type: 'reject',
                                  item,
                                  category: 'servis_operator',
                                })
                                setCatatan('')
                              }}
                              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        )}

                        {/* 2. TAHAP PIMPINAN */}
                        {isPendingPimpinan && (isPimpinan || isAdmin) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAction({
                                  type: 'approve',
                                  item,
                                  category: 'servis_pimpinan',
                                })
                                setCatatan('Disetujui untuk perbaikan BMN.')
                              }}
                              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              <Check size={14} /> Setujui Usulan
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAction({
                                  type: 'reject',
                                  item,
                                  category: 'servis_pimpinan',
                                })
                                setCatatan('')
                              }}
                              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        )}

                        {/* STATUS LABEL JIKA BUKAN PENDING */}
                        {!isPendingOperator && !isPendingPimpinan && (
                          <div className="flex items-center gap-2">
                            {(isOperator || isAdmin) && item.status === 'disetujui_pimpinan' && (
                              <button
                                onClick={() => handleSelesaiServis(item)}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                                title="Tandai pekerjaan servis telah tuntas"
                              >
                                <Check size={14} /> Selesaikan Servis
                              </button>
                            )}
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                                item.status === 'disetujui_pimpinan'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'selesai'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : item.status.includes('ditolak')
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-100 text-ink/60'
                              }`}
                            >
                              {item.status === 'disetujui_pimpinan'
                                ? '✓ Disetujui Pimpinan'
                                : item.status === 'selesai'
                                ? '✓ Selesai Diservis'
                                : item.status}
                            </span>
                          </div>
                        )}

                        {/* JIKA OPERATOR MELIHAT STATUS PIMPINAN */}
                        {isPendingPimpinan && isOperator && !isAdmin && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            Sedang Menunggu Pimpinan
                          </span>
                        )}
                        {/* JIKA PIMPINAN MELIHAT STATUS BELUM DIVERIFIKASI */}
                        {isPendingOperator && isPimpinan && !isAdmin && (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                            Menunggu Verifikasi Operator
                          </span>
                        )}

                        {/* TOMBOL CETAK NOTA DINAS */}
                        <button
                          type="button"
                          onClick={() => openPrintNotaDinas(item)}
                          className="inline-flex items-center gap-1.5 border border-navy/30 text-navy hover:bg-navy/5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Dokumen Fisik Nota Dinas Resmi"
                        >
                          <Printer size={13} /> Cetak Nota Dinas
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MUTASI LOKASI */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 bg-gray-50/70 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                Daftar Usulan Mutasi Ruangan BMN
              </h2>
              <span className="text-xs text-ink/40 font-mono">
                {pendingMutasi.length} Menunggu Persetujuan
              </span>
            </div>

            <div className="divide-y divide-black/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-ink/40">Memuat usulan mutasi...</div>
              ) : mutasiList.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/40">Belum ada usulan mutasi ruangan.</div>
              ) : (
                mutasiList.map((m) => {
                  const isPending = m.status_approval === 'menunggu'
                  return (
                    <div key={m.id || m._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="font-bold text-ink text-sm">
                          {m.item?.itemName}{' '}
                          <span className="font-mono text-xs font-normal text-navy">
                            ({m.item?.itemCode} • NUP: {m.item?.nup || '0001'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="text-ink/60">{m.lokasi_asal || 'Lokasi Asal'}</span>
                          <ArrowRight size={13} className="text-navy" />
                          <span className="font-bold text-navy flex items-center gap-1">
                            <MapPin size={12} className="text-gold" /> {m.lokasi_tujuan}
                          </span>
                        </div>

                        <div className="text-xs text-ink/60 pt-0.5">
                          PJ Baru: <strong>{m.penanggung_jawab || '—'}</strong> • Tanggal Mutasi:{' '}
                          <strong>{m.tanggal_mutasi}</strong>
                        </div>

                        {m.keterangan && (
                          <p className="text-xs text-ink/50 italic">Alasan: "{m.keterangan}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() =>
                                setSelectedAction({
                                  type: 'approve',
                                  item: m,
                                  category: 'mutasi',
                                })
                              }
                              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              <Check size={14} /> Setujui Mutasi
                            </button>
                            <button
                              onClick={() =>
                                setSelectedAction({
                                  type: 'reject',
                                  item: m,
                                  category: 'mutasi',
                                })
                              }
                              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        ) : (
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                              m.status_approval === 'disetujui'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {m.status_approval === 'disetujui' ? '✓ Telah Disetujui' : '✕ Ditolak'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PEMINJAMAN WASRIK & KENDARAAN */}
      {activeTab === 'wasrik' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 bg-gray-50/70 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                Daftar Pengajuan Peminjaman BMN Wasrik & Kendaraan Dinas
              </h2>
              <span className="text-xs text-ink/40 font-mono">
                {pendingWasrik.length} Menunggu Persetujuan
              </span>
            </div>

            <div className="divide-y divide-black/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-ink/40">Memuat permohonan...</div>
              ) : wasrikList.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/40">Belum ada pengajuan peminjaman wasrik atau kendaraan dinas.</div>
              ) : (
                wasrikList.map((item) => {
                  const isPending = item.status === 'diajukan'
                  const isKendaraan = item.tipe_peminjaman === 'kendaraan'
                  return (
                    <div key={item.id || item._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isKendaraan ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {isKendaraan ? '🚗 BAST Kendaraan Dinas' : '💻 SIPB Wasrik / IT'}
                          </span>
                          <span className="text-sm font-bold text-ink">{item.nama_peminjam}</span>
                          <span className="text-[11px] text-ink/50 font-mono">({item.nip_peminjam || 'NIP: -'})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-ink/60 font-medium">
                            {item.jabatan_tim || item.unit_kerja}
                          </span>
                        </div>

                        <div className="text-xs text-navy font-semibold flex items-center gap-1.5 flex-wrap">
                          {isKendaraan ? <Car size={14} className="text-amber-700" /> : <Laptop size={14} className="text-blue-700" />}
                          <span>{item.item?.itemName || item.jenis_kendaraan || 'Kendaraan Dinas'}</span>
                          {item.nomor_polisi && (
                            <span className="bg-navy text-white text-[11px] font-mono px-2 py-0.5 rounded font-bold tracking-wider">
                              {item.nomor_polisi}
                            </span>
                          )}
                          <span className="text-ink/40 font-mono font-normal">
                            ({item.item?.itemCode || 'KND'} • NUP: {item.item?.nup || '0001'})
                          </span>
                        </div>

                        <div className="text-xs text-ink/70 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 font-mono-ledger">
                          {item.no_surat_tugas && (
                            <span>Surat Tugas: <strong>{item.no_surat_tugas}</strong></span>
                          )}
                          {item.tujuan_wilayah && (
                            <span>Tujuan / Keperluan: <strong>{item.tujuan_wilayah}</strong></span>
                          )}
                          {item.tanggal_pinjam && (
                            <span>Tgl Pinjam: <strong>{item.tanggal_pinjam}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() =>
                                setSelectedAction({
                                  type: 'approve',
                                  item,
                                  category: 'wasrik',
                                })
                              }
                              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              <Check size={14} /> Setujui
                            </button>
                            <button
                              onClick={() =>
                                setSelectedAction({
                                  type: 'reject',
                                  item,
                                  category: 'wasrik',
                                })
                              }
                              className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI APPROVAL / VERIFIKASI (Google Advanced Search Style) */}
      {selectedAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedAction.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {selectedAction.type === 'approve' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    {selectedAction.category === 'servis_operator'
                      ? selectedAction.type === 'approve'
                        ? 'Verifikasi Usulan Servis (Operator TU)'
                        : 'Tolak Usulan Servis (Operator TU)'
                      : selectedAction.type === 'approve'
                      ? 'Persetujuan Resmi (Pimpinan Itjen)'
                      : 'Konfirmasi Penolakan Usulan'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfirmasi tindakan persetujuan atau penolakan permohonan aset BMN
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* SUBHEADER: INFORMASI OBJEK */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <span className="font-semibold text-slate-700">Objek Permohonan:</span>
              <span className="text-navy font-medium truncate">
                {selectedAction.category.includes('servis')
                  ? `Servis: ${selectedAction.item.item?.itemName || selectedAction.item.nama_barang_custom} (Pemohon: ${selectedAction.item.nama_pemohon}${selectedAction.item.nomor_nota_dinas ? ` • ND: ${selectedAction.item.nomor_nota_dinas}` : ''})`
                  : selectedAction.category === 'wasrik'
                  ? `Peminjaman Alat Wasrik oleh ${selectedAction.item.nama_peminjam}`
                  : `Mutasi ke ${selectedAction.item.lokasi_tujuan}`}
              </span>
            </div>

            <form onSubmit={handleConfirmAction}>
              <div className="p-6 space-y-4">
                {/* ESTIMASI BIAYA HANYA PADA TAHAP OPERATOR */}
                {selectedAction.category === 'servis_operator' && selectedAction.type === 'approve' && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-center">
                    <Label className="sm:col-span-4 text-left sm:text-right text-xs font-medium text-slate-700">
                      Estimasi Biaya:
                    </Label>
                    <div className="sm:col-span-8">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          Rp
                        </span>
                        <Input
                          type="number"
                          placeholder="0 (opsional)"
                          value={estimasiBiaya}
                          onChange={(e) => setEstimasiBiaya(e.target.value)}
                          className="pl-9 h-9 text-xs border-slate-300 focus:border-navy focus:ring-navy/20 rounded-lg"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Perkiraan biaya perbaikan dari vendor / teknisi rekanan</p>
                    </div>
                  </div>
                )}

                {/* CATATAN / ALASAN */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-3 items-start">
                  <Label className="sm:col-span-4 text-left sm:text-right text-xs font-medium text-slate-700 pt-2">
                    {selectedAction.category === 'servis_operator'
                      ? 'Catatan Pemeriksaan:'
                      : selectedAction.type === 'approve'
                      ? 'Arahan / Catatan:'
                      : 'Alasan Penolakan:'}
                  </Label>
                  <div className="sm:col-span-8">
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder={
                        selectedAction.type === 'approve'
                          ? 'Tuliskan catatan arahan atau rekomendasi persetujuan...'
                          : 'Tuliskan alasan penolakan secara jelas...'
                      }
                      rows={3}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAction(null)}
                  className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`text-xs h-9 px-5 rounded-lg shadow-sm text-white ${
                    selectedAction.type === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting
                    ? 'Memproses...'
                    : selectedAction.type === 'approve'
                    ? selectedAction.category === 'servis_operator'
                      ? 'Verifikasi & Teruskan ke Pimpinan'
                      : 'Ya, Setujui Usulan'
                    : 'Tolak Usulan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL SELESAIKAN SERVIS ─── */}
      {selesaiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Selesaikan Servis</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selesaiTarget.item?.itemName || selesaiTarget.nama_barang_custom || 'Aset BMN'}
                </p>
              </div>
              <button onClick={() => setSelesaiTarget(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSelesaiSubmit} className="px-6 py-5 space-y-4">
              {/* Biaya Aktual */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Biaya Aktual Perbaikan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Kosongkan jika tidak ada biaya"
                  value={selesaiForm.biaya_aktual}
                  onChange={e => setSelesaiForm(f => ({ ...f, biaya_aktual: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Estimasi sebelumnya: {selesaiTarget.estimasi_biaya
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selesaiTarget.estimasi_biaya)
                    : '—'}
                </p>
              </div>

              {/* Tambah Umur Ekonomis */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Tambah Masa Manfaat (tahun)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0 = tidak ada penambahan"
                  value={selesaiForm.tambah_umur_tahun}
                  onChange={e => setSelesaiForm(f => ({ ...f, tambah_umur_tahun: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Deskripsi Tambahan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Catatan Penyelesaian (opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Ganti komponen X, kalibrasi ulang, dll."
                  value={selesaiForm.deskripsi_tambahan}
                  onChange={e => setSelesaiForm(f => ({ ...f, deskripsi_tambahan: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Kapitalisasi toggle */}
              {Number(selesaiForm.biaya_aktual) > 0 && (
                <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selesaiForm.kapitalisasi}
                    onChange={e => setSelesaiForm(f => ({ ...f, kapitalisasi: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded accent-amber-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Kapitalisasi ke Nilai Buku</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Centang jika biaya perbaikan ini meningkatkan nilai/kapasitas aset dan harus ditambahkan ke harga perolehan (PSAP 07).
                    </p>
                  </div>
                </label>
              )}

              {/* Info jika biaya kosong */}
              {!(Number(selesaiForm.biaya_aktual) > 0) && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-500">Tanpa biaya aktual, servis akan diselesaikan tanpa mencatat renovasi.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelesaiTarget(null)}
                  className="flex-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selesaiSubmitting}
                  className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
                >
                  {selesaiSubmitting ? 'Menyimpan...' : 'Konfirmasi Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ─── MODAL CETAK NOTA DINAS RESMI KEMENDAGRI ─── */}
      {printNotaDinas && (() => {
        const itemObj = printNotaDinas.item || {}
        const isKendaraan = Boolean(itemObj.nomor_polisi || itemObj.kategori_item?.kodeKategori === 'KAT-KND')
        const namaUnit = isKendaraan
          ? `Kendaraan Operasional (${itemObj.itemName || printNotaDinas.nama_barang_custom || 'Kendaraan Dinas'})`
          : (itemObj.itemName || printNotaDinas.nama_barang_custom || 'Alat Kantor')
        const nomorBmn = itemObj.itemCode || (itemObj.nup ? `NUP ${itemObj.nup}` : '-')
        const merk = itemObj.merk_tipe || (itemObj.itemName ? `${itemObj.itemName} ${itemObj.tipe || ''}`.trim() : (isKendaraan ? 'Yamaha NMAX 155' : '-'))
        const seriDeviceId = isKendaraan
          ? (itemObj.nomor_polisi ? `Plat: ${itemObj.nomor_polisi} (No. Rangka: ${itemObj.nomor_rangka || '-'})` : (itemObj.nomor_seri || `NUP: ${itemObj.nup || '0001'}`))
          : (itemObj.nomor_seri || (itemObj.nup ? `NUP: ${itemObj.nup}` : '-'))
        const keteranganRusak = printNotaDinas.deskripsi_kerusakan || 'Kerusakan / perbaikan pada unit BMN'
        const tglSurat = new Date(printNotaDinas.tanggal_pengajuan || new Date()).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        const noNotaDinas = printNotaDinas.nomor_nota_dinas || `700.1.2/${printNotaDinas.id || 1}/${getUnitDetails(printNotaDinas.unit_kerja).code}`
        const unitNameDisplay = printNotaDinas.unit_kerja || 'Inspektorat Wilayah III'
        const halSurat = isKendaraan
          ? 'Penyampaian Permohonan Pemeliharaan / Perbaikan Kendaraan Dinas Operasional.'
          : 'Penyampaian Permohonan Perbaikan atas Alat Penunjang Operasional Kantor.'

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:border-none print:shadow-none">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 sm:p-10 my-4 sm:my-6 border border-black/10 print:static print:my-0 print:p-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none relative z-[101]">
              
              {/* PRINT TOOLBAR */}
              <div className="sticky -top-6 sm:-top-10 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3.5 bg-white/95 backdrop-blur border-b border-black/10 mb-6 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20 print:hidden shadow-xs">
                <div>
                  <span className="text-xs font-bold text-navy uppercase tracking-wider block">Preview Nota Dinas Servis BMN</span>
                  <span className="text-[11px] text-gray-500">Format Resmi Surat Nota Dinas Inspektorat Jenderal Kemendagri</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintNotaDinas(null)}
                    className="px-3 py-1.5 text-xs text-ink/70 hover:bg-gray-100 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                  <Button
                    onClick={() => window.print()}
                    className="bg-navy hover:bg-navy-light text-white flex items-center gap-1.5 text-xs h-8 px-3.5 shadow-sm cursor-pointer"
                  >
                    <Printer size={14} /> Cetak Nota Dinas (A4)
                  </Button>
                </div>
              </div>

              {/* DOKUMEN FISIK CETAK NOTA DINAS */}
              <div className="doc-print-area font-sans text-black leading-relaxed">
                {/* KOP SURAT */}
                <div className="flex items-start gap-4 pb-2">
                  <img src={logoKemendagri} alt="Logo Kemendagri" className="w-16 h-18 object-contain shrink-0" />
                  <div className="text-center flex-1 pr-6 font-sans">
                    <p className="text-[13px] font-semibold tracking-wider uppercase text-black leading-snug">
                      KEMENTERIAN DALAM NEGERI<br />REPUBLIK INDONESIA
                    </p>
                    <p className="text-[16px] font-bold uppercase tracking-wide text-black mt-0.5">
                      INSPEKTORAT JENDERAL
                    </p>
                    <p className="text-[10px] text-black leading-tight mt-1">
                      Jalan Medan Merdeka Timur nomor 8 Jakarta 10110, Telepon (021) 3846391<br />
                      Fax. (021) 384 9422 Website: www.itjen.kemendagri.go.id
                    </p>
                  </div>
                </div>

                {/* GARIS GANDA KOP SURAT */}
                <div className="border-b-[2.5px] border-black pb-[1px] mb-3">
                  <div className="border-b border-black"></div>
                </div>

                {/* JUDUL NOTA DINAS */}
                <div className="text-center mb-3">
                  <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">
                    NOTA DINAS
                  </h2>
                </div>

                {/* HEADER METADATA NOTA DINAS */}
                <div className="text-[11.5px] leading-relaxed space-y-0.5 font-sans">
                  <div className="flex">
                    <span className="w-24 shrink-0">Yth</span>
                    <span className="w-3 shrink-0">:</span>
                    <div className="flex-1">
                      <p>Sekretaris Inspektorat Jenderal</p>
                      <p className="text-black">c.q. Kepala Bagian Umum dan Keuangan</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="w-24 shrink-0">Dari</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1 font-medium">{signatory.jabatan || 'Inspektur III'}</span>
                  </div>

                  <div className="flex">
                    <span className="w-24 shrink-0">Tanggal</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1">{tglSurat}</span>
                  </div>

                  <div className="flex">
                    <span className="w-24 shrink-0">Nomor</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1 font-mono">{noNotaDinas}</span>
                  </div>

                  <div className="flex">
                    <span className="w-24 shrink-0">Sifat</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1">Segera</span>
                  </div>

                  <div className="flex">
                    <span className="w-24 shrink-0">Lampiran</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1">-</span>
                  </div>

                  <div className="flex items-start">
                    <span className="w-24 shrink-0">Hal</span>
                    <span className="w-3 shrink-0">:</span>
                    <span className="flex-1 font-medium">
                      {halSurat}
                    </span>
                  </div>
                </div>

                {/* GARIS PEMBATAS HEADER */}
                <div className="border-b border-black my-2.5"></div>

                {/* ISI PARAGRAF PEMBUKA */}
                <div className="text-[11.5px] leading-relaxed text-justify space-y-2.5 mt-2">
                  <p className="indent-8">
                    {isKendaraan
                      ? `Dalam rangka mendukung mobilitas dan kelancaran tugas pengawasan para pemeriksa lingkup Inspektorat Jenderal, disampaikan kendaraan dinas operasional berupa ${itemObj.itemName || 'Kendaraan'} Barang Milik Negara (BMN) pada ${unitNameDisplay} yang memerlukan pemeliharaan/servis berkala atau perbaikan atas kerusakan sebagai berikut:`
                      : `Dalam rangka mendukung kinerja para pegawai lingkup Inspektorat Jenderal disampaikan alat operasional penunjang pengolah data berupa ${namaUnit} Barang Milik Negara (BMN) pada ${unitNameDisplay} yang rusak/mengalami trouble untuk mohon dilakukan perbaikan/peningkatan performa atas kerusakan pada unit sebagai berikut:`}
                  </p>

                  {/* DATA RINCIAN UNIT */}
                  <div className="space-y-1 pl-2 text-[11px]">
                    <div className="flex">
                      <span className="w-32 shrink-0">Nama Unit</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="flex-1 font-semibold">{namaUnit}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 shrink-0">Nomor BMN</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="flex-1 font-mono">{nomorBmn}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 shrink-0">Merk / Tipe</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="flex-1">{merk}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 shrink-0">{isKendaraan ? 'Plat / No. Rangka' : 'Seri/Device ID'}</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="flex-1 font-mono">{seriDeviceId}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 shrink-0">Keterangan Servis</span>
                      <span className="w-3 shrink-0">:</span>
                      <span className="flex-1 font-medium text-black">{keteranganRusak}</span>
                    </div>
                  </div>

                  {/* PARAGRAF PENUTUP */}
                  <p className="indent-8 pt-1">
                    Demikian disampaikan dan atas kerja sama yang baik diucapkan terima kasih.
                  </p>

                  {/* TANDA TANGAN PEJABAT */}
                  <div className="pt-6 flex justify-end break-inside-avoid">
                    <div className="w-72 text-left">
                      <p className="font-semibold">{signatory.jabatan || 'Inspektur III,'}</p>
                      
                      {/* RUANG TANDA TANGAN DENGAN SIMULASI PARAF */}
                      <div className="h-20 flex items-center justify-start pl-4">
                        <svg className="w-32 h-14 text-blue-900/80 stroke-current opacity-80" viewBox="0 0 160 70" fill="none">
                          <path d="M10,45 Q35,10 50,42 T90,20 Q120,60 145,25" strokeWidth="2" strokeLinecap="round" />
                          <path d="M40,35 Q70,5 110,48" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>

                      <p className="font-bold underline text-black">{signatory.nama}</p>
                      <p className="text-[10.5px] text-black">{signatory.pangkat}</p>
                      <p className="text-[10.5px] font-mono text-black">NIP. {signatory.nip}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

    </Layout>
  )
}

export default Approval
