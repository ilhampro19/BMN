import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '../lib/api'
import { showToast } from '../lib/alerts'
import { JENIS_BMN_SIFAT_MAP, JENIS_BMN_KATEGORI_MAP } from '../lib/constants'

const IMPORT_API = `${API_BASE_URL}/item/import`

/** Konversi serial date Excel ke tahun */
function excelDateToYear(serial) {
  if (!serial) return null
  if (typeof serial === 'string') {
    const y = parseInt(serial)
    return y > 1900 && y < 2100 ? y : null
  }
  if (typeof serial === 'number' && serial > 1000) {
    const date = new Date((serial - 25569) * 86400 * 1000)
    return date.getUTCFullYear()
  }
  return null
}

/** Deteksi apakah file adalah format master BMN SIMAN (78 kolom, kolom "Jenis BMN" ada) */
function isMasterBMNFormat(headers) {
  const normalized = headers.map((h) => String(h).toLowerCase().trim())
  return normalized.includes('jenis bmn') && normalized.includes('kode barang') && normalized.includes('nup')
}

/** Parse satu baris dari format master SIMAN 78 kolom */
function parseMasterBMNRow(row, headers, kategoriMap) {
  const h = headers.map((x) => String(x).toLowerCase().trim())

  function get(colName) {
    const idx = h.indexOf(colName.toLowerCase().trim())
    return idx >= 0 ? String(row[idx] ?? '').trim() : ''
  }

  const jenisBMN = get('Jenis BMN').toUpperCase()
  const kodeBarang = get('Kode Barang')
  const nup = get('NUP')
  const namaBarang = get('Nama Barang')
  const merk = get('Merk')
  const tipe = get('Tipe')
  const kondisiRaw = get('Kondisi').toLowerCase()
  const lokasiRuang = get('Lokasi Ruang')
  const namaPengguna = get('Nama Pengguna')
  const noPolisi = get('No Polisi')
  const noStnk = get('No STNK')
  const nilaiPerolehan = parseFloat(get('Nilai Perolehan').replace(/[^0-9.]/g, '')) || 0
  const nilaiBuku = parseFloat(get('Nilai Buku').replace(/[^0-9.]/g, '')) || 0
  const tglPerolehanRaw = row[h.indexOf('tanggal perolehan')] ?? ''
  const tahun = excelDateToYear(tglPerolehanRaw) || new Date().getFullYear()

  // Kondisi mapping
  let kondisi = 'baik'
  if (kondisiRaw.includes('berat')) kondisi = 'perhatian'
  else if (kondisiRaw.includes('ringan') || kondisiRaw.includes('sedang')) kondisi = 'evaluasi'

  // Merk/Tipe gabungan
  const merkTipe = [merk, tipe].filter(Boolean).join(' ').trim() || null

  // Sifat aset otomatis dari Jenis BMN
  const sifatAset = JENIS_BMN_SIFAT_MAP[jenisBMN] ?? 'terikat_ruangan'

  // Kategori kode
  const kategoriKode = JENIS_BMN_KATEGORI_MAP[jenisBMN] ?? 'KAT-MBL'
  const kategoriId = kategoriMap[kategoriKode] ?? null

  // itemCode: kombinasi kode barang + NUP agar unik
  const itemCode = `SIMAN-${String(kodeBarang).replace(/\./g, '')}-${String(nup).padStart(4, '0')}`

  // Lokasi: jika kendaraan pakai pool, jika belum berlokasi tetap
  let lokasiRuangan = lokasiRuang || 'Belum berlokasi'
  if (jenisBMN === 'ALAT ANGKUTAN BERMOTOR') lokasiRuangan = 'Pool Kendaraan Dinas Gedung B'

  // Status penggunaan
  const statusPenggunaan = jenisBMN === 'ALAT ANGKUTAN BERMOTOR' ? 'tersedia' : 'digunakan'

  // Jenis kendaraan
  let jenisKendaraan = null
  if (jenisBMN === 'ALAT ANGKUTAN BERMOTOR') {
    if (merkTipe?.toLowerCase().includes('motor') || namaBarang.toLowerCase().includes('motor')) {
      jenisKendaraan = 'Sepeda Motor'
    } else if (merkTipe?.toLowerCase().includes('bus') || namaBarang.toLowerCase().includes('bus')) {
      jenisKendaraan = 'Bus Operasional'
    } else {
      jenisKendaraan = 'Mobil Dinas Operasional'
    }
  }

  return {
    itemCode,
    nup: String(nup).padStart(4, '0'),
    kode_bmn: String(kodeBarang),
    itemName: namaBarang,
    merk_tipe: merkTipe,
    nomor_polisi: noPolisi || null,
    nomor_seri: noStnk || null,
    jenis_kendaraan: jenisKendaraan,
    tahunPerolehan: tahun,
    nilaiPerolehan,
    nilai_buku: nilaiBuku,
    kondisi,
    status_penggunaan: statusPenggunaan,
    sifat_aset: sifatAset,
    lokasi_ruangan: lokasiRuangan,
    unit_kerja: 'Sekretariat Itjen',
    penanggung_jawab: namaPengguna || null,
    kategori_item_id: kategoriId,
  }
}

/** Parse format CSV template internal (format lama) */
function parseCSVRow(row, headers, keyMap) {
  const itemObj = {}
  headers.forEach((h, idx) => {
    const val = row[idx] !== undefined ? String(row[idx]).trim() : ''
    itemObj[h] = val
  })

  if (itemObj.kelengkapan_standar && typeof itemObj.kelengkapan_standar === 'string') {
    itemObj.kelengkapan_standar = itemObj.kelengkapan_standar
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return itemObj
}

function ImportExcelModal({ isOpen, onClose, onSuccess, activeTab = 'umum', kategoriList = [] }) {
  const [parsedItems, setParsedItems] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [isMasterFormat, setIsMasterFormat] = useState(false)

  if (!isOpen) return null

  const isKendaraanTab = activeTab === 'kendaraan'

  // Build kategori code -> id map from list
  const kategoriMap = {}
  ;(kategoriList || []).forEach((k) => {
    if (k.kategoriItemCode) kategoriMap[k.kategoriItemCode] = k.id
  })

  function downloadTemplate() {
    if (isKendaraanTab) {
      const headers = [
        'Kode Barang',
        'NUP',
        'Kode Akun SAKTI',
        'Jenis Kendaraan',
        'Nomor Polisi (Plat)',
        'Nama Armada BMN',
        'Merk / Tipe',
        'No. Rangka (VIN)',
        'No. Mesin',
        'Warna',
        'Kelengkapan Standar',
        'Tahun Perolehan',
        'Nilai Perolehan (Rp)',
        'Kondisi',
        'Status Penggunaan',
        'Unit Kerja',
        'Lokasi Pool Parkir',
        'Penanggung Jawab / Driver',
      ]

      const sampleRows = [
        [
          'BMN-ITJ-2024-MTR01',
          '0001',
          '3.02.01.01.002',
          'Sepeda Motor',
          'B 3240 PJQ',
          'Sepeda Motor Yamaha NMAX 155 (Operasional)',
          'Yamaha All New NMAX 155 B6H AT',
          'MH3SG5620NJ019283',
          'G3N9E-0291823',
          'Hitam',
          'STNK, Kunci Utama, Helm',
          '2024',
          '35500000',
          'baik',
          'tersedia',
          'Sekretariat Itjen',
          'Pool Kendaraan Dinas Gedung B',
          'Subbag Rumah Tangga / Andi (Driver)',
        ],
        [
          'BMN-ITJ-2023-MOB01',
          '0001',
          '3.01.01.01.002',
          'Mobil Dinas Operasional',
          'B 1984 RFS',
          'Toyota Fortuner 2.8 VRZ (Mobil Pengawasan)',
          'Toyota Fortuner 2.8 VRZ A/T',
          'MHFFN43G8P901234',
          '1GD-FTV-839210',
          'Hitam Metalik',
          'STNK, Kunci Utama, Kunci Cadangan, Ban Cadangan, Dongkrak, Tool Kit',
          '2023',
          '590000000',
          'baik',
          'digunakan',
          'Inspektorat Wilayah I',
          'Pool Kendaraan Dinas Gedung B',
          'Joko Susanto (Pengemudi Operasional)',
        ],
      ]

      const csvContent =
        '\uFEFFsep=;\r\n' +
        [headers.join(';'), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(';'))].join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Template_Import_Kendaraan_Dinas_SAKTI_Kemendagri.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    const headers = [
      'Kode Barang',
      'NUP',
      'Kode Akun SAKTI',
      'Nama Barang',
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

    const sampleRows = [
      [
        'BMN-ITJ-2024-LTP01',
        '0001',
        '3.05.01.04.001',
        'Laptop Pengawasan Lenovo ThinkPad T14s',
        'Lenovo ThinkPad T14s Gen 3 Core i7',
        'PF48291X',
        '2024',
        '24500000',
        'baik',
        'digunakan',
        'Inspektorat Wilayah I',
        'L01.04.04 - RUANG KERJA STAF INSPEKTORAT WILAYAH 1',
        'Rahmat Hidayat, S.E. (Auditor Ahli Muda)',
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
        'L01.01.10 - RUANG KERJA STAF SUBAG UMUM & KEUANGAN',
        'Andi Agung Febrianto, S.STP',
      ],
    ]

    const csvContent =
      '\uFEFFsep=;\r\n' +
      [headers.join(';'), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Template_Import_BMN_Umum_SAKTI_Kemendagri.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setResultMsg('')
    setParsedItems([])
    setFileName(file.name)

    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'xlsx' || ext === 'xls') {
      parseExcel(file)
    } else {
      const reader = new FileReader()
      reader.onload = (evt) => parseCSV(evt.target.result)
      reader.onerror = () => setError('Gagal membaca file.')
      reader.readAsText(file)
    }
  }

  /** Parse file Excel (.xlsx/.xls) — mendukung format master BMN SIMAN 78 kolom */
  function parseExcel(file) {
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]

        // Fix range jika perlu
        const cellKeys = Object.keys(ws).filter((k) => !k.startsWith('!'))
        if (cellKeys.length > 0) {
          let maxR = 0, maxC = 0
          cellKeys.forEach((k) => {
            const dec = XLSX.utils.decode_cell(k)
            if (dec.r > maxR) maxR = dec.r
            if (dec.c > maxC) maxC = dec.c
          })
          ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } })
        }

        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (rawData.length < 2) {
          setError('File kosong atau tidak memiliki baris data.')
          return
        }

        const headers = rawData[0]
        const dataRows = rawData.slice(1)

        if (isMasterBMNFormat(headers)) {
          // ===== FORMAT MASTER BMN SIMAN =====
          setIsMasterFormat(true)
          const items = []
          dataRows.forEach((row) => {
            const jenisBMN = String(row[headers.map(h => String(h).toLowerCase()).indexOf('jenis bmn')] ?? '').toUpperCase()
            const kodeBarang = String(row[headers.map(h => String(h).toLowerCase()).indexOf('kode barang')] ?? '').trim()
            const namaBarang = String(row[headers.map(h => String(h).toLowerCase()).indexOf('nama barang')] ?? '').trim()

            if (!namaBarang || !kodeBarang) return

            const parsed = parseMasterBMNRow(row, headers, kategoriMap)
            if (parsed.itemName) items.push(parsed)
          })

          if (items.length === 0) {
            setError('Tidak ada baris data valid ditemukan dalam file master BMN.')
          } else {
            setParsedItems(items)
          }
        } else {
          // ===== FORMAT TEMPLATE INTERNAL CSV/XLSX =====
          setIsMasterFormat(false)
          processStandardRows(headers, dataRows)
        }
      } catch (err) {
        setError('Gagal memproses file Excel. Pastikan format file valid.')
      }
    }
    reader.onerror = () => setError('Gagal membaca file Excel.')
    reader.readAsArrayBuffer(file)
  }

  function splitCSVRow(line, delimiter) {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  function parseCSV(text) {
    try {
      let lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        setError('File kosong atau tidak memiliki baris data.')
        return
      }
      if (lines[0].toLowerCase().startsWith('sep=')) lines = lines.slice(1)
      if (lines.length < 2) {
        setError('File tidak memiliki baris data setelah header.')
        return
      }

      const headerLine = lines[0]
      const semicolonCount = (headerLine.match(/;/g) || []).length
      const commaCount = (headerLine.match(/,/g) || []).length
      const delimiter = semicolonCount >= commaCount ? ';' : ','

      const rawHeaders = splitCSVRow(headerLine, delimiter).map((h) => h.replace(/['"]/g, '').trim())
      const dataRows = lines.slice(1).map((line) => splitCSVRow(line, delimiter).map((v) => v.replace(/^"|"$/g, '').trim()))

      if (isMasterBMNFormat(rawHeaders)) {
        setIsMasterFormat(true)
        const items = []
        dataRows.forEach((row) => {
          const parsed = parseMasterBMNRow(row, rawHeaders, kategoriMap)
          if (parsed.itemName) items.push(parsed)
        })
        if (items.length === 0) {
          setError('Tidak ada baris data valid dalam file master BMN.')
        } else {
          setParsedItems(items)
        }
      } else {
        setIsMasterFormat(false)
        processStandardRows(rawHeaders, dataRows)
      }
    } catch (err) {
      setError('Gagal memproses format file CSV.')
    }
  }

  function processStandardRows(rawHeaders, dataRows) {
    const keyMap = {
      'kode barang': 'itemCode',
      itemcode: 'itemCode',
      kode: 'itemCode',
      nup: 'nup',
      'kode akun sakti': 'kode_bmn',
      'kode sakti': 'kode_bmn',
      kode_sakti: 'kode_bmn',
      kode_bmn: 'kode_bmn',
      'kode akun': 'kode_bmn',
      'nama barang': 'itemName',
      itemname: 'itemName',
      'uraian barang': 'itemName',
      'nama armada bmn': 'itemName',
      'nama armada': 'itemName',
      nama: 'itemName',
      'jenis kendaraan': 'jenis_kendaraan',
      jenis: 'jenis_kendaraan',
      'nomor polisi': 'nomor_polisi',
      'nomor polisi (plat)': 'nomor_polisi',
      'no polisi': 'nomor_polisi',
      'merk/tipe': 'merk_tipe',
      'merk / tipe': 'merk_tipe',
      merk: 'merk_tipe',
      tipe: 'merk_tipe',
      'nomor seri': 'nomor_seri',
      'nomor seri (sn)': 'nomor_seri',
      sn: 'nomor_seri',
      'no rangka (vin)': 'no_rangka',
      'nomor rangka': 'no_rangka',
      'no rangka': 'no_rangka',
      vin: 'no_rangka',
      'no mesin': 'no_mesin',
      'nomor mesin': 'no_mesin',
      warna: 'warna',
      'kelengkapan standar': 'kelengkapan_standar',
      kelengkapan: 'kelengkapan_standar',
      'tahun perolehan': 'tahunPerolehan',
      tahun: 'tahunPerolehan',
      'nilai perolehan': 'nilaiPerolehan',
      'nilai perolehan (rp)': 'nilaiPerolehan',
      nilai: 'nilaiPerolehan',
      'nilai buku': 'nilai_buku',
      kondisi: 'kondisi',
      'status penggunaan': 'status_penggunaan',
      status: 'status_penggunaan',
      'unit kerja': 'unit_kerja',
      'lokasi ruangan': 'lokasi_ruangan',
      'lokasi pool parkir': 'lokasi_ruangan',
      lokasi: 'lokasi_ruangan',
      ruangan: 'lokasi_ruangan',
      pool: 'lokasi_ruangan',
      'penanggung jawab': 'penanggung_jawab',
      'penanggung jawab / driver': 'penanggung_jawab',
      pengemudi: 'penanggung_jawab',
      driver: 'penanggung_jawab',
    }

    const mappedHeaders = rawHeaders.map((h) => keyMap[h.toLowerCase()] || h.toLowerCase())
    const items = []

    dataRows.forEach((row) => {
      if (row.length < 2) return
      const obj = {}
      mappedHeaders.forEach((h, idx) => {
        obj[h] = row[idx] ?? ''
      })
      if (obj.itemName && obj.itemCode) {
        if (obj.kelengkapan_standar && typeof obj.kelengkapan_standar === 'string') {
          obj.kelengkapan_standar = obj.kelengkapan_standar.split(',').map((s) => s.trim()).filter(Boolean)
        }
        items.push(obj)
      }
    })

    if (items.length === 0) {
      setError('Tidak ada baris data valid. Pastikan kolom Kode Barang dan Nama Barang terisi.')
    } else {
      setParsedItems(items)
    }
  }

  async function handleImportSubmit() {
    if (parsedItems.length === 0) return
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(IMPORT_API, { items: parsedItems })
      setResultMsg(res.data.message || 'Impor data berhasil.')
      showToast.success('Impor BMN Berhasil', res.data.message || `${parsedItems.length} aset BMN berhasil diimpor.`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengimpor data ke server.'
      setError(msg)
      showToast.error('Gagal Impor', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center text-navy shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {isKendaraanTab
                  ? 'Impor SAKTI – Kendaraan Dinas (Alat Angkutan Bermotor)'
                  : 'Impor SAKTI / SIMAN – Peralatan, TIK & Mebel BMN'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKendaraanTab
                  ? 'Format standar penatausahaan BMN Kemenkeu untuk motor dan mobil dinas operasional'
                  : 'Mendukung file master SIMAN 78 kolom (Daftar Aset BMN) atau template CSV internal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">
                  {isKendaraanTab ? 'Format: Alat Angkutan Bermotor' : 'Format: Master SIMAN atau Template Internal'}
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {isKendaraanTab
                    ? 'Kolom wajib: Kode Barang, NUP, Plat Nomor, Merk/Tipe, Rangka, Mesin.'
                    : 'Bisa langsung upload file "Daftar Aset Barang BMN.xlsx" dari SIMAN/DJKN (78 kolom) atau gunakan template CSV.'}
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 bg-navy text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-navy-light shadow-xs cursor-pointer transition-colors"
                >
                  <Download size={14} /> Unduh Template {isKendaraanTab ? 'Kendaraan' : 'BMN'}
                </button>
              </div>
            </div>
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
            <p className="text-xs text-ink/50 mt-1">
              Mendukung <strong>.xlsx</strong> (SIMAN 78 kolom) dan <strong>.csv</strong> (template internal, pemisah ; atau ,)
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

          {/* BADGE format terdeteksi */}
          {parsedItems.length > 0 && isMasterFormat && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Format Master SIMAN terdeteksi</strong> — Klasifikasi sifat aset (Stasioner/Mobile) dan kategori
                BMN diterapkan otomatis.
              </span>
            </div>
          )}

          {/* PREVIEW TABLE */}
          {parsedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-ink mb-2">
                Pratinjau Data:{' '}
                <span className="text-navy">{parsedItems.length.toLocaleString('id-ID')} Aset Siap Diimpor</span>
              </p>
              <div className="max-h-52 overflow-y-auto border border-black/10 rounded-lg text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-ink/60 sticky top-0">
                    <tr>
                      <th className="p-2">Kode / NUP</th>
                      <th className="p-2">Nama Barang</th>
                      <th className="p-2">Merk/Tipe / Plat</th>
                      <th className="p-2">Lokasi</th>
                      <th className="p-2">Tahun</th>
                      <th className="p-2">Sifat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {parsedItems.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2 font-mono text-[10px]">
                          {row.kode_bmn || row.itemCode}
                          <br />
                          <span className="text-ink/50">NUP: {row.nup || '0001'}</span>
                        </td>
                        <td className="p-2 font-semibold text-ink max-w-[140px] truncate">{row.itemName}</td>
                        <td className="p-2">
                          {row.nomor_polisi ? (
                            <span className="inline-block bg-navy text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                              {row.nomor_polisi}
                            </span>
                          ) : (
                            <span className="text-ink/70">{row.merk_tipe || '-'}</span>
                          )}
                        </td>
                        <td className="p-2 text-navy max-w-[120px] truncate">
                          {row.lokasi_ruangan || row.unit_kerja || '-'}
                        </td>
                        <td className="p-2">{row.tahunPerolehan || '-'}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              row.sifat_aset === 'bergerak'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.sifat_aset === 'bergerak' ? 'Mobile' : 'Stasioner'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 10 && (
                <p className="text-[10px] text-ink/40 mt-1 italic">
                  * Menampilkan 10 dari {parsedItems.length.toLocaleString('id-ID')} baris data.
                </p>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={handleImportSubmit}
            disabled={parsedItems.length === 0 || loading}
            className="bg-navy hover:bg-navy-light text-white text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer"
          >
            {loading
              ? 'Memproses Impor...'
              : `Impor ${parsedItems.length.toLocaleString('id-ID')} Aset ke Sistem`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImportExcelModal
