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
  DollarSign
} from 'lucide-react'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const WASRIK_API = `${API_BASE_URL}/peminjaman-wasrik`
const MUTASI_API = `${API_BASE_URL}/mutasi-lokasi`
const SERVIS_API = `${API_BASE_URL}/pengajuan-servis`

function Approval() {
  const { user } = useAuth()
  const isOperator = user?.role === 'operator'
  const isPimpinan = user?.role === 'pimpinan'
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState('servis') // 'servis' | 'mutasi' | 'wasrik'
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
      setServisList(servisRes.data)
      setMutasiList(mutasiRes.data)
      setWasrikList(wasrikRes.data)
    } catch (err) {
      console.error('Gagal memuat data approval', err)
    } finally {
      setLoading(false)
    }
  }

  // Pending counts
  const pendingServisOperator = servisList.filter((s) => s.status === 'diajukan')
  const pendingServisPimpinan = servisList.filter((s) => s.status === 'diverifikasi_operator')
  const pendingServis = isOperator
    ? pendingServisOperator
    : isPimpinan
    ? pendingServisPimpinan
    : servisList.filter((s) => s.status === 'diajukan' || s.status === 'diverifikasi_operator')

  const pendingMutasi = mutasiList.filter((m) => m.status_approval === 'menunggu')
  const pendingWasrik = wasrikList.filter((w) => w.status === 'diajukan')

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
    } catch (err) {
      alert('Gagal memproses tindakan approval.')
    } finally {
      setSubmitting(false)
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-ink/40 mb-1">
            {isOperator ? 'Wewenang Operator TU' : 'Wewenang Pimpinan'} <span className="mx-1">›</span>
            <span className="text-navy font-medium">Verifikasi & Approval Berjenjang</span>
          </p>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="text-navy" size={26} />
            Persetujuan (Approval) Usulan BMN
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Validasi usulan servis oleh Staf (Operator ➔ Pimpinan), mutasi ruangan, dan peminjaman tugas
          </p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-3 border-b border-black/10 mb-6">
        <button
          onClick={() => setActiveTab('servis')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'servis'
              ? 'border-navy text-navy'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Wrench size={16} />
          <span>Pengajuan Servis Staf</span>
          {pendingServis.length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {pendingServis.length} Menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'mutasi'
              ? 'border-navy text-navy'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <MapPin size={16} />
          <span>Usulan Mutasi Ruangan</span>
          {pendingMutasi.length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {pendingMutasi.length} Menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wasrik')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'wasrik'
              ? 'border-navy text-navy'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Laptop size={16} />
          <span>Peminjaman Wasrik</span>
          {pendingWasrik.length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {pendingWasrik.length} Menunggu
            </span>
          )}
        </button>
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

      {/* TAB 3: PEMINJAMAN WASRIK */}
      {activeTab === 'wasrik' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 bg-gray-50/70 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                Daftar Pengajuan Peminjaman Wasrik
              </h2>
              <span className="text-xs text-ink/40 font-mono">
                {pendingWasrik.length} Menunggu Persetujuan
              </span>
            </div>

            <div className="divide-y divide-black/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-ink/40">Memuat permohonan wasrik...</div>
              ) : wasrikList.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/40">Belum ada pengajuan peminjaman wasrik.</div>
              ) : (
                wasrikList.map((item) => {
                  const isPending = item.status === 'diajukan'
                  return (
                    <div key={item.id || item._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink">{item.nama_peminjam}</span>
                          <span className="text-[11px] text-ink/50 font-mono">({item.nip_peminjam || 'NIP: -'})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-ink/60 font-medium">
                            {item.jabatan_tim}
                          </span>
                        </div>

                        <div className="text-xs text-navy font-semibold flex items-center gap-1">
                          <Laptop size={13} />
                          <span>{item.item?.itemName}</span>
                          <span className="text-ink/40 font-mono font-normal">
                            ({item.item?.itemCode} • NUP: {item.item?.nup || '0001'})
                          </span>
                        </div>

                        <div className="text-xs text-ink/70 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono-ledger">
                          <span>Surat Tugas: <strong>{item.no_surat_tugas}</strong></span>
                          <span>Tujuan: <strong>{item.tujuan_wilayah}</strong></span>
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
    </Layout>
  )
}

export default Approval
