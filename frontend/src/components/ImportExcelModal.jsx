import { useState } from 'react'
import axios from 'axios'
import { X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '../lib/api'

const IMPORT_API = `${API_BASE_URL}/item/import`

function ImportExcelModal({ isOpen, onClose, onSuccess }) {
  const [parsedItems, setParsedItems] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  if (!isOpen) return null

  function downloadTemplate() {
    const headers = [
      'itemCode',
      'nup',
      'kode_bmn',
      'itemName',
      'merk_tipe',
      'nomor_seri',
      'tahunPerolehan',
      'nilaiPerolehan',
      'kondisi',
      'status_penggunaan',
      'unit_kerja',
      'lokasi_ruangan',
      'penanggung_jawab',
    ]

    const sampleRows = [
      [
        'BMN-ITJ-2024-LTP99',
        '0001',
        '3.05.01.04.001',
        'Laptop Pengawasan Lenovo ThinkPad L14',
        'Lenovo ThinkPad L14 Gen 4',
        'PF9821X4',
        '2024',
        '18500000',
        'baik',
        'digunakan',
        'Inspektorat Wilayah I',
        'Lantai 3 - Ruang Auditor Fungsional Irwil I',
        'Bambang Wijaya, S.E.',
      ],
      [
        'BMN-ITJ-2024-PRN01',
        '0001',
        '3.05.01.04.004',
        'Printer Laser Multifungsi Kantor',
        'HP LaserJet Pro MFP 4103fdw',
        'VNC384210',
        '2024',
        '8900000',
        'baik',
        'digunakan',
        'Sekretariat Itjen',
        'Lantai 2 - Ruang Subbag Pengelolaan BMN & Rumah Tangga',
        'Subbag BMN & RT',
      ],
    ]

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Template_Import_BMN_SAKTI_Itjen.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setResultMsg('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      parseCSV(text)
    }
    reader.onerror = () => {
      setError('Gagal membaca file.')
    }
    reader.readAsText(file)
  }

  function parseCSV(text) {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        setError('File kosong atau tidak memiliki baris data.')
        return
      }

      const headers = lines[0].split(',').map((h) => h.replace(/["']/g, '').trim())
      const items = []

      for (let i = 1; i < lines.length; i++) {
        // Regex split csv considering quoted values
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',')
        if (row.length < 2) continue

        const itemObj = {}
        headers.forEach((h, idx) => {
          const val = row[idx] ? row[idx].replace(/^"|"$/g, '').trim() : ''
          itemObj[h] = val
        })

        if (itemObj.itemName && itemObj.itemCode) {
          items.push(itemObj)
        }
      }

      if (items.length === 0) {
        setError('Tidak ada baris yang valid ditemukan. Pastikan kolom itemName dan itemCode terisi.')
      } else {
        setParsedItems(items)
      }
    } catch (err) {
      setError('Gagal memproses format file CSV/Excel.')
    }
  }

  async function handleImportSubmit() {
    if (parsedItems.length === 0) return
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(IMPORT_API, { items: parsedItems })
      setResultMsg(res.data.message || 'Impor data berhasil.')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengimpor data ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center text-navy shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Impor Data Aset BMN Massal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah file hasil ekspor SAKTI Kemenkeu atau format Excel / CSV standar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-xs text-blue-900">
            <div>
              <p className="font-semibold text-sm">Gunakan Format Kolom Standar BMN</p>
              <p className="text-blue-700 mt-0.5">
                Unggah file hasil ekspor SAKTI Kemenkeu atau unduh template resmi di sebelah kanan.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1 bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-light shrink-0 ml-3"
            >
              <Download size={13} /> Unduh Template CSV
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {resultMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* FILE UPLOADER */}
          <div className="border-2 border-dashed border-black/15 rounded-xl p-6 text-center hover:border-navy transition-colors bg-gray-50/50">
            <UploadCloud size={36} className="mx-auto text-navy/60 mb-2" />
            <p className="text-sm font-semibold text-ink">
              {fileName ? fileName : 'Pilih atau Tarik File CSV / Excel ke Sini'}
            </p>
            <p className="text-xs text-ink/50 mt-1">Mendukung format .csv standar UTF-8</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="mt-3 inline-block bg-white border border-black/10 px-4 py-2 rounded-lg text-xs font-semibold text-navy hover:bg-gray-50 cursor-pointer shadow-sm"
            >
              Cari File di Komputer
            </label>
          </div>

          {/* PREVIEW TABLE */}
          {parsedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-ink mb-2">
                Pratinjau Data: <span className="text-navy">{parsedItems.length} Aset Siap Diimpor</span>
              </p>
              <div className="max-h-48 overflow-y-auto border border-black/10 rounded-lg text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-ink/60 sticky top-0">
                    <tr>
                      <th className="p-2">Kode</th>
                      <th className="p-2">NUP</th>
                      <th className="p-2">Nama Barang</th>
                      <th className="p-2">Merk/Tipe</th>
                      <th className="p-2">Unit Kerja</th>
                      <th className="p-2">Tahun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {parsedItems.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2 font-mono font-medium">{row.itemCode}</td>
                        <td className="p-2 font-mono">{row.nup || '0001'}</td>
                        <td className="p-2 font-semibold text-ink">{row.itemName}</td>
                        <td className="p-2 text-ink/70">{row.merk_tipe || '-'}</td>
                        <td className="p-2 text-navy">{row.unit_kerja || 'Sekretariat Itjen'}</td>
                        <td className="p-2">{row.tahunPerolehan || '2024'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 10 && (
                <p className="text-[10px] text-ink/40 mt-1 italic">
                  * Menampilkan 10 dari {parsedItems.length} baris data.
                </p>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </Button>
          <Button
            onClick={handleImportSubmit}
            disabled={parsedItems.length === 0 || loading}
            className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm"
          >
            {loading ? 'Memproses Impor...' : `Impor ${parsedItems.length} Aset ke Sistem`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImportExcelModal
