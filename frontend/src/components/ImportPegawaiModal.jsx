import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '../lib/api'
import { showToast } from '../lib/alerts'

const IMPORT_API = `${API_BASE_URL}/pegawai/import`

export default function ImportPegawaiModal({ isOpen, onClose, onSuccess }) {
  const [parsedItems, setParsedItems] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  if (!isOpen) return null

  function downloadTemplate() {
    const headers = [
      'No',
      'Nama',
      'NIP',
      'Jabatan',
      'Unit Kerja',
      'Status Kepegawaian',
      'No HP',
      'Email',
      'Keterangan',
    ]

    const sampleRows = [
      [
        1,
        'Dr. Muhamad Nur, ME, CRGP, CGCAE, CFrA',
        '19700305 199303 1 001',
        'Sekretaris pada Inspektorat Jenderal Kementerian Dalam Negeri',
        'Sekretariat Itjen',
        'PNS',
        '081234567890',
        'muhamad.nur@kemendagri.go.id',
        'Pimpinan Eselon II',
      ],
      [
        2,
        'Fernando, S.P., M.A.P',
        '19791219 201001 1 012',
        'Pengawas Penyelenggaraan Urusan Pemerintahan Daerah Ahli Muda Pada Inspektorat III',
        'Inspektorat Wilayah III',
        'PNS',
        '081298765432',
        'fernando@kemendagri.go.id',
        'Auditor PPUPD',
      ],
      [
        3,
        'Andy Prakoso',
        '-',
        'PTT Administrasi Pada Subbagian Umum Pada Bagian Umum dan Keuangan',
        'Sekretariat Itjen',
        'PTT / Non-ASN',
        '081311223344',
        'andy.prakoso@kemendagri.go.id',
        'Staf Administrasi',
      ],
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai')
    XLSX.writeFile(wb, `Template_Import_Data_Pegawai_Itjen_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setResultMsg('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (!jsonRows || jsonRows.length <= 1) {
          setError('File kosong atau tidak memiliki baris data.')
          return
        }

        // Cari index kolom dari header (baris 0)
        const headerRow = jsonRows[0].map((h) => String(h || '').trim().toLowerCase())
        
        let idxNama = headerRow.findIndex((h) => h.includes('nama'))
        let idxNip = headerRow.findIndex((h) => h === 'nip' || h.includes('nip'))
        let idxJabatan = headerRow.findIndex((h) => h.includes('jabatan'))
        let idxUnit = headerRow.findIndex((h) => h.includes('unit') || h.includes('satker'))
        let idxStatus = headerRow.findIndex((h) => h.includes('status'))
        let idxHp = headerRow.findIndex((h) => h.includes('hp') || h.includes('telepon') || h.includes('telp'))
        let idxEmail = headerRow.findIndex((h) => h.includes('email') || h.includes('surel'))
        let idxKet = headerRow.findIndex((h) => h.includes('keterangan') || h.includes('ket'))

        // Fallback default format sesuai Data Pegawai.xlsx jika index tidak ditemukan
        if (idxNama === -1 && jsonRows[0].length >= 5) {
          idxNama = 4
          idxNip = 5
          idxJabatan = 6
          idxKet = 14
        }

        const items = []
        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i]
          if (!row || row.length === 0) continue

          const rawNama = row[idxNama >= 0 ? idxNama : 4]
          if (!rawNama) continue

          const nama = String(rawNama).trim()
          if (!nama || nama.toLowerCase() === 'nama' || nama.toLowerCase().includes('total')) continue

          const rawNip = idxNip >= 0 ? row[idxNip] : row[5]
          let nip = rawNip ? String(rawNip).trim() : ''
          if (nip === '-' || nip === '0' || nip.toLowerCase() === 'null') {
            nip = ''
          }

          const rawJabatan = idxJabatan >= 0 ? row[idxJabatan] : row[6]
          const jabatan = rawJabatan ? String(rawJabatan).trim() : ''

          let unitKerja = idxUnit >= 0 && row[idxUnit] ? String(row[idxUnit]).trim() : ''
          if (!unitKerja) {
            if (jabatan.includes('Inspektorat I') || jabatan.includes('Irwil I')) unitKerja = 'Inspektorat Wilayah I'
            else if (jabatan.includes('Inspektorat II') || jabatan.includes('Irwil II')) unitKerja = 'Inspektorat Wilayah II'
            else if (jabatan.includes('Inspektorat III') || jabatan.includes('Irwil III')) unitKerja = 'Inspektorat Wilayah III'
            else if (jabatan.includes('Inspektorat IV') || jabatan.includes('Irwil IV')) unitKerja = 'Inspektorat Wilayah IV'
            else if (jabatan.includes('Inspektorat Khusus') || jabatan.includes('Iksus')) unitKerja = 'Inspektorat Khusus'
            else unitKerja = 'Sekretariat Itjen'
          }

          let status = idxStatus >= 0 && row[idxStatus] ? String(row[idxStatus]).trim() : ''
          if (!status) {
            status = nip && nip.length >= 8 ? 'PNS' : 'PTT / Non-ASN'
          }

          const noHp = idxHp >= 0 && row[idxHp] ? String(row[idxHp]).trim() : ''
          const email = idxEmail >= 0 && row[idxEmail] ? String(row[idxEmail]).trim() : ''
          const ket = idxKet >= 0 && row[idxKet] ? String(row[idxKet]).trim() : ''

          items.push({
            nama,
            nip: nip || null,
            jabatan: jabatan || null,
            unit_kerja: unitKerja,
            status,
            no_hp: noHp || null,
            email: email || null,
            keterangan: ket || null,
          })
        }

        // Deduplikasi berdasarkan nama / nip
        const uniqueMap = new Map()
        items.forEach((item) => {
          const key = item.nip || item.nama.toLowerCase()
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item)
          }
        })
        const finalItems = Array.from(uniqueMap.values())

        if (finalItems.length === 0) {
          setError('Tidak ada data pegawai valid yang terbaca dari file.')
        } else {
          setParsedItems(finalItems)
        }
      } catch (err) {
        console.error(err)
        setError('Format file tidak didukung atau rusak. Pastikan file berformat .xlsx, .xls, atau .csv')
      }
    }

    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    if (parsedItems.length === 0) return
    setLoading(true)
    setError('')
    setResultMsg('')

    try {
      const res = await axios.post(IMPORT_API, { items: parsedItems })
      showToast.success('Import Berhasil', res.data.message || `${parsedItems.length} pegawai berhasil diimpor.`)
      setResultMsg(res.data.message || `Berhasil mengimpor ${parsedItems.length} data pegawai.`)
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat mengunggah data ke server.'
      setError(msg)
      showToast.error('Gagal Import Data', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 bg-navy text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="text-gold" size={22} />
            <div>
              <h2 className="text-base font-bold text-white">Import Data Pegawai dari Excel</h2>
              <p className="text-xs text-white/70">
                Unggah file Excel (.xlsx, .xls, .csv) untuk memasukkan daftar pegawai secara massal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* PETUNJUK & TEMPLATE */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <UserCheck size={16} className="text-navy" />
                Format File yang Didukung
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mendukung file Excel <strong>Data Pegawai.xlsx</strong> resmi Itjen maupun template standar (Kolom: Nama, NIP, Jabatan, Unit Kerja, Status).
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold shadow-xs shrink-0 cursor-pointer text-xs"
            >
              <Download size={14} className="text-emerald-600" />
              Unduh Template Excel
            </button>
          </div>

          {/* DROPZONE / FILE INPUT */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-navy transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              id="file-pegawai-input"
              className="hidden"
            />
            <label
              htmlFor="file-pegawai-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-navy/10 text-navy flex items-center justify-center">
                <UploadCloud size={24} />
              </div>
              <div className="text-xs font-bold text-slate-800">
                {fileName ? (
                  <span className="text-navy">{fileName}</span>
                ) : (
                  <span>Pilih atau Drag &amp; Drop File Excel (.xlsx, .xls, .csv)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Klik untuk memilih file dari komputer Anda
              </p>
            </label>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS RESULT */}
          {resultMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* PREVIEW TABLE */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>Pratinjau Data yang Terbaca:</span>
                  <span className="px-2 py-0.5 rounded-full bg-navy/10 text-navy font-mono text-[11px]">
                    {parsedItems.length} Pegawai
                  </span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  {parsedItems.filter((p) => p.status === 'PNS').length} PNS • {parsedItems.filter((p) => p.status !== 'PNS').length} Non-ASN/PTT
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">No</th>
                      <th className="px-3 py-2">Nama Pegawai</th>
                      <th className="px-3 py-2">NIP</th>
                      <th className="px-3 py-2">Jabatan</th>
                      <th className="px-3 py-2">Unit Kerja</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{p.nama}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{p.nip || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{p.jabatan || '-'}</td>
                        <td className="px-3 py-2 text-navy font-semibold">{p.unit_kerja || '-'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'PNS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedItems.length > 0 ? `${parsedItems.length} data siap diimpor ke database` : 'Pilih file excel terlebih dahulu'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={parsedItems.length === 0 || loading}
              className="bg-navy hover:bg-navy-light text-white text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              {loading ? 'Mengimpor...' : `Impor ${parsedItems.length} Data Pegawai`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
